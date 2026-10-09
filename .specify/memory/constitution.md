# Colmeia Constitution

## Core Principles

### I. Só GitHub
Repositório + GitHub Pages + GitHub Actions. Nenhum servidor próprio. Toda exceção
(ex.: um Cloudflare Worker para sugestões sem conta) precisa de justificativa escrita
no plano da funcionalidade antes de ser adotada.

### II. Aberto como a Wikipédia, com as proteções da Wikipédia
Qualquer pessoa lê e sugere. Toda mudança é um Pull Request, com histórico e reversão.
O que é sensível (links de grupos) é protegido por `CODEOWNERS` e aprovação obrigatória
de admin.

### III. Nenhum dado pessoal (INEGOCIÁVEL)
Sem nomes, telefones, e-mails, CPF ou endereços de pessoas. Só lugares públicos e links
de grupos. Todo PR passa por checagem automática; reprovação explica o motivo em português.

### IV. Identificadores oficiais
Zonas e municípios usam os códigos do TSE (`SG_UF`, `CD_MUNICIPIO`, `NR_ZONA`). IDs:
`BR`, `SP`, `SP-71072` (município), `SP-001` (zona). Nada de IDs inventados.

### V. Pessoas e agentes no mesmo fluxo
Agente não escreve direto: abre PR, identificado como agente (`autor: agente:<modelo>`),
com `status: rascunho` até revisão humana.

### VI. Celular primeiro
O público chega pelo WhatsApp, no celular. Páginas leves (sem framework JS), legíveis em 3G;
dados carregados sob demanda.

### VII. Simples antes de esperto
Markdown, arquivos estáticos, Jekyll nativo do Pages. Python só no pipeline de dados e nas
Actions. Sem build complexo.

### VIII. Interface em português
Todo texto visível, formulário e mensagem de checagem é em português do Brasil.

## Restrições adicionais

- Domínios permitidos para grupos: `chat.whatsapp.com`, `whatsapp.com/channel`, `t.me`.
- Dados gerados (`dados/`) são reproduzíveis pelo pipeline a partir de fonte oficial
  registrada em `inteligencia/fontes/`.

## Fluxo de trabalho

- Toda mudança entra por PR; checagens em `.github/workflows/checagens.yml` são obrigatórias.
- Mescla automática só para mudanças de texto em quadros que passam nas checagens, e só
  quando ligada pela variável do repositório `AUTO_MERGE_TEXTO`.
- Grupos nunca são mesclados automaticamente.
- Sugestões entram pelo editor do GitHub pré-preenchido (link "Sugerir edição"), que abre o PR direto.

## Governance

Esta constituição prevalece sobre outras práticas. Emendas entram por PR que altera este
arquivo e `SPEC.md`, com justificativa. Planos de funcionalidade devem checar conformidade
com cada princípio.

**Version**: 1.0.0 | **Ratified**: 2026-10-07 | **Last Amended**: 2026-10-07
