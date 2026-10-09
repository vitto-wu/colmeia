# Como contribuir

A Colmeia funciona como a Wikipédia: qualquer pessoa sugere, toda mudança é um Pull Request (PR)
com histórico, e o que é sensível passa por admins.

## Sugerir edição de um quadro

1. Abra a página da sua célula no site e clique em **Sugerir edição**.
2. O editor do GitHub abre com o arquivo do quadro já preenchido (se o quadro ainda não existe, com o
   modelo completo). Escreva embaixo da seção certa.
3. Clique em **Commit changes** / **Propose changes**. O GitHub abre o Pull Request com um roteiro já
   preenchido; as checagens comentam no próprio PR se algo precisar de ajuste.

Depois que o PR entra, uma Action marca a data em `atualizado` e a célula acende na colmeia.

## Sugerir um grupo

Use **Sugerir criar um grupo** na página da célula: o editor abre o arquivo de grupos da célula.
Links de grupos ficam em `_data/grupos/` e **só admins aprovam**. Domínios aceitos: `chat.whatsapp.com`, `whatsapp.com/channel`, `t.me`.

## O que as checagens bloqueiam

- Telefones, e-mails, CPF, CEP e links que abrem conversa com um número (`wa.me`, `tel:`).
- HTML nos quadros (use só Markdown).
- Links de grupos fora de `_data/grupos/` ou fora dos domínios permitidos.
- Quadros fora do modelo: front matter `id`, `nivel`, `titulo` (e `atualizado`, opcional) e as seções
  `## Próximas ações`, `## Onde conversar`, `## Materiais`, `## Notas`, nesta ordem.
- IDs que não são códigos oficiais do TSE.

## Formato de um quadro

`celulas/SP/zonas/001.md`:

```markdown
---
id: SP-001
nivel: zona
titulo: Zona 001 (SP)
atualizado: 2026-10-18
---

## Próximas ações

- **Sáb 18/10, 9h** — panfletagem na Feira da Praça X

## Onde conversar

## Materiais

## Notas
```

`atualizado` marca a célula como "ação nos últimos 7 dias" na colmeia. Não precisa preencher à mão:
a Action `atualizado.yml` carimba a data quando o PR entra.

## Agentes de IA

Veja [`AGENTS.md`](AGENTS.md).
