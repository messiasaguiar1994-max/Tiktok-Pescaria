// Elefante Pintor - tela inicial do aplicativo (servidor, usuario, conectar, jogar)
// Usa o MESMO servidor da Pescaria ao Vivo (Render), que le a live do TikTok.
(function () {
  const SERVIDOR_PADRAO = 'https://tiktok-pescaria.onrender.com';

  const guarda = {
    ler: (k, p) => { try { const v = localStorage.getItem('elef_' + k); return v === null ? p : v; } catch (e) { return p; } },
    salvar: (k, v) => { try { localStorage.setItem('elef_' + k, v); } catch (e) {} }
  };
  const limpaUrl = u => String(u || '').trim().replace(/\/+$/, '').replace(/^(?!https?:\/\/)(.+)$/, 'https://$1');
  const limpaUsuario = u => String(u || '').trim().replace(/^@/, '').replace(/\s+/g, '');
  window.SERVIDOR = limpaUrl(guarda.ler('servidor', SERVIDOR_PADRAO));

  // ---------- tela ----------
  const css = document.createElement('style');
  css.textContent = `
  #menu{position:fixed;inset:0;z-index:9999;overflow:auto;background:linear-gradient(180deg,#2a6fb0,#123a6b);color:#fff;
    font-family:system-ui,-apple-system,Roboto,sans-serif;padding:max(22px,env(safe-area-inset-top)) 20px 30px;box-sizing:border-box}
  #menu.fora{display:none}
  #menu h1{font-size:27px;margin:6px 0 4px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  #menu .pill{font-size:13px;font-weight:700;padding:4px 12px;border-radius:99px;background:#2a4a75;color:#cfe3ff}
  #menu .pill.ok{background:#1f6f45;color:#c9ffd9}#menu .pill.ruim{background:#7a2b2b;color:#ffd6d6}
  #menu label{display:block;margin:18px 0 6px;color:#cfe0f5;font-size:15px}
  #menu input{width:100%;box-sizing:border-box;font-size:18px;padding:13px 14px;border-radius:14px;border:1px solid #4b6d9a;background:#0e2444;color:#fff}
  #menu .lin{display:flex;align-items:center;gap:10px;margin-top:14px;flex-wrap:wrap}
  #menu button{font-size:17px;font-weight:700;border:0;border-radius:14px;padding:12px 16px;background:#2c4a73;color:#fff}
  #menu .bola{width:14px;height:14px;border-radius:50%;background:#777;flex:none}
  #menu .bola.ok{background:#3ddc84;box-shadow:0 0 8px #3ddc84}#menu .bola.esp{background:#ffcc33}#menu .bola.ruim{background:#ff5b5b}
  #menu #jogar{width:100%;margin-top:18px;font-size:30px;padding:18px;background:linear-gradient(90deg,#ffb347,#ffd84d);color:#5a2d00}
  #menu .cx{margin-top:22px;background:rgba(10,30,60,.55);border:1px solid #3f6596;border-radius:16px;padding:12px 14px}
  #menu summary{font-size:16px;font-weight:700}
  #menu .dica{color:#bcd0ea;font-size:14px;line-height:1.45;margin-top:8px}
  #menu #log{margin-top:10px;font-size:13px;color:#cfe3ff;max-height:150px;overflow:auto;white-space:pre-wrap}
  `;
  document.head.appendChild(css);

  const m = document.createElement('div');
  m.id = 'menu';
  m.innerHTML = `
    <h1>🐘 Elefante Pintor <span id="svst" class="pill">servidor ?</span></h1>
    <label for="usu">Usuário do TikTok da live</label>
    <input id="usu" placeholder="@seu_usuario" autocomplete="off" autocapitalize="off" spellcheck="false">
    <div class="lin"><button id="con">Conectar</button><span id="bola" class="bola"></span><span id="est">desconectado</span></div>
    <button id="jogar">▶ JOGAR</button>
    <div class="dica">Durante o jogo, <b>toque na tela</b>: aparece o botão ⚙️ no canto por alguns segundos. Toque nele para voltar aqui. O botão Voltar do celular também funciona.</div>
    <details class="cx"><summary>🧪 Testar sem live</summary>
      <div class="dica">Coloca espectadores de mentira no jogo, para ver se está tudo funcionando.</div>
      <div class="lin"><button id="t1">💬 Comentário</button><button id="t2">🌹 Rosa</button></div>
      <div class="lin"><button id="t3">🫰 Coração</button><button id="t4">🍩 Rosquinha</button><button id="t5">🎲 Aventura</button></div>
    </details>
    <details class="cx"><summary>🐘 Garupa do elefante</summary>
      <div class="dica">Quem manda rosquinha ou capivara fica em cima do elefante a live toda, mesmo se o app fechar. Numa live nova, tire todo mundo:</div>
      <div class="lin"><button id="desce">🧹 Descer todos da garupa</button></div>
    </details>
    <details class="cx"><summary>⚙️ Configurações</summary>
      <label for="srv">Endereço do servidor</label>
      <input id="srv" placeholder="https://seu-servidor.onrender.com" autocomplete="off" autocapitalize="off" spellcheck="false">
      <div class="lin"><button id="salva">Salvar e testar</button></div>
      <label style="display:flex;gap:10px;align-items:center"><input type="checkbox" id="som" style="width:22px;height:22px"> Músicas e sons do jogo</label>
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
  // niveis que o servidor manda: 1 rosa, 2 team bracelet, 3 finger heart, 4 tiny diny, 5 capivara ou rosquinha (30 moedas)
  const PRESENTE = { 1: 'rosa', 2: 'rosa', 3: 'coracao', 4: 'coracao', 5: 'rosquinha' };
  const fotoDe = f => f ? window.SERVIDOR + '/foto?u=' + encodeURIComponent(f) : null;
  function aoEvento(d) {
    const nome = String(d.nome || d.id || '').trim();
    if (!nome || !window.novoEvento) return;
    if (d.tipo === 'comentario') { novoEvento('comentario', nome, fotoDe(d.foto)); log(nome + ': ' + (d.texto || '')); }
    else if (d.tipo === 'presente') {
      const k = PRESENTE[d.nivel]; if (!k) return;
      novoEvento(k, nome, fotoDe(d.foto)); log(nome + ' mandou ' + ({ rosa: 'rosa', coracao: 'coração', rosquinha: 'rosquinha/capivara' })[k]);
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
  const NOMES = ['Ana Clara', 'Joãozinho', 'Duda', 'Pedro', 'Mari', 'Lucas', 'Bia', 'Gabi', 'Rafa', 'Thiago', 'Juliana', 'Carlinhos', 'Vitória', 'Enzo', 'Laura', 'Seu Zé'];
  const nomeTeste = () => 'Teste ' + NOMES[Math.floor(Math.random() * NOMES.length)];
  const teste = (k, txt) => { const n = nomeTeste(); try { novoEvento(k, n); } catch (e) {} log('teste: ' + n + ' ' + txt); };
  $m('t1').onclick = () => teste('comentario', 'comentou');
  $m('t2').onclick = () => teste('rosa', 'mandou rosa');
  $m('t3').onclick = () => teste('coracao', 'mandou coração');
  $m('t4').onclick = () => teste('rosquinha', 'subiu no elefante');
  $m('t5').onclick = () => { try { forcarAventura(); } catch (e) {} log('teste: aventura'); };
  $m('desce').onclick = () => { try { descerTodos(); } catch (e) {} log('todos desceram da garupa'); };

  testaServidor().then(ok => { if (ok && limpaUsuario($m('usu').value)) conectar(); });
})();
