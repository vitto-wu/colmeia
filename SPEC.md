# Colmeia — Especificação

> Documento-fonte do produto. Alimenta o fluxo do Spec Kit:
> `/speckit-constitution` (seção 2) → `/speckit-specify` (seções 3–7, por fase) → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`.

## 1. Visão

**Cada setor censitário é uma célula. Cada célula precisa de gente se organizando.**

A Colmeia conecta a inteligência coletiva de pessoas e agentes de IA para fortalecer a organização local. O setor censitário do IBGE é o pedaço de território que uma pessoa conhece a pé: algumas quadras, poucas centenas de domicílios. Cada setor mostra quem está se organizando ali (grupos) e o que os dados públicos dizem sobre ele (resultado estimado, abstenção, brancos e nulos), para orientar onde conversar.

O ciclo central:

1. **Encontre seu setor** — pelo mapa, por cidade, bairro, rua ou local de votação.
2. **Veja o território** — resultado estimado do setor e dos vizinhos, e onde a disputa está apertada.
3. **Entre** — no grupo do setor ou, se não houver, sugira o link do seu grupo.
4. **Converse** — nos setores onde brancos, nulos e abstenções superam a diferença.

Meta: no ar, nacional, a tempo de ser útil no 2º turno (25/10/2026).

**Revisão de produto em 2026-10-08:** a unidade de organização passa de zona eleitoral para setor censitário (Censo 2022), em todo o país, e os dados eleitorais agregados por setor (antes Fase 2) entram já. Método de referência: [deltafolha/eleicoes-por-setores-censitarios](https://github.com/deltafolha/eleicoes-por-setores-censitarios).

## 2. Princípios (base para a constituição)

1. **Só GitHub.** Repositório + GitHub Pages + GitHub Actions. Nenhum servidor próprio. Toda exceção precisa de justificativa escrita.
2. **Aberto como a Wikipédia, com as proteções da Wikipédia.** Qualquer pessoa lê e sugere; toda mudança é um Pull Request com histórico e reversão; o que é sensível é protegido.
3. **Nenhum dado pessoal.** Sem nomes, telefones, e-mails, CPF ou endereços de pessoas. Só lugares públicos e links de grupos. Checagem automática em todo PR.
4. **Identificadores oficiais.** Setores usam o código do IBGE (`CD_SETOR`); UFs, municípios e zonas usam os códigos do TSE; nada de IDs inventados.
5. **Pessoas e agentes no mesmo fluxo.** Por padrão, o agente abre PR, identificado como agente, e humano revisa. Autorização explícita do proprietário permite atualização direta após as checagens, sem reconfirmação.
6. **Celular primeiro.** O público chega pelo WhatsApp, no celular. Páginas leves, legíveis em 3G.
7. **Simples antes de esperto.** Markdown, arquivos estáticos, Jekyll do Pages. O único build pesado é o pipeline de dados geográficos, que roda numa Action e publica arquivos estáticos (seção 8).
8. **Interface em português.**

## 3. Conceitos

### 3.1 Células e níveis

| Nível | ID | Fonte | Quantidade |
|---|---|---|---|
| Brasil | `BR` | — | 1 |
| UF | `SP` (`SG_UF`) | TSE | 27 (+ `ZZ`, exterior, fora do mapa) |
| Município | `SP-71072` (`SG_UF` + `CD_MUNICIPIO` do TSE) | TSE | 5.571 |
| Setor (célula) | `355030805000001` (`CD_SETOR` do IBGE, 15 dígitos) | IBGE, Censo 2022 | ~450 mil |
| Zona (auxiliar) | `SP-001` (`SG_UF` + `NR_ZONA` com 3 dígitos) | TSE | 2.641 |

- **Setor é a célula.** Tem polígono oficial (malha de setores do Censo 2022), cabe numa caminhada e é estável entre eleições.
- O `CD_SETOR` já contém o código IBGE do município (7 primeiros dígitos). A ligação com o município do TSE usa uma tabela de correspondência IBGE ↔ TSE gerada pelo pipeline e registrada em `fontes/` da [wiki](https://github.com/colmeiabrasil/wiki).
- **Zona vira auxiliar.** Continua existindo porque seções e locais de votação pertencem a zonas e porque a pessoa pode buscar pelo local onde vota. Não é mais unidade de organização.
- O setor não tem resultado eleitoral próprio: a urna é da seção, no local de votação. O resultado do setor é uma **estimativa** a partir dos locais de votação mais próximos (3.4).

Fontes: malha `BR_setores_CD2022` (IBGE); `eleitorado_local_votacao` 2022 e 2026, `votacao_secao` e `detalhe_votacao_secao` 2022 e 2026 (TSE, dados abertos).

### 3.2 Grupos por setor

- Cada setor pode ter grupos (WhatsApp, Telegram). Ficam em `_data/grupos/<UF>/setores/<CD_SETOR>.yml`, protegidos; só admins aprovam.
- Grupos de município, UF e Brasil continuam nos níveis acima (`_data/grupos/<UF>/index.yml` etc.).
- **Herança:** o painel do setor mostra os grupos do próprio setor e, abaixo, os grupos dos setores vizinhos (que tocam o polígono), do município e do estado. A maioria dos setores começa vazia; os níveis de cima evitam o painel em branco.
- Quadros em Markdown (`celulas/`) ficam só por compatibilidade, como na revisão de 2026-10-07: não aparecem no site.

### 3.3 Home: o mapa

A home é o mapa, em tela cheia, adaptando a linguagem visual do [mapa de resultados por vizinhança](https://mapa.danielmariani.com.br/) (inspirado no "Extremely Detailed Map" do NYT). Adaptamos o desenho, não o código.

- **Fundo claro e discreto** (estilo vetorial tipo Positron), sem POIs nem transporte. Água e vias desenhadas **acima** das manchas: as vias brancas finas dividem os setores; rótulos de lugar e rua escurecidos, com halo branco.
- **Setores contínuos**, preenchimento ~90% de opacidade, contorno na mesma cor do preenchimento (sem frestas brancas). Municípios como forro na visão nacional e sempre por baixo, para nunca ficar vazio se um tile de setores falhar.
- **Cartão principal** (canto superior esquerdo): seletor de camadas no topo, título, busca (cidade, bairro, rua, escola), legenda ampla com escala numérica e explicação das cores.
- **Compartilhamento:** um único botão de 44 × 44 px nos controles do mapa, sempre visível, inclusive com o painel aberto no celular. Compartilha o setor selecionado ou a vista atual pelo menu nativo do aparelho, com cópia do link como alternativa.
- **Duas camadas:** Potencial de votos (padrão) e Variação 2022 → 2026. A variação usa azul para queda, vermelho para aumento e tom claro para estabilidade; cinza indica ausência de comparação confiável. As abas Quem venceu, Lula 2026, Lula 2022 e Organização foram retiradas na revisão de 2026-10-09.
- **Hover** (desktop): tooltip com o resumo do setor. **Toque/clique**: painel do setor.
- **Painel do setor**, "resposta primeiro, prova sob demanda": bairro e município, **votos para Lula vencer** em destaque no topo, só por setor (ver 3.4), abstenção/brancos/nulos, barra de resultado como apoio; números sempre arredondados para inteiros, variação, **grupos do setor**, com o formulário "Enviar link do meu grupo" dentro desse bloco, antes dos grupos vizinhos. Abstenção e brancos/nulos aparecem em cartões separados de consulta, sem metas de campanha. Sem a seção de urnas ou marcadores numerados. No celular vira folha inferior.
- **Menu principal**: Mapa, Como participar, Metodologia (modal) e Wiki (link direto ao GitHub). Sem caixa de créditos sobre o mapa; fontes TSE e IBGE descritas no modal, atribuição cartográfica preservada no mapa. Células continua acessível por URL, mas sai do menu.
- Abertura: visão nacional; "usar minha localização" só com permissão explícita (sem geolocalização por IP).
- Zoom e localização no canto superior direito.

Chamado à ação no cartão quando há um município em foco: *"Em Campinas, 1.240 setores têm potencial de votos para virar e só 38 têm grupo. Comece o seu."*

### 3.4 Estimativa por setor (método)

Reimplementação em Python do método da Folha (o repositório de referência não tem licença; não copiamos código, só seguimos o método e citamos a fonte):

1. **Locais de votação georreferenciados** — coordenadas do TSE (`NR_LATITUDE`, `NR_LONGITUDE`) de cada eleição. Locais sem coordenada (`-1`) ficam fora; a cobertura é registrada por município. Sem geocodificação por serviço pago.
2. **Ligação setor ↔ locais** — para cada setor, calcula a distância de cada local de votação do município ao polígono do setor; agrupa em faixas de 100 m (dentro ou até 100 m, 100–200 m, …) e fica com os locais da faixa mais próxima. Um local pode servir vários setores.
3. **Agregação** — soma, por setor, os votos de todas as seções dos locais ligados, separadamente para cada eleição e turno (2026 T1, 2022 T2). Guarda percentuais simples e ponderados pelo inverso da distância do local ao centroide do setor; o site usa o ponderado.
4. **Comparecimento** — de `detalhe_votacao_secao`: aptos, comparecimento, abstenções, brancos e nulos, agregados da mesma forma.
5. **Comparação 2022 → 2026** — só quando os locais ligados ao setor nas duas eleições são basicamente os mesmos (pelo menos metade dos locais, por coordenada arredondada a ~50 m, em comum). Caso contrário, "sem comparação confiável".
6. **Qualidade** — cada setor guarda a distância da faixa usada e o número de locais. Acima de 2 km o site marca "estimativa fraca"; sem nenhum local no município, "sem estimativa".

Como um local alimenta vários setores, somas de votos entre setores **não** são aditivas: o site mostra percentuais e nunca soma setores para chegar ao município (o total do município vem direto das seções).

**Votos para Lula vencer** (`vm`, só no painel do setor): estimativa de eleitores que precisariam trocar Flávio por Lula para ele passar à frente nos locais ligados ao setor — metade da diferença, mais um (cada troca tira um de Flávio e soma um para Lula); zero quando Lula já lidera; `null` sem estimativa. A diferença percentual ponderada do setor é aplicada aos válidos, sem peso, dos locais ligados. Não se soma entre setores. O site não mostra totais de município nem nacional.

### 3.5 Abas do site

1. **Mapa** (home) — seção 3.3. O painel do setor tem link próprio (`/#setor=<CD_SETOR>`) para compartilhar no WhatsApp. A busca por cidade, escola ou rua gera um link com posição, zoom e camada; o ícone de compartilhamento compartilha a vista atual. O texto do endereço não entra no link.
2. **Células** (fora do menu principal) — busca textual e lista de setores, municípios e UFs, para quem não quer usar o mapa.
3. **Como participar** — orientação e diretório de ferramentas, mantido em [diretório da wiki](https://github.com/colmeiabrasil/wiki/tree/main/diretorio) e publicado por uma cópia versionada em `diretorio.md` neste repositório.

## 4. Fase 1 — Setores (escopo agora)

### Histórias de usuário

**US1 — Encontrar meu setor (P1)**
Como pessoa que quer ajudar, digito minha cidade, bairro, rua ou o nome da escola onde voto e chego ao meu setor no mapa.
- Cidade e UF resolvidas localmente; rua e "usar minha localização" pelo geocodificador configurado (Photon), com as regras de privacidade de `memoria/2026-10-07-mapa-e-busca-territorial.md` na wiki.
- Buscar um local de votação centraliza o mapa nele e destaca os setores ligados a ele.
- Funciona sem login.

**US2 — Ver o setor (P1)**
Como pessoa no meu setor, vejo bairro, município, resultado estimado de 2026 T1 e 2022 T2, abstenção, brancos e nulos, quantos votos precisam mudar de lado para Lula vencer, e se há potencial de votos para virar.
- Indica que é estimativa, quantos locais de votação foram usados e a distância.
- Lista os grupos do setor, dos vizinhos, do município e do estado.
- Link direto `/#setor=<CD_SETOR>` para compartilhar no WhatsApp. A busca por cidade, escola ou rua gera um link com posição, zoom e camada; o ícone de compartilhamento compartilha a vista atual. O texto do endereço não entra no link.

**US3 — Ver onde conversar (P1)**
Como pessoa organizando, vejo no mapa os setores com potencial de votos para virar perto de mim e quais já têm grupo.
- Modo de cor "Potencial de votos" é o padrão.
- Lista "Perto de você": até 10 setores com mais espaço num raio de 2 km do ponto escolhido.

**US4 — Grupos protegidos (P1)**
Como admin, adiciono e altero links de grupos de setor. Como pessoa comum, sugiro um grupo.
- Sugestão abre uma issue com o `CD_SETOR` preenchido; só admins publicam em `_data/grupos/` por PR.
- Só domínios permitidos: `chat.whatsapp.com`, `whatsapp.com/channel`, `t.me`.
- O `CD_SETOR` precisa existir na malha (checagem do CI).

**US5 — Admins sem GitHub (P2)**
Como admin convidado por e-mail, edito grupos por um formulário simples (Pages CMS, `.pages.yml`).

**US6 — Visão do município e da UF (P2)**
Como visitante, vejo quantos setores do município têm potencial de votos para virar e quantos têm grupo, e o resultado oficial do município (direto das seções, não somado dos setores).

**US7 — Aba Como participar (P2)**
Como visitante, encontro o diretório de ferramentas externas e sei como enviar o link do meu grupo.

### Checagens automáticas em todo PR

- Bloqueia: telefone, e-mail, CPF, CEP de residência associado a pessoa.
- Bloqueia links fora da lista de domínios permitidos nos grupos.
- Valida IDs: `CD_SETOR` existente na malha do Censo 2022; UF, município e zona existentes no TSE.
- Toda reprovação explica o motivo em português no próprio PR.

### Dados publicados (estáticos)

| Arquivo | Conteúdo | Carregado quando |
|---|---|---|
| `dados/setores.pmtiles` | PMTiles (um arquivo, lido por range requests) com duas camadas: `municipios` (z0–10) e `setores` (z10–12, overzoom até 16; tiles de no máximo 400 KB), com `CD_SETOR` e os valores das camadas de cor | Mapa |
| `dados/setores/<UF>/<11 primeiros dígitos do CD_SETOR>.json` | Por setor (agrupado por subdistrito): bairro, município IBGE, ponto central, distância do local mais próximo, locais ligados, vizinhos, votos para Lula vencer (`vm`) | Ao abrir um setor |
| `dados/municipios.json` | Índice nacional de municípios para a busca: código IBGE, nome, UF, caixa | Ao focar a busca |
| `dados/setores_ids.txt.gz` | Lista dos `CD_SETOR` válidos, versionada para a checagem do CI | CI |
| `dados/municipios/<UF>.json` | Municípios por código IBGE: caixa, códigos TSE, resultado oficial, contagens de setores | Busca e visão do município |
| `dados/locais/<UF>.json` | Locais de votação 2026 com coordenadas e setores ligados | Busca por escola |
| `dados/quadros.json` | Grupos aprovados, por nível (gerado pelo Jekyll a partir de `_data/grupos/`) | Painel do setor e contagem municipal |

Orçamento: setor aberto em 3G em menos de 3 s; nenhum arquivo carregado no celular acima de 1 MB; site publicado abaixo do limite de 1 GB do Pages.

### Fora do escopo da Fase 1

- Dados socioeconômicos do Censo por setor (renda, idade) — avaliar depois; nunca para perfilamento.
- Resultados de outros cargos e anos.
- Geocodificação de locais de votação sem coordenada no TSE.
- Insights de IA — Fase 3.
- Sugestão sem conta GitHub (exigiria um Cloudflare Worker) — avaliar se houver demanda.

## 5. Fase 2 — Depois do 2º turno

- Resultado do 2º turno de 2026 por setor e virada desde o 1º turno.
- Malha de setores do Censo 2010 para séries históricas (2012–2020), como no método de referência.
- Dados agregados do Censo 2022 por setor como contexto, com as mesmas regras de privacidade.

## 6. Fase 3 — Insights (depois)

Agentes de IA leem o Raio-X e os quadros e produzem análises por célula ("a abstenção subiu 4 pontos; três locais concentram 60% da virada"). Só dados agregados — nada de perfilamento individual. Toda análise entra como PR e é revisada antes de aparecer no quadro.

## 7. Inteligência coletiva: memória de pessoas e agentes

A memória vive num repositório próprio, a [wiki](https://github.com/colmeiabrasil/wiki), com uma estrutura para que execuções de agentes deixem rastro reutilizável, e para que o conhecimento das pessoas (quadros) e dos agentes (análises) se alimente mutuamente.

```
wiki/
  memoria/                  fatos e decisões duráveis (um arquivo por fato)
  analises/<ID>/            análises por célula ou nível, ex.: analises/SP-001/2026-10-20-abstencao.md
  execucoes/                registro de cada execução de agente
  fontes/                   fichas de dados: origem, data, hash, licença
  scripts/                  pipeline IBGE + TSE que gera dados/ da Colmeia
AGENTS.md                   instruções para qualquer agente que trabalhe no repo
```

Todo arquivo de conhecimento na wiki tem front matter:

```yaml
---
id: SP-001            # célula ou nível (BR, SP, SP-71072, SP-001) — opcional em memoria/
autor: agente:claude-opus-5-5   # ou humano:<usuario-github>
data: 2026-10-20
fontes: [tse-eleitorado-local-votacao-2026]
status: rascunho      # rascunho | revisado | descartado
---
```

Regras:
- Agentes escrevem só via PR; humanos revisam e mudam o `status`.
- Execuções registram: objetivo, entradas, modelo, saídas, o que ficou em aberto.
- `memoria/` guarda o que vale para execuções futuras (decisões, armadilhas dos dados, convenções). Antes de trabalhar, um agente lê `AGENTS.md` e `memoria/`.
- Nada de dado pessoal, igual aos quadros.

O ciclo: pessoas escrevem nos quadros → agentes leem quadros + dados e propõem análises e sugestões (PR) → pessoas revisam e aceitam → os quadros melhoram → próximas execuções partem da memória acumulada.

## 8. Arquitetura

| Peça | Escolha |
|---|---|
| Site | Jekyll do GitHub Pages, publicado por Action (`actions/deploy-pages`) junto com os dados gerados |
| Mapa | MapLibre GL (CDN com versão fixa e SRI); fundo vetorial claro do OpenFreeMap (sem chave); setores e municípios em tiles vetoriais estáticos próprios |
| Grupos | YAML por nível e por setor em `_data/grupos/`, protegido por `CODEOWNERS` |
| Busca | Índices JSON estáticos por UF + geocodificador opcional |
| Pipeline | Python (geopandas, shapely) + tippecanoe; baixa IBGE e TSE, calcula a ligação setor ↔ locais e as estimativas |
| Dados geográficos | Gerados por `scripts/setores.py` da wiki e versionados neste repositório; `dados/setores.pmtiles` em **Git LFS** (~225 MB); os JSONs de `dados/setores/` ficam no Git comum (~122 MB), evitando milhares de requisições LFS para arquivos pequenos. A Action `site.yml` baixa os objetos LFS (com cache) e publica no Pages. Ficha de cada fonte com URL, data e hash em `fontes/` da wiki |
| Sugestões | Issue pré-preenchida → admin publica por PR |
| Admins sem GitHub | Pages CMS |
| Checagens | GitHub Actions em todo PR |

Justificativa das exceções:
- **Build fora do Jekyll nativo:** o Pages "a partir do branch" não serve arquivos do Git LFS; a Action baixa o LFS, roda o Jekyll e publica, sem servidor próprio.
- **MapLibre em vez de Leaflet:** desenhar ~450 mil polígonos exige tiles vetoriais; Leaflet não os desenha bem no celular.
- **Fundo do OpenFreeMap:** estilo vetorial gratuito e sem chave, que permite desenhar água, vias e rótulos acima dos setores. Substituível por `mapa_estilo` em `_config.yml`.

Estrutura do repositório:

```
_data/grupos/               # protegido
  BR.yml
  SP/index.yml              # UF
  SP/municipios/71072.yml   # município
  SP/setores/355030805000001.yml
dados/                      # gerado pelo pipeline; só setores.pmtiles em Git LFS
pipeline/                   # checagens dos PRs (gerador dos dados fica na wiki)
  checar.py
diretorio.md                # cópia publicada de diretorio/README.md da wiki (atualizada por PR)
recursos.md                 # aba Como participar
.github/workflows/          # checagens, testes + deploy do Pages
```

## 9. Segurança e moderação

| Risco | Mitigação |
|---|---|
| Troca de link de grupo por grupo adversário ou golpe | Grupos só por admin; domínios permitidos; aprovação obrigatória |
| Vandalismo coordenado | Tudo é PR; reversão trivial; auto-merge só para texto que passa nas checagens; admins podem exigir revisão em tudo durante picos |
| Exposição de pessoas | Bloqueio automático de dados pessoais; regra explícita nos formulários |
| Conteúdo ilegal / desinformação | Admins removem via PR; histórico preservado; canal de denúncia (Issue) |
| Agente publicando bobagem | Agente só via PR, `status: rascunho` até revisão humana |
| Estimativa lida como resultado oficial ou usada para mirar pessoas | Rótulo "estimativa" com método e qualidade; só agregados por setor, sem dado individual; nada de cruzar com dados pessoais |

## 10. Questões em aberto

- Quem são os primeiros admins, e por UF? Com ~450 mil setores, admins por município?
- Domínio próprio?
- Zonas do exterior (`ZZ`) ficam só na busca?
- O tempo e o disco do runner gratuito do GitHub bastam para o pipeline nacional? Se não, gerar por UF em matriz de jobs.
- Limite de 2 km para "estimativa fraca" está bom em áreas rurais?

### Publicação alternativa no Cloudflare Pages

O workflow `site.yml` publica apenas no GitHub Pages. O endereço `colmeiabrasil.pages.dev` depende de um deploy separado no projeto Cloudflare correspondente, com autenticação própria.

Para Cloudflare, combinar `_config.yml` e `_config.pages.yml`: base URL vazia, JSONs locais e PMTiles servido pelo endereço público do GitHub Pages, que suporta CORS e Range. O PMTiles de aproximadamente 225 MB fica fora do pacote Cloudflare, cujo limite por arquivo é 25 MiB. Não restaurar a URL pessoal de infraestrutura da configuração antiga.
