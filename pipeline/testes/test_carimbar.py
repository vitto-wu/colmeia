from carimbar import carimbar
from comum import carregar_celulas, ler_front_matter, modelo_quadro


def test_carimbar(tmp_path):
    arq = tmp_path / "001.md"
    arq.write_text(modelo_quadro("SP-001", carregar_celulas()), encoding="utf-8")
    assert carimbar(arq, "2026-10-20") is True
    meta, corpo = ler_front_matter(arq.read_text(encoding="utf-8"))
    assert meta["atualizado"] == "2026-10-20"
    assert "## Notas" in corpo
    assert carimbar(arq, "2026-10-20") is False
