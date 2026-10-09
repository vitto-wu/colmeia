# Instruções para agentes

Antes de trabalhar, leia `SPEC.md`, este arquivo e tudo em `memoria/` da
[wiki](https://github.com/colmeiabrasil/wiki).

## Onde fica cada coisa

- **colmeia** (este repositório): site, mapa, dados gerados (`dados/`), quadros e grupos.
- **[wiki](https://github.com/colmeiabrasil/wiki):** memória, análises, execuções, fichas de fontes
  e os scripts que geram `dados/`. Registros de execução e análises vão para lá, com as regras do
  `AGENTS.md` de lá.
- **[diretório da wiki](https://github.com/colmeiabrasil/wiki/tree/main/diretorio):** lista de ferramentas e materiais
  externos, exibida na aba Como participar.

## Regras

- **Fluxo de contribuição.** Use Pull Request por padrão. Quando o proprietário autorizar explicitamente, agentes podem atualizar a branch principal diretamente após as checagens, sem pedir confirmação novamente.
- **Nenhum dado pessoal.** Nada de nomes de pessoas, telefones, e-mails, CPF, CEP ou endereços
  de pessoas. Só dados agregados e lugares públicos. Nada de perfilamento individual.
- **IDs oficiais:** setor censitário do IBGE `355030805000001` (a célula); do TSE `BR`, `SP`,
  `SP-71072` (município), `SP-001` (zona). Listas válidas: `dados/setores_ids.txt.gz` e `dados/celulas.json`.
- **Quadros** (`celulas/`): seções fixas `## Próximas ações`, `## Onde conversar`, `## Materiais`,
  `## Notas`, nesta ordem. Grupos nunca vão no quadro; ficam em `_data/grupos/` e só admins aprovam.
- Rode `python pipeline/checar.py <arquivos>` antes de abrir o PR. É a mesma checagem do CI.
