// Polvo Poeta - tela inicial do aplicativo (servidor, usuario, conectar, jogar)
// Usa o MESMO servidor da Pescaria ao Vivo (Render), que le a live do TikTok.
(function () {
  const SERVIDOR_PADRAO = 'https://tiktok-pescaria.onrender.com';

  const guarda = {
    ler: (k, p) => { try { const v = localStorage.getItem('polvo_' + k); return v === null ? p : v; } catch (e) { return p; } },
    salvar: (k, v) => { try { localStorage.setItem('polvo_' + k, v); } catch (e) {} }
  };
  const limpaUrl = u => String(u || '').trim().replace(/\/+$/, '').replace(/^(?!https?:\/\/)(.+)$/, 'https://$1');
  const limpaUsuario = u => String(u || '').trim().replace(/^@/, '').replace(/\s+/g, '');
  window.SERVIDOR = limpaUrl(guarda.ler('servidor', SERVIDOR_PADRAO));

  // ---------- tela ----------
  const css = document.createElement('style');
  css.textContent = `
  #menu{position:fixed;inset:0;z-index:9999;overflow:auto;background:linear-gradient(180deg,#1aa6c9,#0a3d6b);color:#fff;
    font-family:system-ui,-apple-system,Roboto,sans-serif;padding:max(22px,env(safe-area-inset-top)) 20px 30px;box-sizing:border-box}
  #menu.fora{display:none}
  #menu h1{font-size:27px;margin:6px 0 4px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  #menu .pill{font-size:13px;font-weight:700;padding:4px 12px;border-radius:99px;background:#2a4a75;color:#cfe3ff}
  #menu .pill.ok{background:#1f6f45;color:#c9ffd9}#menu .pill.ruim{background:#7a2b2b;color:#ffd6d6}
  #menu label{display:block;margin:18px 0 6px;color:#d6f1ff;font-size:15px}
  #menu input{width:100%;box-sizing:border-box;font-size:18px;padding:13px 14px;border-radius:14px;border:1px solid #4b8fb0;background:#0b2b4a;color:#fff}
  #menu .lin{display:flex;align-items:center;gap:10px;margin-top:14px;flex-wrap:wrap}
  #menu button{font-size:17px;font-weight:700;border:0;border-radius:14px;padding:12px 16px;background:#145a80;color:#fff}
  #menu .bola{width:14px;height:14px;border-radius:50%;background:#777;flex:none}
  #menu .bola.ok{background:#3ddc84;box-shadow:0 0 8px #3ddc84}#menu .bola.esp{background:#ffcc33}#menu .bola.ruim{background:#ff5b5b}
  #menu #jogar{width:100%;margin-top:18px;font-size:30px;padding:18px;background:linear-gradient(90deg,#ff5a8a,#ff9bb8);color:#fff}
  #menu .cx{margin-top:22px;background:rgba(5,30,55,.55);border:1px solid #3f86a6;border-radius:16px;padding:12px 14px}
  #menu summary{font-size:16px;font-weight:700}
  #menu .dica{color:#c8e6f5;font-size:14px;line-height:1.45;margin-top:8px}
  #menu #log{margin-top:10px;font-size:13px;color:#d6f1ff;max-height:150px;overflow:auto;white-space:pre-wrap}
  `;
  document.head.appendChild(css);

  const m = document.createElement('div');
  m.id = 'menu';
  m.innerHTML = `
    <h1>🐙 Polvo Poeta <span id="svst" class="pill">servidor ?</span></h1>
    <label for="usu">Usuário do TikTok da live</label>
    <input id="usu" placeholder="@seu_usuario" autocomplete="off" autocapitalize="off" spellcheck="false">
    <div class="lin"><button id="con">Conectar</button><span id="bola" class="bola"></span><span id="est">desconectado</span></div>
    <button id="jogar">▶ JOGAR</button>
    <div class="dica">Durante o jogo, <b>toque na tela</b>: aparece o botão ⚙️ no canto por alguns segundos. Toque nele para voltar aqui. O botão Voltar do celular também funciona.</div>
    <details class="cx" open><summary>🧪 Testar sem live</summary>
      <div class="dica">Coloca espectadores de mentira no jogo, para ver se está tudo funcionando. O jogo abre sozinho para você ver.</div>
      <div class="lin"><button id="t1">🌹 Rosa</button><button id="t2">❤️ Curtidas</button><button id="t3">💬 Comentário</button></div>
      <div class="lin"><button id="t4">🔊 Testar a voz</button></div>
    </details>
    <details class="cx" open><summary>🗣️ Voz do polvo</summary>
      <div class="dica">Escolha a voz que soar mais natural. As marcadas com 🌐 são as mais humanas (precisam de internet). Toque em Ouvir para comparar.</div>
      <select id="voz" style="width:100%;font-size:17px;padding:12px;border-radius:14px;margin-top:10px;background:#0b2b4a;color:#fff;border:1px solid #4b8fb0"><option value="-1">Voz padrão do celular</option></select>
      <div class="lin"><button id="ouvir">▶ Ouvir esta voz</button></div>
    </details>
    <details class="cx"><summary>⚙️ Configurações</summary>
      <label for="srv">Endereço do servidor</label>
      <input id="srv" placeholder="https://seu-servidor.onrender.com" autocomplete="off" autocapitalize="off" spellcheck="false">
      <div class="lin"><button id="salva">Salvar e testar</button></div>
      <label style="display:flex;gap:10px;align-items:center"><input type="checkbox" id="som" style="width:22px;height:22px"> Música e sons do jogo</label>
    </details>
    <details class="cx"><summary>📋 O que está chegando da live</summary><div id="log">nada ainda</div></details>
  `;
  document.body.appendChild(m);
  const $m = id => document.getElementById(id);
  $m('usu').value = guarda.ler('usuario', '') ? '@' + guarda.ler('usuario', '') : '';
  $m('srv').value = window.SERVIDOR;
  $m('som').checked = guarda.ler('som', '1') !== '0';
  $m('som').onchange = () => { guarda.salvar('som', $m('som').checked ? '1' : '0'); try { ligarSom($m('som').checked); } catch (e) {} };

  const linhas = [];
  const log = t => { linhas.unshift(new Date().toLocaleTimeString().slice(0, 5) + '  ' + t); linhas.length = Math.min(linhas.length, 30); $m('log').textContent = linhas.join('\n'); };
  const estado = (cls, txt) => { $m('bola').className = 'bola ' + cls; $m('est').textContent = txt; };

  // ---------- servidor ----------
  async function testaServidor() {
    const p = $m('svst');
    if (!window.SERVIDOR) { p.className = 'pill ruim'; p.textContent = 'sem servidor'; return false; }
    p.className = 'pill'; p.textContent = 'acordando servidor...';
    for (let i = 0; i < 8; i++) { // servidor gratis pode estar "dormindo": demora ate ~1 minuto para acordar
      try {
        const c = new AbortController(), t = setTimeout(() => c.abort(), 15000);
        const r = await fetch(window.SERVIDOR + '/status', { signal: c.signal, cache: 'no-store' }); clearTimeout(t);
        const j = await r.json(); if (j.ok) { p.className = 'pill ok'; p.textContent = 'servidor ok'; return true; }
      } catch (e) {}
      await new Promise(r => setTimeout(r, 3000));
    }
    p.className = 'pill ruim'; p.textContent = 'servidor fora do ar'; return false;
  }
  $m('salva').onclick = () => {
    window.SERVIDOR = limpaUrl($m('srv').value); $m('srv').value = window.SERVIDOR;
    guarda.salvar('servidor', window.SERVIDOR); testaServidor();
  };

  // ---------- eventos da live -> jogo ----------
  // foto em alta resolucao: o TikTok manda a miniatura (100x100); pedimos a versao 720x720 e, se nao existir, usamos a original
  const grande = f => String(f).replace(/(cropcenter|resize|crop)(:|_)\d{2,4}(:|x|_)\d{2,4}/g, '$1$2720$3720').replace(/([~_])(c5_)?100x100/g, '$1$2720x720').replace(/:100:100/g, ':720:720');
  const proxy = f => window.SERVIDOR + '/foto?u=' + encodeURIComponent(f);
  const fotoDe = f => { if (!f) return null; const g = grande(f); return g !== f ? [proxy(g), proxy(f)] : proxy(f); };
  function aoEvento(d) {
    const nome = String(d.nome || d.id || '').trim();
    if (!nome || !window.novoEvento) return;
    if (d.tipo === 'comentario') { novoEvento('comentario', nome); log(nome + ': ' + (d.texto || '')); }
    else if (d.tipo === 'curtidas') { const n = (d.qtd || 1) * 100; try { curtidasLive(n); } catch (e) {} log(nome + ' mandou ' + n + ' curtidas'); }
    else if (d.tipo === 'presente') {
      // qualquer presente (rosa ou maior) = poema com o nome
      const q = Math.max(1, Math.min(d.qtd || 1, 2));
      for (let i = 0; i < q; i++) novoEvento('rosa', nome, fotoDe(d.foto));
      log(nome + ' mandou presente → poema');
    }
  }
  window.aoEvento = aoEvento;

  let es = null;
  function conectar() {
    const u = limpaUsuario($m('usu').value);
    if (!u) { estado('ruim', 'digite o usuário da live'); return; }
    if (!window.SERVIDOR) { estado('ruim', 'coloque o endereço do servidor em Configurações'); return; }
    guarda.salvar('usuario', u); $m('usu').value = '@' + u;
    if (es) es.close();
    estado('esp', 'conectando...');
    es = new EventSource(window.SERVIDOR + '/eventos?usuario=' + encodeURIComponent(u));
    es.onmessage = ev => {
      let d; try { d = JSON.parse(ev.data); } catch (e) { return; }
      if (d.tipo === 'status') { estado(d.estado === 'conectado' ? 'ok' : d.estado === 'erro' ? 'ruim' : 'esp', d.msg || d.estado); if (d.msg) log(d.msg); return; }
      try { aoEvento(d); } catch (e) { console.error(e); }
    };
    es.onerror = () => estado('esp', 'sem sinal do servidor, tentando de novo...');
  }
  $m('con').onclick = conectar;

  // ---------- jogar / voltar ----------
  $m('jogar').onclick = () => {
    if (!es && limpaUsuario($m('usu').value)) conectar();
    try { ligarSom($m('som').checked); } catch (e) {}
    m.classList.add('fora');
    history.pushState({ jogo: 1 }, '');
  };
  addEventListener('popstate', () => m.classList.remove('fora'));
  const volta = document.createElement('button'); volta.id = 'volta'; volta.textContent = '⚙️';
  volta.style.cssText = 'position:fixed;top:calc(env(safe-area-inset-top) + 10px);right:10px;z-index:9998;width:54px;height:54px;border-radius:50%;border:2px solid #fff;background:rgba(10,20,45,.75);color:#fff;font-size:26px;display:none';
  document.body.appendChild(volta);
  let tv;
  addEventListener('pointerdown', e => {
    if (!m.classList.contains('fora') || e.target === volta) return;
    volta.style.display = 'block'; clearTimeout(tv); tv = setTimeout(() => volta.style.display = 'none', 4000);
  });
  volta.onclick = () => { volta.style.display = 'none'; if (history.state && history.state.jogo) history.back(); else m.classList.remove('fora'); };

  // ---------- testes ----------
  const NOMES = ['Bia', 'Fandango', 'Fernando', 'Renata', 'Henrique', 'Tiago', 'João', 'Marina', 'Gabriel', 'Isabela', 'José', 'Camila', 'zymn030494'];
  const nomeTeste = () => NOMES[Math.floor(Math.random() * NOMES.length)];
  $m('t1').onclick = () => { const n = nomeTeste(); try { novoEvento('rosa', n); } catch (e) {} log('teste: ' + n + ' mandou rosa'); $m('jogar').click(); };
  $m('t2').onclick = () => { try { curtidasLive(300); } catch (e) {} log('teste: +300 curtidas'); $m('jogar').click(); };
  $m('t3').onclick = () => { const n = nomeTeste(); try { novoEvento('comentario', n); } catch (e) {} log('teste: ' + n + ' comentou'); $m('jogar').click(); };
  $m('t4').onclick = () => { try { ligarSom($m('som').checked); testarVoz(); } catch (e) { log('erro na voz: ' + e.message); } log('teste: voz'); };

  // ---------- vozes do Android ----------
  window.VOZ_INDEX = +guarda.ler('voz', '-1');
  const T = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.TextToSpeech;
  async function carregarVozes(tent) {
    if (!T) { $m('voz').innerHTML = '<option value="-1">Voz do navegador</option>'; return; }
    let vs = [];
    try { vs = (await T.getSupportedVoices()).voices || []; } catch (e) {}
    const pt = vs.map((v, i) => Object.assign({}, v, { i })).filter(v => /^pt[-_]br/i.test(v.lang || ''));
    if (!pt.length) { if (tent < 6) setTimeout(() => carregarVozes(tent + 1), 1500); return; }
    pt.sort((a, b) => (a.localService ? 1 : 0) - (b.localService ? 1 : 0));
    $m('voz').innerHTML = pt.map((v, k) => `<option value="${v.i}">${v.localService ? '📱' : '🌐'} Voz ${k + 1}${v.localService ? ' (sem internet)' : ' (mais natural)'}</option>`).join('');
    if (!pt.some(v => v.i === window.VOZ_INDEX)) { window.VOZ_INDEX = pt[0].i; guarda.salvar('voz', String(window.VOZ_INDEX)); }
    $m('voz').value = String(window.VOZ_INDEX);
  }
  $m('voz').onchange = () => { window.VOZ_INDEX = +$m('voz').value; guarda.salvar('voz', String(window.VOZ_INDEX)); };
  $m('ouvir').onclick = () => { window.VOZ_INDEX = +$m('voz').value; guarda.salvar('voz', String(window.VOZ_INDEX)); try { testarVoz(); } catch (e) {} };
  setTimeout(() => carregarVozes(0), 800);

  testaServidor().then(ok => { if (ok && limpaUsuario($m('usu').value)) conectar(); });
})();
