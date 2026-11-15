// Zombie Rush - tela inicial do aplicativo (servidor, usuario, conectar, jogar)
// Usa o MESMO servidor da Pescaria ao Vivo (Render), que le a live do TikTok.
(function () {
  const SERVIDOR_PADRAO = 'https://tiktok-pescaria.onrender.com';

  const guarda = {
    ler: (k, p) => { try { const v = localStorage.getItem('zumbi_' + k); return v === null ? p : v; } catch (e) { return p; } },
    salvar: (k, v) => { try { localStorage.setItem('zumbi_' + k, v); } catch (e) {} }
  };
  const limpaUrl = u => String(u || '').trim().replace(/\/+$/, '').replace(/^(?!https?:\/\/)(.+)$/, 'https://$1');
  const limpaUsuario = u => String(u || '').trim().replace(/^@/, '').replace(/\s+/g, '');
  window.SERVIDOR = limpaUrl(guarda.ler('servidor', SERVIDOR_PADRAO));

  const css = document.createElement('style');
  css.textContent = `
  #menu{position:fixed;inset:0;z-index:9999;overflow:auto;background:linear-gradient(180deg,#3b1d5e,#120a24);color:#fff;
    font-family:system-ui,-apple-system,Roboto,sans-serif;padding:max(22px,env(safe-area-inset-top)) 20px 30px;box-sizing:border-box}
  #menu.fora{display:none}
  #menu h1{font-size:28px;margin:6px 0 4px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  #menu .pill{font-size:13px;font-weight:700;padding:4px 12px;border-radius:99px;background:#3a2a5c;color:#e3d6ff}
  #menu .pill.ok{background:#1f6f45;color:#c9ffd9}#menu .pill.ruim{background:#7a2b2b;color:#ffd6d6}
  #menu label{display:block;margin:18px 0 6px;color:#d8c8ff;font-size:15px}
  #menu input{width:100%;box-sizing:border-box;font-size:18px;padding:13px 14px;border-radius:14px;border:1px solid #6a4fa0;background:#1b0f33;color:#fff}
  #menu .lin{display:flex;align-items:center;gap:10px;margin-top:14px;flex-wrap:wrap}
  #menu button{font-size:17px;font-weight:700;border:0;border-radius:14px;padding:12px 16px;background:#4b2f80;color:#fff}
  #menu .bola{width:14px;height:14px;border-radius:50%;background:#777;flex:none}
  #menu .bola.ok{background:#3ddc84;box-shadow:0 0 8px #3ddc84}#menu .bola.esp{background:#ffcc33}#menu .bola.ruim{background:#ff5b5b}
  #menu #jogar{width:100%;margin-top:18px;font-size:30px;padding:18px;background:linear-gradient(90deg,#5fd02a,#a6e53a);color:#123300}
  #menu .cx{margin-top:22px;background:rgba(20,8,45,.6);border:1px solid #5d4296;border-radius:16px;padding:12px 14px}
  #menu summary{font-size:16px;font-weight:700}
  #menu .dica{color:#d9ccf5;font-size:14px;line-height:1.45;margin-top:8px}
  #menu #log{margin-top:10px;font-size:13px;color:#e8ddff;max-height:150px;overflow:auto;white-space:pre-wrap}
  `;
  document.head.appendChild(css);

  const m = document.createElement('div');
  m.id = 'menu';
  m.innerHTML = `
    <h1>🧟 Zombie Rush <span id="svst" class="pill">servidor ?</span></h1>
    <label for="usu">Usuário do TikTok da live</label>
    <input id="usu" placeholder="@seu_usuario" autocomplete="off" autocapitalize="off" spellcheck="false">
    <div class="lin"><button id="con">Conectar</button><span id="bola" class="bola"></span><span id="est">desconectado</span></div>
    <button id="jogar">▶ JOGAR</button>
    <div class="dica">Toque na tela para pular. Para voltar a esta tela durante o jogo, <b>segure o dedo na tela por 2 segundos</b> e toque no ⚙️ (ou use o botão Voltar do celular).</div>
    <details class="cx" open><summary>🧪 Testar sem live</summary>
      <div class="dica">Coloca espectadores de mentira no jogo, para ver se está tudo funcionando. O jogo abre sozinho.</div>
      <div class="lin"><button id="t1">🌹 1 rosa</button><button id="t2">🌹 50 rosas</button><button id="t3">🌹 1000 rosas</button><button id="t4">❓ Caixa de poder</button></div>
    </details>
    <details class="cx"><summary>⚙️ Configurações</summary>
      <label for="srv">Endereço do servidor</label>
      <input id="srv" placeholder="https://seu-servidor.onrender.com" autocomplete="off" autocapitalize="off" spellcheck="false">
      <div class="lin"><button id="salva">Salvar e testar</button></div>
    </details>
    <details class="cx"><summary>📋 O que está chegando da live</summary><div id="log">nada ainda</div></details>
  `;
  document.body.appendChild(m);
  const $m = id => document.getElementById(id);
  $m('usu').value = guarda.ler('usuario', '') ? '@' + guarda.ler('usuario', '') : '';
  $m('srv').value = window.SERVIDOR;

  const linhas = [];
  const log = t => { linhas.unshift(new Date().toLocaleTimeString().slice(0, 5) + '  ' + t); linhas.length = Math.min(linhas.length, 40); $m('log').textContent = linhas.join('\n'); };
  const estado = (cls, txt) => { $m('bola').className = 'bola ' + cls; $m('est').textContent = txt; };

  async function testaServidor() {
    const p = $m('svst');
    if (!window.SERVIDOR) { p.className = 'pill ruim'; p.textContent = 'sem servidor'; return false; }
    p.className = 'pill'; p.textContent = 'acordando servidor...';
    for (let i = 0; i < 8; i++) {
      try {
        const c = new AbortController(), t = setTimeout(() => c.abort(), 15000);
        const r = await fetch(window.SERVIDOR + '/status', { signal: c.signal, cache: 'no-store' }); clearTimeout(t);
        const j = await r.json(); if (j.ok) { p.className = 'pill ok'; p.textContent = 'servidor ok'; return true; }
      } catch (e) {}
      await new Promise(r => setTimeout(r, 3000));
    }
    p.className = 'pill ruim'; p.textContent = 'servidor fora do ar'; return false;
  }
  $m('salva').onclick = () => { window.SERVIDOR = limpaUrl($m('srv').value); $m('srv').value = window.SERVIDOR; guarda.salvar('servidor', window.SERVIDOR); testaServidor(); };

  // ---------- eventos da live -> jogo (só a rosa conta) ----------
  const proxy = f => f ? window.SERVIDOR + '/foto?u=' + encodeURIComponent(f) : null;
  function aoEvento(d) {
    const nome = String(d.nome || d.id || '').trim();
    if (!nome || !window.ZR) return;
    if (d.tipo === 'presente' && d.nivel === 1) {
      const q = Math.max(1, Math.min(+(d.total || d.qtd) || 1, 5000));
      ZR.rosa(nome, proxy(d.foto), q);
      log(nome + ' mandou ' + q + ' rosa' + (q > 1 ? 's' : '') + ' → +' + q + ' zumbi' + (q > 1 ? 's' : ''));
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
    try { ZR.iniciar(); } catch (e) {}
    m.classList.add('fora');
    history.pushState({ jogo: 1 }, '');
  };
  addEventListener('popstate', () => m.classList.remove('fora'));
  const volta = document.createElement('button'); volta.textContent = '⚙️';
  volta.style.cssText = 'position:fixed;top:calc(env(safe-area-inset-top) + 10px);left:50%;transform:translateX(-50%);z-index:9998;width:58px;height:58px;border-radius:50%;border:2px solid #fff;background:rgba(20,10,45,.8);color:#fff;font-size:28px;display:none';
  document.body.appendChild(volta);
  let tSeg, tEsc;
  addEventListener('pointerdown', e => {
    if (!m.classList.contains('fora') || e.target === volta) return;
    clearTimeout(tSeg); tSeg = setTimeout(() => { volta.style.display = 'block'; clearTimeout(tEsc); tEsc = setTimeout(() => volta.style.display = 'none', 4000); }, 2000);
  });
  addEventListener('pointerup', () => clearTimeout(tSeg));
  addEventListener('pointercancel', () => clearTimeout(tSeg));
  volta.addEventListener('pointerdown', e => e.stopPropagation());
  volta.onclick = () => { volta.style.display = 'none'; if (history.state && history.state.jogo) history.back(); else m.classList.remove('fora'); };

  // ---------- testes ----------
  const NOMES = ['Bia', 'Fandango', 'Fernando', 'Renata', 'Henrique', 'Tiago', 'João', 'Marina', 'Gabriel', 'Isabela', 'José', 'Camila'];
  const nomeTeste = () => NOMES[Math.floor(Math.random() * NOMES.length)];
  const teste = q => { const n = nomeTeste(); try { ZR.rosa(n, null, q); } catch (e) {} log('teste: ' + n + ' mandou ' + q + ' rosa(s)'); $m('jogar').click(); };
  $m('t1').onclick = () => teste(1);
  $m('t2').onclick = () => teste(50);
  $m('t3').onclick = () => teste(1000);
  $m('t4').onclick = () => { $m('jogar').click(); try { ZR.caixa(); } catch (e) {} log('teste: caixa de poder'); };

  testaServidor().then(ok => { if (ok && limpaUsuario($m('usu').value)) conectar(); });
})();
