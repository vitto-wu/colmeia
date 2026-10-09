# Colmeia

**Cada setor censitário é uma célula. Cada célula precisa de gente se organizando.**

A Colmeia conecta pessoas e agentes de IA para fortalecer a organização local nas eleições de 2026.
O mapa mostra, setor por setor, onde abstenção, brancos e nulos superam a diferença entre Lula e Flávio.
Escolha seu setor e entre no grupo local.
Já tem um grupo? Envie o link de convite; os admins revisam antes de publicar.

- **Site:** https://colmeiabrasil.github.io/colmeia/
- **Especificação:** [`SPEC.md`](SPEC.md)
- **Como contribuir:** [`CONTRIBUTING.md`](CONTRIBUTING.md)
- **Memória, análises e scripts dos dados:** [colmeiabrasil/wiki](https://github.com/colmeiabrasil/wiki)
- **Ferramentas e materiais:** [diretório da wiki](https://github.com/colmeiabrasil/wiki/tree/main/diretorio)
- **Agentes:** [`AGENTS.md`](AGENTS.md)
- **Como participar:** [`recursos.md`](recursos.md)

## Como funciona

| Peça | Onde |
|---|---|
| Quadros (Markdown, um por nível) | `celulas/BR.md`, `celulas/SP/index.md`, `celulas/SP/municipios/71072.md`, `celulas/SP/zonas/001.md` |
| Links de grupos (protegidos) | `_data/grupos/SP/setores/<CD_SETOR>.yml`, `_data/grupos/SP/index.yml` etc. |
| Estimativas por setor (só o PMTiles usa Git LFS: `git lfs pull`) | `dados/setores.pmtiles`, `dados/setores/`, `dados/municipios/`, `dados/locais/` |
| IDs válidos de setor | `dados/setores_ids.txt.gz` |
| Dados gerados do TSE | `dados/celulas.json`, `dados/busca/<UF>.json` |
| Checagens dos PRs | `pipeline/` |
| Formulários e Actions | `.github/` |
| Edição sem GitHub (admins) | `.pages.yml` (Pages CMS) |

A interface de cada célula mostra somente grupos e a opção de enviar um convite.
Arquivos de quadros permanecem no pipeline por compatibilidade; não aparecem no site.

## Desenvolvimento

```sh
pip install -r pipeline/requirements.txt
python -m pytest pipeline/testes -q
python pipeline/checar.py celulas/BR.md     # mesma checagem do CI
```

Os dados em `dados/` são gerados pelos scripts da [wiki](https://github.com/colmeiabrasil/wiki).

Site local: rode `bundle exec jekyll serve` (gem `github-pages`) ou qualquer Jekyll 3.10+. O catálogo em `diretorio.md` é uma cópia publicada de `diretorio/README.md` da wiki; ao editar a fonte, copie o arquivo para este checkout e envie a atualização por PR. A wiki é privada, por isso o build usa a cópia versionada e não exige acesso entre repositórios.

## Configuração no GitHub (uma vez)

1. **Pages:** Settings → Pages → Source: **GitHub Actions**. O workflow `site.yml` gera os dados por setor
   e publica o site.
2. **Actions:** Settings → Actions → General → marcar *Allow GitHub Actions to create and approve pull requests*.
3. **Regra de branch em `main`:** exigir PR, exigir a checagem `checar`, exigir *review from Code Owners*
   (protege `_data/grupos/`). Ative *Allow auto-merge* se for usar a mescla automática.
4. **Admins:** troque `@belisards` em `.github/CODEOWNERS` pelo time de admins.
5. **Opcional:** variável `AUTO_MERGE_TEXTO=true` liga a mescla automática de mudanças só de texto
   que passam nas checagens. A Action `atualizado.yml` faz push na `main` para carimbar datas: se a
   regra de branch bloquear, libere o `github-actions[bot]` na regra.
6. **Pages CMS:** conecte o repositório em https://app.pagescms.org e convide admins por e-mail.
