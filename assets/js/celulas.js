(function () {
  const C = window.COLMEIA, esc = C.esc, raiz = document.getElementById('conteudo');
  const params = new URLSearchParams(location.search), id = params.get('id');
  if (/^\d{15}$/.test(id || '')) { location.replace(C.base + '/#setor=' + id); return; }
  Promise.all([C.json('/dados/celulas.json'), C.json('/dados/quadros.json')]).then(function (r) {
    const cel = r[0], q = r[1], n = C.nivel(id || '');
    if (id !== 'BR' && (cel.zonas[id] || cel.municipios[id] || cel.ufs[id])) mostrar(id, n, cel, q);
    else {
      raiz.innerHTML = '<p class="sobretitulo">Grupos perto de você</p><h1>Encontre sua célula</h1><p>Busque sua cidade, bairro ou escola onde você vota.</p><form class="busca-painel" id="busca-territorio" role="search"></form><p><a href="' + C.base + '/">← Voltar ao mapa</a></p>';
      C.montarBusca(document.getElementById('busca-territorio'), cel, { termo: params.get('q'), uf: params.get('uf') });
    }
  }).catch(function () { raiz.innerHTML = '<h1>Não conseguimos carregar os grupos</h1><p>Verifique sua conexão e recarregue a página.</p>'; });

  function mostrar(alvo, nivel, cel, q) {
    const nome = C.nome(alvo, cel), grupos = C.grupos(alvo, q.grupos);
    document.title = 'Grupos de ' + nome + ' — Colmeia';
    let h = '<a href="' + C.base + '/celulas/">← Encontrar outra célula</a><p class="sobretitulo">Grupos locais</p><h1>' + esc(nome) + '</h1>';
    if (nivel === 'zona') h += '<p class="meta">' + cel.zonas[alvo].m.map(function (m) { return esc(cel.municipios[m].n); }).join(', ') + '</p>';
    h += '<section class="cartao"><h2>Grupos desta célula</h2>' + (grupos.length ? '<ul class="grupos">' + grupos.map(function (g) {
      return '<li><a class="botao" target="_blank" rel="noopener noreferrer" href="' + esc(g.link) + '">Entrar em ' + esc(g.nome || 'grupo') + ' ↗</a></li>';
    }).join('') + '</ul>' : '<p>Ainda não há grupos aqui. Tem um grupo da região? Envie o link.</p>') + '</section>';
    h += '<details class="cartao"><summary>Enviar link do meu grupo</summary><form id="enviar-grupo"><p><label for="grupo-link">Link do WhatsApp ou Telegram</label><input id="grupo-link" type="url" required placeholder="https://chat.whatsapp.com/…"></p><p class="meta">Revisado pelos admins · envio com conta GitHub</p><p id="grupo-erro" role="alert"></p><button class="botao" type="submit">Enviar link ↗</button></form></details>';
    const zonas = nivel === 'municipio' ? cel.municipios[alvo].z : nivel === 'uf' ? Object.keys(cel.zonas).filter(function (z) { return z.slice(0, 2) === alvo; }) : [];
    if (zonas.length) h += '<details class="cartao"><summary>Grupos por zona eleitoral</summary><ul class="lista">' + zonas.map(function (z) {
      const total = C.grupos(z, q.grupos).length;
      return '<li><a href="' + C.urlCelula(z) + '">' + esc(C.nome(z, cel)) + '</a> <span class="meta">' + (total ? total + ' grupo(s)' : 'Ainda sem grupo') + '</span></li>';
    }).join('') + '</ul></details>';
    raiz.innerHTML = h;
    document.getElementById('enviar-grupo').addEventListener('submit', function (ev) {
      ev.preventDefault();
      const campo = document.getElementById('grupo-link'), erro = document.getElementById('grupo-erro');
      let url;
      try { url = new URL(campo.value.trim()); } catch (_) { erro.textContent = 'Confira o link de convite.'; return; }
      const valido = url.protocol === 'https:' && !url.username && !url.password && (
        url.hostname === 'chat.whatsapp.com' && /^\/[A-Za-z0-9_-]+\/?$/.test(url.pathname) ||
        ['whatsapp.com', 'www.whatsapp.com'].includes(url.hostname) && /^\/channel\/[A-Za-z0-9_-]+\/?$/.test(url.pathname) ||
        url.hostname === 't.me' && /^\/(?:\+|joinchat\/)?[A-Za-z0-9_-]+\/?$/.test(url.pathname));
      if (!valido || url.hostname === 't.me' && /^\/\d+\/?$/.test(url.pathname)) { erro.textContent = 'Use um convite de grupo do WhatsApp ou Telegram.'; return; }
      const query = new URLSearchParams({ template: 'grupo.md', title: 'Grupo para ' + alvo, body: 'Célula: ' + alvo + '\n\nLink do grupo: ' + url.href + '\n\nSugestão para revisão dos admins.' });
      location.assign('https://github.com/' + C.repo + '/issues/new?' + query);
    });
  }
})();
