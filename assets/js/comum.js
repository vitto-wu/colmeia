(function () {
  const C = window.COLMEIA;
  const cache = {};
  const UFS_ORDEM = Object.freeze([
    "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA",
    "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO", "ZZ",
  ]);
  const SECOES = ["Próximas ações", "Onde conversar", "Materiais", "Notas"];
  const DIAS_ATIVA = 7;

  C.UFS = UFS_ORDEM;
  C.SECOES = SECOES;

  C.json = function (caminho) {
    if (!cache[caminho]) {
      cache[caminho] = fetch(C.base + caminho).then(function (r) {
        if (!r.ok) throw new Error(caminho + ": " + r.status);
        return r.json();
      }).catch(function (e) {
        delete cache[caminho];
        throw e;
      });
    }
    return cache[caminho];
  };

  C.esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  C.normalizar = function (s) {
    return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
  };

  C.nivel = function (id) {
    if (id === "BR") return "brasil";
    if (/^[A-Z]{2}$/.test(id)) return "uf";
    if (/^[A-Z]{2}-\d{5}$/.test(id)) return "municipio";
    if (/^[A-Z]{2}-\d{3}$/.test(id)) return "zona";
    return null;
  };

  C.nome = function (id, cel) {
    const n = C.nivel(id);
    if (n === "brasil") return "Brasil";
    if (n === "uf") return cel.ufs[id].n;
    if (n === "municipio") return cel.municipios[id].n + " (" + id.slice(0, 2) + ")";
    return "Zona " + id.slice(3) + " (" + id.slice(0, 2) + ")";
  };

  C.nomeNivel = { brasil: "país", uf: "estado", municipio: "município", zona: "zona" };

  C.grupos = function (id, grupos) {
    const n = C.nivel(id);
    let g;
    if (n === "brasil") g = grupos.BR;
    else if (n === "uf") g = grupos[id] && grupos[id].index;
    else {
      const uf = grupos[id.slice(0, 2)];
      const pasta = n === "municipio" ? "municipios" : "zonas";
      g = uf && uf[pasta] && uf[pasta][id.slice(3)];
    }
    g = g && g.grupos;
    return Array.isArray(g) ? g.filter(function (x) { return x && /^https:\/\//.test(x.link || ""); }) : [];
  };

  C.status = function (id, q) {
    const quadro = q.quadros[id];
    if (quadro && quadro.atualizado) {
      const dias = (Date.now() - Date.parse(quadro.atualizado + "T12:00:00-03:00")) / 864e5;
      if (dias <= DIAS_ATIVA) return "acao";
    }
    if (C.grupos(id, q.grupos).length) return "grupo";
    return "vazia";
  };

  C.nomeStatus = { vazia: "sem atividade registrada", grupo: "com grupo", acao: "ação nos últimos 7 dias" };

  C.urlCelula = function (id) {
    return C.base + "/celulas/?id=" + encodeURIComponent(id);
  };

  C.caminho = function (id) {
    const n = C.nivel(id);
    if (n === "brasil") return "BR";
    if (n === "uf") return id + "/index";
    return id.slice(0, 2) + "/" + (n === "municipio" ? "municipios" : "zonas") + "/" + id.slice(3);
  };

  function hoje() {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  }

  function editor(arquivo, existe, modelo) {
    const base = "https://github.com/" + C.repo;
    if (existe) return base + "/edit/main/" + arquivo;
    return base + "/new/main?filename=" + encodeURIComponent(arquivo) + "&value=" + encodeURIComponent(modelo);
  }

  // Abre o editor do GitHub com o arquivo do quadro; ao salvar, o GitHub abre o Pull Request.
  C.urlSugestao = function (id, existe, cel) {
    const modelo = "---\nid: " + id + "\nnivel: " + C.nivel(id) + "\ntitulo: " + C.nome(id, cel) +
      "\natualizado: " + hoje() + "\n---\n" +
      SECOES.map(function (s) { return "\n## " + s + "\n"; }).join("");
    return editor("celulas/" + C.caminho(id) + ".md", existe, modelo);
  };

  C.urlSugestaoGrupo = function (id, existe) {
    const modelo = "grupos:\n  - nome: Nome do grupo\n    link: https://chat.whatsapp.com/\n";
    return editor("_data/grupos/" + C.caminho(id) + ".yml", existe, modelo);
  };
})();
