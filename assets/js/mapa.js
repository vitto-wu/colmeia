(function () {
  const C = window.COLMEIA, esc = C.esc;
  const IBGE_UF = { 11: "RO", 12: "AC", 13: "AM", 14: "RR", 15: "PA", 16: "AP", 17: "TO", 21: "MA", 22: "PI", 23: "CE", 24: "RN", 25: "PB", 26: "PE", 27: "AL", 28: "SE", 29: "BA", 31: "MG", 32: "ES", 33: "RJ", 35: "SP", 41: "PR", 42: "SC", 43: "RS", 50: "MS", 51: "MT", 52: "GO", 53: "DF" };
  const COR = { lula: ["#ecb8b0", "#9e1f17"], flavio: ["#b4c8dd", "#1d4a82"], vazio: "#dcd6cc" };
  const fmt = function (x, casas) {
    return x == null ? "s/d" : Number(x).toLocaleString("pt-BR", { maximumFractionDigits: casas == null ? 1 : casas });
  };
  const ufDe = function (cd) { return IBGE_UF[cd.slice(0, 2)]; };

  const valor = function (p) { return ["coalesce", ["get", p], -999]; };
  const semDado = function (p, expr) { return ["case", ["==", valor(p), -999], COR.vazio, expr]; };
  const CAMADAS = {
    espaco: {
      botao: "Espaço para conversar",
      titulo: "Entenda sua vizinhança",
      sub: "Abstenção, brancos e nulos do 1º turno de 2026 comparados à diferença entre Lula e Flávio",
      cor: semDado("esp", ["interpolate", ["linear"], valor("esp"), 0.5, "#eee8de", 1, "#f8d98a", 2, "#f6b21a", 4, "#d7701a", 8, "#8f3510"]),
      escala: "linear-gradient(90deg,#eee8de 0%,#f8d98a 6.67%,#f6b21a 20%,#d7701a 46.67%,#8f3510 100%)",
      marcas: ["0,5× ou menos", "4×", "8× ou mais"],
      meio: "46.67%",
      extremos: ["Menor proporção", "Maior proporção"],
      leitura: "Quanto mais escuro, maior a soma de abstenções, brancos e nulos em relação à diferença de votos. 1× significa que as duas quantidades são iguais.",
      ausente: "Sem estimativa",
    },
    d: {
      botao: "Variação 2022 → 2026",
      titulo: "Quanto Lula ganhou ou perdeu desde 2022",
      sub: "Pontos percentuais entre o 2º turno de 2022 e o 1º turno de 2026",
      cor: semDado("d", ["interpolate", ["linear"], valor("d"), -12, "#1d4a82", -4, "#a9bfd8", 0, "#efeae2", 4, "#e0b4b0", 12, "#9e1f17"]),
      escala: "linear-gradient(90deg,#1d4a82 0%,#a9bfd8 33.33%,#efeae2 50%,#e0b4b0 66.67%,#9e1f17 100%)",
      marcas: ["−12 p.p. ou menos", "0", "+12 p.p. ou mais"],
      meio: "50%",
      extremos: ["Azul: Lula perdeu", "Vermelho: Lula ganhou"],
      leitura: "A cor mostra a mudança na porcentagem de votos de Lula. O centro claro indica estabilidade; cores mais fortes indicam maior mudança. p.p. = pontos percentuais.",
      ausente: "Sem comparação confiável",
    },
  };

  let camada = "espaco", selecionado = null, grupos = {}, municipios = null, foco = null;
  const $ = function (id) { return document.getElementById(id); };

  maplibregl.addProtocol("pmtiles", new pmtiles.Protocol().tile);
  const mapa = new maplibregl.Map({
    container: "mapa", style: C.estilo, center: [-51.5, -14.5], zoom: 3.4, maxZoom: 16, minZoom: 3,
    attributionControl: { compact: true }, dragRotate: false, pitchWithRotate: false,
  });
  mapa.touchZoomRotate.disableRotation();
  mapa.addControl({
    onAdd: function () { return $("controle-compartilhar"); },
    onRemove: function () { $("controle-compartilhar").remove(); },
  }, "top-right");
  mapa.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
  const geolocalizar = new maplibregl.GeolocateControl({ fitBoundsOptions: { maxZoom: 14 } });
  mapa.addControl(geolocalizar, "top-right");

  mapa.on("load", function () {
    const estilo = mapa.getStyle().layers;
    ["building", "landuse_residential", "landcover_wood", "park", "aeroway-area", "airport"].forEach(function (id) {
      if (mapa.getLayer(id)) mapa.setLayoutProperty(id, "visibility", "none");
    });
    estilo.filter(function (l) { return l.type === "line" && /^highway_(minor|major_inner|motorway_inner)/.test(l.id); }).forEach(function (l) {
      mapa.setPaintProperty(l.id, "line-color", "#ffffff");
      mapa.setPaintProperty(l.id, "line-opacity", 0.85);
    });
    estilo.filter(function (l) { return l.type === "symbol" && /^label_/.test(l.id); }).forEach(function (l) {
      mapa.setPaintProperty(l.id, "text-color", "#1b1410");
      mapa.setPaintProperty(l.id, "text-halo-color", "rgba(255,255,255,0.9)");
    });
    const antes = mapa.getLayer("water") ? "water" : undefined;
    mapa.addSource("colmeia", {
      type: "vector", url: "pmtiles://" + (C.tiles || location.origin + C.base + "/dados/setores.pmtiles"),
      promoteId: { setores: "id", municipios: "id" },
    });
    mapa.addLayer({ id: "mun-fill", type: "fill", source: "colmeia", "source-layer": "municipios", maxzoom: 11,
      paint: { "fill-opacity": ["interpolate", ["linear"], ["zoom"], 10.2, 0.9, 10.8, 0] } }, antes);
    mapa.addLayer({ id: "mun-linha", type: "line", source: "colmeia", "source-layer": "municipios", maxzoom: 11,
      paint: { "line-color": "#ffffff", "line-width": ["interpolate", ["linear"], ["zoom"], 4, 0.2, 9, 0.8], "line-opacity": 0.7 } }, antes);
    mapa.addLayer({ id: "set-fill", type: "fill", source: "colmeia", "source-layer": "setores", minzoom: 10,
      paint: { "fill-opacity": ["interpolate", ["linear"], ["zoom"], 10, 0, 10.5, 0.9, 15, 0.78] } }, antes);
    mapa.addLayer({ id: "set-sel", type: "line", source: "colmeia", "source-layer": "setores", minzoom: 10,
      filter: ["==", ["get", "id"], ""], paint: { "line-color": "#1b1410", "line-width": 2.5 } });
    pintar();
    abrirDoEndereco();
  });

  function pintar() {
    const c = CAMADAS[camada];
    ["mun-fill", "set-fill"].forEach(function (id) {
      if (!mapa.getLayer(id)) return;
      mapa.setPaintProperty(id, "fill-color", c.cor);
      mapa.setPaintProperty(id, "fill-outline-color", c.cor);
    });
    $("mapa-titulo").textContent = c.titulo;
    $("mapa-sub").textContent = c.sub;
    $("legenda").innerHTML = '<div class="legenda-extremos"><b>' + esc(c.extremos[0]) + '</b><b>' + esc(c.extremos[1]) +
      '</b></div><div class="legenda-escala" style="background:' + c.escala + '" aria-hidden="true"></div><div class="legenda-marcas" style="--meio:' + c.meio + '">' +
      c.marcas.map(function (m) { return '<span>' + esc(m) + '</span>'; }).join("") +
      '</div><p class="legenda-leitura">' + esc(c.leitura) + '</p><div class="legenda-ausente"><i style="background:' + COR.vazio + '"></i>' + esc(c.ausente) + '</div>';
    document.querySelectorAll("#camadas button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.camada === camada)); });
  }

  $("camadas").innerHTML = Object.keys(CAMADAS).map(function (k) {
    return '<button type="button" data-camada="' + k + '">' + esc(CAMADAS[k].botao) + "</button>";
  }).join("");
  $("camadas").addEventListener("click", function (ev) {
    const b = ev.target.closest("button");
    if (!b) return;
    camada = b.dataset.camada;
    pintar();
    atualizarEndereco();
  });
  pintar();

  C.json("/dados/quadros.json").then(function (q) {
    grupos = q.grupos || {};
  }).catch(function () {});

  function listaGrupos(no) {
    const g = no && no.grupos;
    return Array.isArray(g) ? g.filter(function (x) { return x && /^https:\/\//.test(x.link || ""); }) : [];
  }
  function gruposSetor(cd) {
    const uf = grupos[ufDe(cd)];
    return listaGrupos(uf && uf.setores && uf.setores[cd]);
  }
  function setoresComGrupo() {
    const out = [];
    Object.keys(grupos).forEach(function (uf) {
      const s = grupos[uf] && grupos[uf].setores;
      if (s) Object.keys(s).forEach(function (cd) { if (listaGrupos(s[cd]).length) out.push(cd); });
    });
    return out;
  }
  function arquivoSetor(cd) { return "/dados/setores/" + ufDe(cd) + "/" + cd.slice(0, 11) + ".json"; }

  const dica = $("dica");
  mapa.on("mousemove", "set-fill", function (ev) {
    const p = ev.features[0].properties;
    mapa.getCanvas().style.cursor = "pointer";
    dica.hidden = false;
    dica.style.transform = "translate(" + (ev.point.x + 14) + "px," + (ev.point.y + 14) + "px)";
    dica.innerHTML = p.q ? "<b>Lula " + fmt(p.l26) + "%</b> · Flávio " + fmt(p.f26) + "%<br>" + resumoEspaco(p.esp) : "Sem estimativa";
  });
  mapa.on("mouseleave", "set-fill", function () { mapa.getCanvas().style.cursor = ""; dica.hidden = true; });
  mapa.on("click", "set-fill", function (ev) { abrirSetor(ev.features[0].properties.id, ev.features[0].properties); });
  mapa.on("click", "mun-fill", function (ev) {
    if (mapa.getZoom() >= 10) return;
    focarMunicipio(ev.features[0].properties.id);
  });

  function resumoEspaco(esp) {
    if (esp == null) return "";
    return esp >= 1 ? "Brancos, nulos e abstenções somam " + fmt(esp) + "× a diferença" : "Diferença maior que brancos, nulos e abstenções";
  }

  async function abrirSetor(cd, props) {
    selecionado = cd;
    atualizarEndereco();
    mapa.setFilter("set-sel", ["==", ["get", "id"], cd]);
    const painel = $("painel");
    painel.hidden = false;
    painel.innerHTML = '<p class="meta">Carregando setor…</p>';
    let d, m;
    try {
      const uf = ufDe(cd);
      d = (await C.json(arquivoSetor(cd)))[cd];
      m = (await C.json("/dados/municipios/" + uf + ".json"))[d.m];
    } catch (e) {
      if (selecionado !== cd) return;
      painel.innerHTML = fechar() + "<p>Não encontramos este setor. Verifique sua conexão.</p>";
      painel.querySelector(".fechar").addEventListener("click", fecharPainel);
      return;
    }
    if (selecionado !== cd) return;
    if (!props) props = propsDoMapa(cd) || {};
    painel.innerHTML = fechar() + htmlSetor(cd, props, d, m);
    ligarPainel(cd);
    if (d.c && window.matchMedia("(max-width: 640px)").matches) {
      mapa.easeTo({ center: d.c, padding: { top: 0, bottom: painel.offsetHeight, left: 0, right: 0 }, duration: 400 });
    }
  }

  function propsDoMapa(cd) {
    const f = mapa.querySourceFeatures("colmeia", { sourceLayer: "setores", filter: ["==", ["get", "id"], cd] });
    return f.length ? f[0].properties : null;
  }

  function fechar() { return '<button class="fechar" type="button" aria-label="Fechar">✕</button>'; }

  function barra(l, f) {
    const o = Math.max(0, 100 - l - f);
    return '<div class="barra" aria-hidden="true"><span style="width:' + l + '%;background:' + COR.lula[1] + '"></span><span style="width:' + o + '%;background:#c9b48c"></span><span style="width:' + f + '%;background:' + COR.flavio[1] + '"></span></div>';
  }

  const iconeCompartilhar = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V3m-4 4 4-4 4 4M5 13v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7"/></svg>';

  function htmlSetor(cd, p, d, m) {
    const uf = ufDe(cd);
    let h = '<header class="setor-cabecalho"><div><p class="sobretitulo">Setor censitário</p><h2>' + esc(d.b || "Setor " + cd.slice(-4)) +
      '</h2></div></header>';
    h += '<p class="meta">' + esc(m.n) + " (" + uf + ") · estimativa pelos locais de votação próximos" + (p.q === 1 ? ' · <strong>estimativa fraca</strong> (local mais próximo a ' + fmt(d.dist / 1000) + " km)" : "") + "</p>";
    if (p.q) {
      h += '<section class="resultado-setor" aria-label="Resultado estimado do primeiro turno de 2026"><h3>Resultado estimado <span>2026 · 1º turno</span></h3>';
      h += barra(p.l26 || 0, p.f26 || 0);
      h += '<dl class="numeros"><div><dt>Lula</dt><dd>' + fmt(p.l26) + '%</dd></div><div><dt>Flávio</dt><dd>' + fmt(p.f26) + '%</dd></div><div><dt>Outros</dt><dd>' + fmt(Math.max(0, 100 - p.l26 - p.f26)) + "%</dd></div></dl></section>";
      h += '<dl class="indicadores-setor"><div><dt>Abstenção</dt><dd>' + fmt(p.ab) + '%</dd></div><div><dt>Brancos e nulos</dt><dd>' + fmt(p.bn) + '%</dd></div></dl>';
      if (p.l22 != null) h += '<p class="comparacao-setor">Lula em 2022 <strong>' + fmt(p.l22) + '%</strong> <span>2º turno' +
        (p.d != null ? ' · variação ' + (p.d > 0 ? '+' : '') + fmt(p.d) + ' p.p.' : ' · sem comparação confiável') + '</span></p>';
    } else {
      h += '<p class="sem-estimativa">Sem estimativa disponível para este setor.</p>';
    }
    h += secaoGrupos(cd, d, m, uf);
    return h;
  }

  function secaoGrupos(cd, d, m, uf) {
    const linha = function (g) { return '<li><a class="botao" target="_blank" rel="noopener noreferrer" href="' + esc(g.link) + '">Entrar em ' + esc(g.nome || "grupo") + " ↗</a></li>"; };
    const proprios = gruposSetor(cd);
    let h = '<section class="grupos-setor"><div class="grupos-proprios"><h3>Grupos deste setor</h3>' + (proprios.length ? '<ul class="grupos">' + proprios.map(linha).join("") + "</ul>" : '<p class="grupo-vazio">Nenhum grupo cadastrado neste setor.</p>');
    h += '<details class="enviar"><summary><span aria-hidden="true">＋</span> Enviar link do meu grupo</summary><form id="enviar-grupo"><label for="grupo-link">Link do WhatsApp ou Telegram</label><input id="grupo-link" type="url" required placeholder="https://chat.whatsapp.com/…"><p class="meta">Os admins revisam antes de publicar · envio com conta GitHub</p><p id="grupo-erro" role="alert"></p><button class="botao" type="submit">Enviar link ↗</button></form></details></div>';
    const viz = (d.viz || []).flatMap(function (v) { return gruposSetor(v); });
    const ufG = grupos[uf] || {};
    const mun = (m.tse || []).flatMap(function (t) { return listaGrupos(ufG.municipios && ufG.municipios[t.slice(3)]); });
    const est = listaGrupos(ufG.index);
    [["Nos setores vizinhos", viz], ["Na cidade", mun], ["No estado", est]].forEach(function (par) {
      if (par[1].length) h += "<h4>" + par[0] + '</h4><ul class="grupos">' + par[1].map(linha).join("") + "</ul>";
    });
    h += "</section>";
    return h;
  }

  function ligarPainel(cd) {
    const painel = $("painel");
    painel.querySelector(".fechar").addEventListener("click", fecharPainel);
    $("enviar-grupo").addEventListener("submit", function (ev) {
      ev.preventDefault();
      const erro = $("grupo-erro");
      let url;
      try { url = new URL($("grupo-link").value.trim()); } catch (_) { erro.textContent = "Confira o link de convite."; return; }
      const valido = url.protocol === "https:" && !url.username && !url.password && (
        url.hostname === "chat.whatsapp.com" && /^\/[A-Za-z0-9_-]+\/?$/.test(url.pathname) ||
        ["whatsapp.com", "www.whatsapp.com"].includes(url.hostname) && /^\/channel\/[A-Za-z0-9_-]+\/?$/.test(url.pathname) ||
        url.hostname === "t.me" && /^\/(?:\+|joinchat\/)?[A-Za-z0-9_-]+\/?$/.test(url.pathname));
      if (!valido || url.hostname === "t.me" && /^\/\d+\/?$/.test(url.pathname)) { erro.textContent = "Use um convite de grupo do WhatsApp ou Telegram."; return; }
      const q = new URLSearchParams({ template: "grupo.md", title: "Grupo para o setor " + cd, body: "Setor: " + cd + "\n\nLink do grupo: " + url.href + "\n\nSugestão para revisão dos admins." });
      location.assign("https://github.com/" + C.repo + "/issues/new?" + q);
    });
  }

  function fecharPainel() {
    selecionado = null;
    $("painel").hidden = true;
    mapa.setFilter("set-sel", ["==", ["get", "id"], ""]);
    mapa.easeTo({ padding: { top: 0, bottom: 0, left: 0, right: 0 }, duration: 300 });
    atualizarEndereco();
  }

  function atualizarEndereco() {
    atualizarCompartilhar();
    const q = new URLSearchParams();
    if (selecionado) q.set("setor", selecionado);
    else {
      const c = mapa.getCenter();
      q.set("mapa", [mapa.getZoom().toFixed(2), c.lat.toFixed(5), c.lng.toFixed(5)].join(","));
      if (foco) q.set("cidade", foco.cd);
    }
    q.set("camada", camada);
    history.replaceState(null, "", "#" + q.toString());
  }

  function abrirDoEndereco() {
    const q = new URLSearchParams(location.hash.slice(1));
    camada = Object.hasOwn(CAMADAS, q.get("camada")) ? q.get("camada") : "espaco";
    pintar();
    const cd = q.get("setor");
    if (cd && /^\d{15}$/.test(cd) && ufDe(cd)) {
      C.json(arquivoSetor(cd)).then(function (dados) {
        const d = dados[cd];
        if (!d || !d.c) return abrirSetor(cd);
        mapa.once("idle", function () { abrirSetor(cd); });
        mapa.jumpTo({ center: d.c, zoom: 14 });
      }).catch(function () { abrirSetor(cd); });
      return;
    }
    selecionado = null;
    atualizarCompartilhar();
    foco = null;
    $("painel").hidden = true;
    $("chamado").hidden = true;
    $("busca").value = "";
    mapa.setFilter("set-sel", ["==", ["get", "id"], ""]);
    const vista = (q.get("mapa") || "").split(",");
    const v = vista.map(Number);
    if (vista.length === 3 && vista.every(function (x) { return x.trim() !== ""; }) && v.every(Number.isFinite) &&
        v[0] >= 3 && v[0] <= 16 && Math.abs(v[1]) <= 85 && Math.abs(v[2]) <= 180) {
      mapa.jumpTo({ center: [v[2], v[1]], zoom: v[0], padding: { top: 0, bottom: 0, left: 0, right: 0 } });
    }
    if (/^\d{7}$/.test(q.get("cidade") || "")) focarMunicipio(q.get("cidade"), true).catch(function () {});
  }

  let feedbackCompartilhar;
  function atualizarCompartilhar() {
    const rotulo = selecionado ? "Compartilhar este setor" : "Compartilhar esta vista";
    $("compartilhar-mapa").setAttribute("aria-label", rotulo);
    $("compartilhar-mapa").title = rotulo;
    $("compartilhar-status").textContent = "";
  }

  async function compartilhar(botao, status) {
    atualizarEndereco();
    clearTimeout(feedbackCompartilhar);
    const url = location.href;
    status.textContent = "";
    botao.disabled = true;
    try {
      if (navigator.share) {
        try {
          await navigator.share({ title: "Colmeia", url: url });
          return;
        } catch (e) {
          if (e.name === "AbortError") return;
        }
      }
      await navigator.clipboard.writeText(url);
      status.textContent = "Link copiado";
      feedbackCompartilhar = setTimeout(function () { status.textContent = ""; }, 4000);
    } catch (_) {
      status.textContent = "Copie o link na barra de endereço.";
    } finally {
      botao.disabled = false;
    }
  }

  $("compartilhar-mapa").innerHTML = iconeCompartilhar;
  $("compartilhar-mapa").addEventListener("click", function () {
    compartilhar($("compartilhar-mapa"), $("compartilhar-status"));
  });

  // Busca: cidades locais; escolas da cidade em foco; ruas pelo geocodificador.
  const entrada = $("busca"), resultados = $("busca-resultados");
  const norm = function (s) { return C.normalizar(String(s || "")).replace(/[^\p{L}\p{N}]+/gu, " ").trim(); };
  function carregarMunicipios() {
    if (!municipios) municipios = C.json("/dados/municipios.json").then(function (lista) {
      return lista.map(function (x) { return { cd: x[0], nome: x[1], uf: x[2], bb: x[3], texto: norm(x[1] + " " + x[2]) }; });
    });
    return municipios;
  }
  entrada.addEventListener("focus", carregarMunicipios, { once: true });
  let versao = 0;
  entrada.addEventListener("input", async function () {
    const v = ++versao, termo = norm(entrada.value);
    if (termo.length < 2) { resultados.innerHTML = ""; return; }
    const tokens = termo.split(" ");
    const lista = await carregarMunicipios();
    const cidades = lista.filter(function (c) { return tokens.every(function (t) { return c.texto.includes(t); }); })
      .sort(function (a, b) { return (norm(a.nome).startsWith(termo) ? 0 : 1) - (norm(b.nome).startsWith(termo) ? 0 : 1) || a.nome.localeCompare(b.nome, "pt-BR"); })
      .slice(0, 5);
    let escolas = [];
    if (foco) {
      const todos = await C.json("/dados/locais/" + foco.uf + ".json");
      const tse = new Set(foco.tse);
      escolas = todos.filter(function (l) { return tse.has(l[4]) && tokens.every(function (t) { return norm(l[0] + " " + l[1]).includes(t); }); }).slice(0, 5);
    }
    if (v !== versao) return;
    resultados.innerHTML = cidades.map(function (c) {
      return '<li><button type="button" data-cidade="' + c.cd + '">' + esc(c.nome) + " <small>" + c.uf + " · cidade</small></button></li>";
    }).join("") + escolas.map(function (l) {
      return '<li><button type="button" data-lat="' + l[2] + '" data-lon="' + l[3] + '">' + esc(l[0]) + " <small>" + esc(l[1]) + " · local de votação</small></button></li>";
    }).join("") + '<li><button type="button" data-rua="1">Buscar “' + esc(entrada.value.trim()) + '” como rua ou lugar <small>Photon / OpenStreetMap</small></button></li>';
  });
  resultados.addEventListener("click", async function (ev) {
    const b = ev.target.closest("button");
    if (!b) return;
    resultados.innerHTML = "";
    if (selecionado) fecharPainel();
    if (b.dataset.cidade) return focarMunicipio(b.dataset.cidade);
    if (b.dataset.lat) {
      mapa.once("moveend", atualizarEndereco);
      return mapa.flyTo({ center: [+b.dataset.lon, +b.dataset.lat], zoom: 15 });
    }
    try {
      const texto = entrada.value.replace(/\d+/g, " ").trim() + (foco ? ", " + foco.nome : "");
      const dados = await C.consultarGeo("/api", { q: texto, countrycode: "BR", limit: "1" });
      const f = dados.features && dados.features[0];
      if (f) {
        foco = null;
        $("chamado").hidden = true;
        mapa.once("moveend", atualizarEndereco);
        mapa.flyTo({ center: f.geometry.coordinates, zoom: 15 });
      }
      else resultados.innerHTML = '<li class="meta">Não encontramos esse lugar.</li>';
    } catch (e) { resultados.innerHTML = '<li class="meta">A busca de ruas está indisponível agora.</li>'; }
  });

  async function focarMunicipio(cd, restaurar) {
    const lista = await carregarMunicipios();
    const c = lista.find(function (x) { return x.cd === cd; });
    if (!c) return;
    const m = (await C.json("/dados/municipios/" + c.uf + ".json"))[cd];
    foco = { cd: cd, uf: c.uf, nome: c.nome, tse: m.tse };
    if (!restaurar) {
      mapa.once("moveend", atualizarEndereco);
      mapa.fitBounds([[c.bb[0], c.bb[1]], [c.bb[2], c.bb[3]]], { padding: 40, maxZoom: 13 });
    }
    entrada.value = c.nome + " (" + c.uf + ")";
    const comGrupo = setoresComGrupo().filter(function (s) { return s.slice(0, 7) === cd; }).length;
    $("chamado").hidden = false;
    $("chamado").textContent = "Em " + c.nome + ", " + m.com_espaco.toLocaleString("pt-BR") + " de " + m.setores.toLocaleString("pt-BR") +
      " setores têm espaço para virar e " + (comGrupo ? "só " + comGrupo + (comGrupo === 1 ? " tem" : " têm") : "nenhum tem") + " grupo. Comece o seu.";
  }

  const modal = $("metodologia");
  $("abrir-metodologia").addEventListener("click", function () { modal.showModal(); });
  modal.querySelector(".fechar").addEventListener("click", function () { modal.close(); });
  window.addEventListener("hashchange", abrirDoEndereco);
})();
