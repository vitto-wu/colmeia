(function () {
  const C = window.COLMEIA;
  const esc = C.esc;
  const norm = function (s) { return C.normalizar(String(s || "")).replace(/[^\p{L}\p{N}]+/gu, " ").trim(); };
  const consultas = new Map();
  const referencias = new Map();
  let ultimaConsulta = 0;
  let fila = Promise.resolve();

  C.consultarGeo = function (caminho, parametros) {
    if (!C.geocodificador) return Promise.reject(new Error("Geocodificador indisponível"));
    const url = C.geocodificador + caminho + "?" + new URLSearchParams(parametros);
    if (consultas.has(url)) return consultas.get(url);
    const pedido = fila.catch(function () {}).then(async function () {
      const espera = 1500 - (Date.now() - ultimaConsulta);
      if (espera > 0) await new Promise(function (resolve) { setTimeout(resolve, espera); });
      ultimaConsulta = Date.now();
      const resposta = await fetch(url, { credentials: "omit", referrerPolicy: "origin", signal: AbortSignal.timeout(12000) });
      if (!resposta.ok) throw new Error("Consulta indisponível");
      return resposta.json();
    }).catch(function (e) { consultas.delete(url); throw e; });
    consultas.set(url, pedido);
    fila = pedido;
    return pedido;
  };

  C.montarBusca = function (raiz, cel, opcoes) {
    const o = opcoes || {};
    const chave = o.compacta ? "cidade" : "q";
    const cidades = Object.keys(cel.municipios).map(function (id) {
      const uf = id.slice(0, 2), nome = cel.municipios[id].n;
      return { id: id, uf: uf, nome: nome, norm: norm(nome), texto: norm(nome + " " + uf + " " + cel.ufs[uf].n) };
    });
    let uf = cel.ufs[o.uf] ? o.uf : "", municipio = cel.municipios[o.municipio] ? o.municipio : null, bairro = null, indice = null, revisao = 0, tempo;
    if (municipio) uf = municipio.slice(0, 2);
    raiz.innerHTML = '<label for="' + chave + '">Cidade, estado, bairro ou lugar público</label>' +
      '<div class="busca-linha"><input type="search" name="q" id="' + chave + '" placeholder="Ex.: Campinas SP, Recife, Pinheiros…" autocomplete="off" aria-describedby="' + chave + '-ajuda" aria-controls="' + chave + '-resultados"><button class="botao" type="submit">Buscar <span aria-hidden="true">→</span></button></div>' +
      '<div class="busca-opcoes"><button class="localizar" type="button">◎ Usar minha localização</button><button class="buscar-endereco" type="button">Buscar rua ou lugar ↗</button></div>' +
      '<div class="escopo-busca" hidden></div><p class="meta busca-ajuda" id="' + chave + '-ajuda">Cidades e estados aparecem enquanto você digita. Para bairros e escolas, escolha a cidade.</p>' +
      '<p class="meta busca-status" role="status"></p><ul class="resultados" id="' + chave + '-resultados" aria-label="Resultados da busca"></ul>' +
      '<details class="privacidade-busca"><summary>Ruas e localização usam Photon / OpenStreetMap</summary><p>Ruas e localização aproximada são consultadas no Photon / OpenStreetMap apenas ao clicar. Não salvamos endereço ou coordenadas. Um endereço ajuda a encontrar a cidade; confirme sua zona pelo local de votação. <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap</a></p></details>';
    const entrada = raiz.querySelector("input");
    const res = raiz.querySelector(".resultados");
    const status = raiz.querySelector(".busca-status");
    const escopo = raiz.querySelector(".escopo-busca");
    const localizacao = raiz.querySelector(".localizar");
    const endereco = raiz.querySelector(".buscar-endereco");
    const enviar = raiz.querySelector('[type="submit"]');
    entrada.value = o.termo || "";

    function mostrarEscopo() {
      escopo.hidden = !uf;
      escopo.innerHTML = uf ? '<span>' + esc((bairro ? bairro + " · " : "") + (municipio ? cel.municipios[municipio].n + " · " + uf : cel.ufs[uf].n)) + '</span><button type="button" class="limpar-escopo">' + (bairro ? "Trocar bairro ←" : municipio ? "Trocar cidade ←" : "Trocar estado ←") + '</button>' : "";
    }
    function notificar(estado) {
      document.dispatchEvent(new CustomEvent("colmeia:territorio", { detail: { uf: estado, municipio: municipio, bairro: bairro, referencia: referencias.get(municipio) } }));
    }
    async function carregar(estado) {
      const b = await C.json("/dados/busca/" + estado + ".json");
      const bairros = new Map();
      const locais = b.l.map(function (l) {
        const m = b.m[l[2]], z = b.z[l[3]], chaveB = m + "|" + norm(l[1]);
        if (!bairros.has(chaveB)) bairros.set(chaveB, { nome: l[1], m: m, z: new Set(), texto: norm(l[1]) });
        bairros.get(chaveB).z.add(z);
        return { nome: l[0], bairro: l[1], m: m, z: z, texto: norm(l[0] + " " + l[1]) };
      });
      return { uf: estado, locais: locais, bairros: Array.from(bairros.values()) };
    }
    function botaoCidade(c) {
      return '<li><button type="button" class="resultado-lugar" data-cidade="' + c.id + '"><span>' + esc(c.nome) + '<small>' + esc(cel.ufs[c.uf].n) + ' · cidade</small></span><span class="resultado-seta" aria-hidden="true">→</span></button></li>';
    }
    function contem(texto, tokens) { return tokens.every(function (t) { return texto.includes(t); }); }
    function classificar(a, b, termo) {
      const ponto = function (c) { return c.norm === termo ? 0 : c.norm.startsWith(termo) ? 1 : 2; };
      return ponto(a) - ponto(b) || a.nome.localeCompare(b.nome, "pt-BR");
    }
    async function buscar() {
      const versao = ++revisao;
      const termo = norm(entrada.value);
      mostrarEscopo();
      if (termo.length < 2 && !uf) {
        res.innerHTML = "";
        status.textContent = termo ? "Digite pelo menos 2 caracteres." : "";
        return 0;
      }
      let tokens = termo.split(" ").filter(Boolean);
      const cidadesVisiveis = cidades.filter(function (c) { return (!uf || c.uf === uf) && contem(c.texto, tokens); }).sort(function (a, b) {
        return termo ? classificar(a, b, termo) : cel.municipios[b.id].z.length - cel.municipios[a.id].z.length || a.nome.localeCompare(b.nome, "pt-BR");
      });
      const itens = [];
      if (!municipio) {
        C.UFS.filter(function (u) { return (!uf || uf === u) && termo && (norm(u) === termo || norm(cel.ufs[u].n).includes(termo)); }).slice(0, 3).forEach(function (u) {
          itens.push('<li><button type="button" class="resultado-lugar" data-estado="' + u + '"><span>' + esc(cel.ufs[u].n) + '<small>' + u + ' · estado · explorar no mapa</small></span><span aria-hidden="true">↗</span></button></li>');
        });
        cidadesVisiveis.slice(0, o.compacta ? 5 : 10).forEach(function (c) { itens.push(botaoCidade(c)); });
      }
      // A city suffix supplies context without asking for a state first.
      if (!uf && !cidadesVisiveis.length && termo) {
        const candidatas = cidades.filter(function (c) { return c.norm.length >= 4 && termo.endsWith(" " + c.norm); });
        if (candidatas.length === 1) {
          uf = candidatas[0].uf;
          municipio = candidatas[0].id;
          mostrarEscopo();
          notificar(uf);
        }
      }
      if (municipio) {
        if (!indice || indice.uf !== uf) {
          status.textContent = "Carregando bairros e locais de votação…";
          res.setAttribute("aria-busy", "true");
          res.innerHTML = itens.join("");
          try {
            const carregado = await carregar(uf);
            if (versao !== revisao) return;
            indice = carregado;
          } catch (e) {
            if (versao !== revisao) return;
            status.textContent = "Bairros e escolas indisponíveis. Tente buscar novamente; cidades e estados continuam disponíveis.";
            res.setAttribute("aria-busy", "false");
            return itens.length;
          }
          res.setAttribute("aria-busy", "false");
        }
        if (municipio) {
          const nome = cel.municipios[municipio].n;
          const cidadeNorm = norm(nome);
          let local = termo;
          if (local === cidadeNorm) local = "";
          else if (local.endsWith(" " + cidadeNorm)) local = local.slice(0, -cidadeNorm.length).trim();
          tokens = local.split(" ").filter(function (t) { return t && t !== uf.toLowerCase(); });
          itens.push('<li class="quadro-cidade"><a href="' + C.urlCelula(municipio) + '">Ver grupos de ' + esc(nome) + ' →</a><small>Ou escolha um bairro ou local de votação abaixo.</small></li>');
        }
        if (!bairro) indice.bairros.filter(function (b) { return b.m === municipio && contem(b.texto, tokens); }).sort(function (a, b) { return a.nome.localeCompare(b.nome, "pt-BR"); }).slice(0, 8).forEach(function (b) {
          itens.push('<li><button type="button" class="resultado-lugar" data-bairro="' + esc(b.nome) + '"><span>' + esc(b.nome) + '<small>Bairro de ' + esc(cel.municipios[b.m].n) + ' · ver locais de votação</small></span><span aria-hidden="true">→</span></button></li>');
        });
        if (bairro || termo) indice.locais.filter(function (l) { return l.m === municipio && (!bairro || norm(l.bairro) === norm(bairro)) && contem(l.texto, tokens); }).slice(0, 20).forEach(function (l) {
          itens.push('<li><a class="resultado-local" href="' + C.urlCelula(l.z) + '">' + esc(l.nome) + '<small>' + esc(l.bairro + " · " + cel.municipios[l.m].n) + ' · zona ' + l.z.slice(3) + '</small></a></li>');
        });
      }
      if (versao !== revisao) return;
      res.innerHTML = itens.length ? itens.join("") : '<li class="vazio">Não encontrou? Experimente o nome da cidade, selecione um estado no mapa ou use “Buscar rua ou lugar”.</li>';
      status.textContent = itens.length ? (municipio && !termo ? "Escolha um bairro ou local de votação." : itens.length + (itens.length === 1 ? " sugestão. Escolha o lugar que você reconhece." : " sugestões. Escolha o lugar que você reconhece.")) : "Nenhum resultado nos dados locais.";
      return itens.length - (municipio ? 1 : 0);
    }
    function escolherCidade(id) {
      clearTimeout(tempo);
      municipio = id;
      bairro = null;
      uf = id.slice(0, 2);
      entrada.value = "";
      entrada.placeholder = "Bairro ou local de votação em " + cel.municipios[id].n;
      notificar(uf);
      buscar();
      entrada.focus({ preventScroll: true });
    }
    function escolherEstado(estado) {
      clearTimeout(tempo);
      uf = estado;
      municipio = null;
      bairro = null;
      entrada.value = "";
      entrada.placeholder = "Cidade, bairro ou escola em " + estado;
      notificar(estado);
      buscar();
    }
    function resultadosGeograficos(dados) {
      const encontrados = new Map();
      (dados.features || []).forEach(function (f) {
        const p = f.properties || {};
        if (String(p.countrycode).toUpperCase() !== "BR") return;
        const estado = C.UFS.find(function (u) { return norm(cel.ufs[u].n) === norm(p.state) || u === String(p.statecode || "").replace("BR-", ""); });
        const nomes = [p.city, p.county, p.name].map(norm).filter(Boolean);
        cidades.filter(function (c) { return (!estado || c.uf === estado) && nomes.includes(c.norm); }).forEach(function (c) { encontrados.set(c.id, c); referencias.set(c.id, f); });
      });
      res.innerHTML = Array.from(encontrados.values()).map(botaoCidade).join("");
      status.textContent = encontrados.size ? "Encontramos estas cidades. Confirme a sua para buscar o local de votação." : "Não conseguimos identificar a cidade. Digite seu nome ou escolha o estado no mapa.";
    }
    async function consultarLugar(local) {
      clearTimeout(tempo);
      const versao = ++revisao;
      localizacao.disabled = endereco.disabled = enviar.disabled = true;
      status.textContent = local ? "Buscando sua cidade pela localização aproximada…" : "Buscando rua ou lugar no OpenStreetMap…";
      try {
        // Request city-level results for location and omit house numbers for text queries.
        const contexto = municipio ? cel.municipios[municipio].n + ", " + uf : uf;
        let texto = entrada.value.replace(/\b\d+[\w-]*\b/g, "").trim();
        const jaTemContexto = municipio ? norm(texto).includes(norm(cel.municipios[municipio].n)) : norm(texto).split(" ").includes(uf.toLowerCase());
        if (contexto && !jaTemContexto) texto += ", " + contexto;
        const dados = local ? await C.consultarGeo("/reverse", { lat: local.latitude.toFixed(2), lon: local.longitude.toFixed(2), layer: "city", limit: "5" }) :
          await C.consultarGeo("/api", { q: texto, countrycode: "BR", limit: "6" });
        if (versao === revisao) resultadosGeograficos(dados);
      } catch (e) {
        if (versao === revisao) status.textContent = "A busca de localização está indisponível. Você pode continuar pelo nome da cidade ou pelo mapa.";
      } finally { localizacao.disabled = endereco.disabled = enviar.disabled = false; }
    }
    raiz.addEventListener("submit", async function (ev) {
      ev.preventDefault();
      clearTimeout(tempo);
      const quantidade = await buscar();
      if (quantidade === 0 && norm(entrada.value).length >= 3) consultarLugar();
    });
    entrada.addEventListener("input", function () { ++revisao; clearTimeout(tempo); tempo = setTimeout(buscar, 180); });
    res.addEventListener("click", function (ev) {
      const c = ev.target.closest("[data-cidade]");
      const e = ev.target.closest("[data-estado]");
      const b = ev.target.closest("[data-bairro]");
      if (c) escolherCidade(c.dataset.cidade);
      if (e) escolherEstado(e.dataset.estado);
      if (b) {
        bairro = b.dataset.bairro;
        entrada.value = "";
        entrada.placeholder = "Escola ou local de votação em " + bairro;
        notificar(uf);
        buscar();
      }
    });
    escopo.addEventListener("click", function (ev) {
      if (!ev.target.closest("button")) return;
      if (bairro) bairro = null;
      else if (municipio) municipio = null;
      else { uf = ""; indice = null; }
      entrada.value = "";
      entrada.placeholder = "Cidade, estado, bairro ou lugar público";
      notificar(uf);
      buscar();
      entrada.focus({ preventScroll: true });
    });
    endereco.addEventListener("click", function () {
      if (norm(entrada.value).length < 3) { status.textContent = "Digite uma rua ou lugar junto com a cidade. Ex.: Avenida Paulista, São Paulo."; entrada.focus(); return; }
      consultarLugar();
    });
    localizacao.addEventListener("click", function () {
      clearTimeout(tempo);
      if (!navigator.geolocation) { status.textContent = "Seu navegador não oferece localização. Busque pela cidade."; return; }
      const versao = ++revisao;
      localizacao.disabled = true;
      status.textContent = "Aguardando sua permissão para usar a localização…";
      navigator.geolocation.getCurrentPosition(function (pos) {
        if (versao !== revisao) { localizacao.disabled = false; return; }
        consultarLugar(pos.coords);
      }, function (erro) {
        localizacao.disabled = false;
        if (versao === revisao) status.textContent = erro.code === 1 ? "Localização não autorizada. Tudo bem: digite sua cidade ou escolha no mapa." : "Não conseguimos obter sua localização. Tente pela cidade ou pelo mapa.";
      }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
    });
    document.addEventListener("colmeia:mapa", function (ev) {
      uf = ev.detail.uf; municipio = ev.detail.municipio || null; bairro = ev.detail.bairro || null; indice = null;
      entrada.value = "";
      entrada.placeholder = uf ? "Cidade, bairro ou escola em " + uf : "Cidade, estado, bairro ou lugar público";
      buscar();
    });
    document.addEventListener("colmeia:area", function (ev) { consultarLugar(ev.detail); });
    mostrarEscopo();
    buscar();
  };

  const inicio = document.querySelector(".atlas .busca-inicio");
  if (inicio) C.json("/dados/celulas.json").then(function (cel) {
    const params = new URLSearchParams(location.search);
    C.montarBusca(inicio, cel, { compacta: true, uf: params.get("uf"), municipio: params.get("municipio") });
  }).catch(function () { /* The HTML form remains available if the index fails. */ });
})();
