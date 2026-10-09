"""Conector para LLMs com API compatível com a da OpenAI.

Padrão: Kimi via OpenRouter (uma chave dá acesso também a DeepSeek, Qwen, GLM etc.;
basta trocar LLM_MODELO, ex.: deepseek/deepseek-chat). Também fala direto com cada provedor.

Configuração por variáveis de ambiente (ou arquivo .env na raiz, fora do Git):

    LLM_PROVEDOR   openrouter (padrão) | kimi | deepseek | glm | qwen
    LLM_API_KEY    chave do provedor (obrigatória)
    LLM_MODELO     sobrescreve o modelo padrão do provedor
    LLM_BASE_URL   sobrescreve a URL da API

Uso:
    python pipeline/llm.py "pergunta"
    python pipeline/llm.py --modelos      # lista os modelos que a chave acessa

Só envie dados agregados: nada de dado pessoal sai daqui (ver AGENTS.md).
"""

import json
import os
import sys
import time
import urllib.error
import urllib.request

from comum import RAIZ

PROVEDORES = {
    "openrouter": {"base_url": "https://openrouter.ai/api/v1", "modelo": "moonshotai/kimi-k2.6"},
    "kimi": {"base_url": "https://api.moonshot.ai/v1", "modelo": "kimi-k2.6"},
    "deepseek": {"base_url": "https://api.deepseek.com", "modelo": "deepseek-chat"},
    "glm": {"base_url": "https://api.z.ai/api/paas/v4", "modelo": None},
    "qwen": {"base_url": "https://dashscope-intl.aliyuncs.com/compatible-mode/v1", "modelo": "qwen-plus"},
}

REPETIR = {429, 500, 502, 503, 504}


class ErroLLM(Exception):
    pass


def ler_env(caminho=RAIZ / ".env"):
    """Lê CHAVE=valor de um .env simples, sem sobrescrever o ambiente."""
    if not caminho.exists():
        return
    for linha in caminho.read_text(encoding="utf-8").splitlines():
        linha = linha.strip()
        if not linha or linha.startswith("#") or "=" not in linha:
            continue
        chave, valor = linha.split("=", 1)
        os.environ.setdefault(chave.strip(), valor.strip().strip("\"'"))


def configuracao(env=None):
    env = os.environ if env is None else env
    provedor = env.get("LLM_PROVEDOR", "openrouter").lower()
    if provedor not in PROVEDORES:
        raise ErroLLM(f"LLM_PROVEDOR desconhecido: {provedor} (use {', '.join(PROVEDORES)})")
    padrao = PROVEDORES[provedor]
    chave = env.get("LLM_API_KEY")
    if not chave:
        raise ErroLLM("Defina LLM_API_KEY (no ambiente ou no .env).")
    modelo = env.get("LLM_MODELO") or padrao["modelo"]
    if not modelo:
        raise ErroLLM(f"O provedor {provedor} não tem modelo padrão: defina LLM_MODELO.")
    base_url = (env.get("LLM_BASE_URL") or padrao["base_url"]).rstrip("/")
    return {"provedor": provedor, "chave": chave, "modelo": modelo, "base_url": base_url}


def _requisicao(cfg, metodo, caminho, corpo=None, tentativas=3, timeout=120, abrir=urllib.request.urlopen):
    dados = json.dumps(corpo).encode("utf-8") if corpo is not None else None
    req = urllib.request.Request(
        cfg["base_url"] + caminho,
        data=dados,
        method=metodo,
        headers={"Authorization": "Bearer " + cfg["chave"], "Content-Type": "application/json"},
    )
    for tentativa in range(tentativas):
        try:
            with abrir(req, timeout=timeout) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            detalhe = e.read().decode("utf-8", "replace")[:500]
            if e.code in REPETIR and tentativa < tentativas - 1:
                time.sleep(2 ** tentativa)
                continue
            raise ErroLLM(f"{cfg['provedor']} respondeu {e.code}: {detalhe}") from e
        except urllib.error.URLError as e:
            if tentativa < tentativas - 1:
                time.sleep(2 ** tentativa)
                continue
            raise ErroLLM(f"Falha de rede com {cfg['provedor']}: {e.reason}") from e


def conversar(mensagens, ferramentas=None, cfg=None, abrir=urllib.request.urlopen, **extras):
    """Envia a conversa e devolve a mensagem do assistente (dict com content e, se houver, tool_calls).

    `extras` vai direto no corpo (temperature, max_tokens etc.).
    """
    cfg = cfg or configuracao()
    corpo = {"model": cfg["modelo"], "messages": mensagens, **extras}
    if ferramentas:
        corpo["tools"] = ferramentas
    resp = _requisicao(cfg, "POST", "/chat/completions", corpo, abrir=abrir)
    try:
        return resp["choices"][0]["message"]
    except (KeyError, IndexError, TypeError) as e:
        raise ErroLLM(f"Resposta inesperada de {cfg['provedor']}: {json.dumps(resp)[:500]}") from e


def perguntar(texto, sistema=None, **kw):
    """Atalho: uma pergunta, uma resposta em texto."""
    mensagens = [{"role": "system", "content": sistema}] if sistema else []
    mensagens.append({"role": "user", "content": texto})
    return conversar(mensagens, **kw).get("content") or ""


def modelos(cfg=None, abrir=urllib.request.urlopen):
    cfg = cfg or configuracao()
    resp = _requisicao(cfg, "GET", "/models", abrir=abrir)
    return sorted(m["id"] for m in resp.get("data", []))


def main():
    ler_env()
    args = sys.argv[1:]
    if not args:
        print(__doc__.strip())
        return 2
    try:
        if args == ["--modelos"]:
            print("\n".join(modelos()))
        else:
            print(perguntar(" ".join(args)))
    except ErroLLM as e:
        print(e, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
