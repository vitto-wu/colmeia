import io
import json
import urllib.error

import pytest

import llm

ENV = {"LLM_API_KEY": "chave-teste"}


class Resposta:
    def __init__(self, corpo):
        self.corpo = json.dumps(corpo).encode("utf-8")

    def read(self):
        return self.corpo

    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False


def falso_urlopen(respostas, chamadas):
    """Devolve cada item de `respostas` em ordem; exceções são lançadas."""
    fila = list(respostas)

    def abrir(req, timeout):
        chamadas.append(req)
        item = fila.pop(0)
        if isinstance(item, Exception):
            raise item
        return Resposta(item)

    return abrir


def erro_http(codigo):
    return urllib.error.HTTPError("u", codigo, "erro", {}, io.BytesIO(b'{"error":"x"}'))


def test_kimi_via_openrouter_e_padrao():
    cfg = llm.configuracao(ENV)
    assert cfg["provedor"] == "openrouter"
    assert cfg["base_url"] == "https://openrouter.ai/api/v1"
    assert cfg["modelo"].startswith("moonshotai/kimi")


def test_outro_modelo_no_openrouter():
    assert llm.configuracao({**ENV, "LLM_MODELO": "deepseek/deepseek-chat"})["modelo"] == "deepseek/deepseek-chat"


def test_kimi_direto():
    cfg = llm.configuracao({**ENV, "LLM_PROVEDOR": "kimi"})
    assert cfg["base_url"] == "https://api.moonshot.ai/v1"


def test_sobrescritas():
    cfg = llm.configuracao({**ENV, "LLM_PROVEDOR": "DeepSeek", "LLM_MODELO": "m", "LLM_BASE_URL": "http://x/v1/"})
    assert (cfg["provedor"], cfg["modelo"], cfg["base_url"]) == ("deepseek", "m", "http://x/v1")


@pytest.mark.parametrize("env, trecho", [
    ({}, "LLM_API_KEY"),
    ({**ENV, "LLM_PROVEDOR": "nada"}, "desconhecido"),
    ({**ENV, "LLM_PROVEDOR": "glm"}, "LLM_MODELO"),
])
def test_configuracao_invalida(env, trecho):
    with pytest.raises(llm.ErroLLM, match=trecho):
        llm.configuracao(env)


def test_conversar_envia_corpo_e_devolve_mensagem():
    chamadas = []
    msg = {"role": "assistant", "content": "oi"}
    abrir = falso_urlopen([{"choices": [{"message": msg}]}], chamadas)
    ferramentas = [{"type": "function", "function": {"name": "f", "parameters": {}}}]
    cfg = llm.configuracao(ENV)

    assert llm.conversar([{"role": "user", "content": "x"}], ferramentas, cfg=cfg, abrir=abrir, temperature=0.3) == msg

    req = chamadas[0]
    assert req.full_url == "https://openrouter.ai/api/v1/chat/completions"
    assert req.get_header("Authorization") == "Bearer chave-teste"
    corpo = json.loads(req.data)
    assert corpo["model"] == cfg["modelo"]
    assert corpo["tools"] == ferramentas
    assert corpo["temperature"] == 0.3


def test_repete_em_429(monkeypatch):
    monkeypatch.setattr(llm.time, "sleep", lambda s: None)
    chamadas = []
    abrir = falso_urlopen([erro_http(429), {"choices": [{"message": {"content": "ok"}}]}], chamadas)
    assert llm.perguntar("x", cfg=llm.configuracao(ENV), abrir=abrir) == "ok"
    assert len(chamadas) == 2


def test_nao_repete_em_401(monkeypatch):
    monkeypatch.setattr(llm.time, "sleep", lambda s: None)
    chamadas = []
    abrir = falso_urlopen([erro_http(401)], chamadas)
    with pytest.raises(llm.ErroLLM, match="401"):
        llm.perguntar("x", cfg=llm.configuracao(ENV), abrir=abrir)
    assert len(chamadas) == 1


def test_resposta_inesperada():
    abrir = falso_urlopen([{"error": "?"}], [])
    with pytest.raises(llm.ErroLLM, match="inesperada"):
        llm.perguntar("x", cfg=llm.configuracao(ENV), abrir=abrir)


def test_modelos():
    chamadas = []
    abrir = falso_urlopen([{"data": [{"id": "b"}, {"id": "a"}]}], chamadas)
    assert llm.modelos(cfg=llm.configuracao(ENV), abrir=abrir) == ["a", "b"]
    assert chamadas[0].get_method() == "GET"


def test_ler_env_nao_sobrescreve(tmp_path, monkeypatch):
    arq = tmp_path / ".env"
    arq.write_text('# comentário\nLLM_API_KEY="do-arquivo"\nLLM_PROVEDOR=deepseek\n', encoding="utf-8")
    monkeypatch.setenv("LLM_PROVEDOR", "kimi")
    monkeypatch.delenv("LLM_API_KEY", raising=False)
    llm.ler_env(arq)
    assert llm.os.environ["LLM_API_KEY"] == "do-arquivo"
    assert llm.os.environ["LLM_PROVEDOR"] == "kimi"
