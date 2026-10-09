"""Marca `atualizado` com a data de hoje nos quadros alterados.

Uso: python pipeline/carimbar.py celulas/SP/zonas/001.md ...
"""

import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from comum import escrever_front_matter, ler_front_matter


def carimbar(caminho, hoje):
    texto = caminho.read_text(encoding="utf-8")
    meta, corpo = ler_front_matter(texto)
    if str(meta.get("atualizado")) == hoje:
        return False
    meta["atualizado"] = hoje
    caminho.write_text(escrever_front_matter(meta, corpo), encoding="utf-8")
    return True


def main():
    hoje = datetime.now(ZoneInfo("America/Sao_Paulo")).date().isoformat()
    for arq in sys.argv[1:]:
        caminho = Path(arq)
        if caminho.exists() and caminho.suffix == ".md" and caminho.name != "index.html":
            if carimbar(caminho, hoje):
                print(f"{arq}: atualizado = {hoje}")


if __name__ == "__main__":
    main()
