// Pescaria ao Vivo - tela inicial do aplicativo (servidor, usuario, conectar, jogar)
(function () {
  // Endereco do servidor na internet. Pode ser trocado dentro do app em "Configuracoes".
  const SERVIDOR_PADRAO = 'https://tiktok-pescaria.onrender.com';
  window.AUDIO_LISTA = 'audio/lista.json';

  const guarda = {
    ler: (k, p) => { try { const v = localStorage.getItem('pesc_' + k); return v === null ? p : v; } catch (e) { return p; } },
    salvar: (k, v) => { try { localStorage.setItem('pesc_' + k, v); } catch (e) {} }
  };
  const limpaUrl = u => String(u || '').trim().replace(/\/+$/, '').replace(/^(?!https?:\/\/)(.+)$/, 'https://$1');
  const limpaUsuario = u => String(u || '').trim().replace(/^@/, '').replace(/\s+/g, '');
  window.SERVIDOR = limpaUrl(guarda.ler('servidor', SERVIDOR_PADRAO));

  // ---------- tela ----------
  const css = document.createElement('style');
  css.textContent = `
  #menu{position:fixed;inset:0;z-index:9999;overflow:auto;background:linear-gradient(180deg,#123a6b,#0b1d3a);color:#fff;
    font-family:system-ui,-apple-system,Roboto,sans-serif;padding:max(22px,env(safe-area-inset-top)) 20px 30px;box-sizing:border-box}
  #menu.fora{display:none}
  #menu h1{font-size:28px;margin:6px 0 4px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  #menu .pill{font-size:13px;font-weight:700;padding:4px 12px;border-radius:99px;background:#2a4a75;color:#cfe3ff}
  #menu .pill.ok{background:#1f6f45;color:#c9ffd9}#menu .pill.ruim{background:#7a2b2b;color:#ffd6d6}
  #menu label{display:block;margin:18px 0 6px;color:#b9cbe6;font-size:15px}
  #menu input{width:100%;box-sizing:border-box;font-size:18px;padding:13px 14px;border-radius:14px;border:1px solid #38557f;background:#0e2444;color:#fff}
  #menu .lin{display:flex;align-items:center;gap:12px;margin-top:14px}
  #menu button{font-size:18px;font-weight:700;border:0;border-radius:14px;padding:13px 18px;background:#2c4a73;color:#fff}
  #menu .bola{width:14px;height:14px;border-radius:50%;background:#777;flex:none}
  #menu .bola.ok{background:#3ddc84;box-shadow:0 0 8px #3ddc84}#menu .bola.esp{background:#ffcc33}#menu .bola.ruim{background:#ff5b5b}
  #menu #jogar{width:100%;margin-top:18px;font-size:30px;padding:18px;background:linear-gradient(90deg,#23c86a,#7bdc3a);color:#082a12}
  #menu .cx{margin-top:24px;background:#1b3558;border:1px solid #2f4f7a;border-radius:16px;padding:12px 14px}
  #menu summary{font-size:16px;font-weight:700}
  #menu .dica{color:#9fb6d6;font-size:14px;line-height:1.45;margin-top:8px}
  #menu #log{margin-top:10px;font-size:13px;color:#cfe3ff;max-height:150px;overflow:auto;white-space:pre-wrap}
  `;
  document.head.appendChild(css);

  const m = document.createElement('div');
  m.id = 'menu';
  m.innerHTML = `
    <h1>🎣 Pescaria ao Vivo <span id="svst" class="pill">servidor ?</span></h1>
    <label for="usu">Usuário do TikTok da live</label>
    <input id="usu" placeholder="@seu_usuario" autocomplete="off" autocapitalize="off" spellcheck="false">
    <div class="lin"><button id="con">Conectar</button><span id="bola" class="bola"></span><span id="est">desconectado</span></div>
    <button id="jogar">▶ JOGAR</button>
    <div class="dica" id="carga">Carregando os modelos 3D...</div>
    <details class="cx"><summary>⚙️ Configurações</summary>
      <label for="srv">Endereço do servidor</label>
      <input id="srv" placeholder="https://seu-servidor.onrender.com" autocomplete="off" autocapitalize="off" spellcheck="false">
      <div class="lin"><button id="salva">Salvar e testar</button></div>
      <label style="display:flex;gap:10px;align-items:center"><input type="checkbox" id="apr" style="width:22px;height:22px"> Apresentador no barco (fala com o chat)</label>
      <div class="dica" id="aprst"></div>
      <label for="voz">Voz do apresentador</label>
      <select id="voz" style="width:100%;font-size:17px;padding:11px;border-radius:14px;border:1px solid #38557f;background:#0e2444;color:#fff">
        <option value="marin">Marin (recomendada)</option><option value="cedar">Cedar (recomendada)</option><option value="ash">Ash</option>
        <option value="ballad">Ballad</option><option value="echo">Echo</option><option value="verse">Verse</option><option value="sage">Sage</option>
        <option value="coral">Coral</option><option value="alloy">Alloy</option><option value="onyx">Onyx</option><option value="nova">Nova</option><option value="shimmer">Shimmer</option></select>
      <div class="lin"><button id="tvoz">🔊 Testar voz</button><span id="tvozst" class="dica" style="margin:0"></span></div>
      <div class="dica">Durante o jogo, aperte o botão <b>Voltar</b> do celular para voltar a esta tela.</div>
    </details>
    <details class="cx"><summary>🧪 Testar sem live</summary>
      <div class="dica">Coloca espectadores de mentira no jogo, para ver se está tudo funcionando.</div>
      <div class="lin"><button id="t1">Alguém senta</button><button id="t2">Rosa</button><button id="t3">Capybara</button></div>
    </details>
    <details class="cx"><summary>📋 O que está chegando da live</summary><div id="log">nada ainda</div></details>
  `;
  document.body.appendChild(m);
  const $m = id => document.getElementById(id);
  $m('usu').value = guarda.ler('usuario', '') ? '@' + guarda.ler('usuario', '') : '';
  $m('srv').value = window.SERVIDOR;
  $m('apr').checked = guarda.ler('apresentador', '1') !== '0';
  $m('voz').value = guarda.ler('voz', 'marin'); $m('voz').onchange = () => guarda.salvar('voz', $m('voz').value);
  $m('tvoz').onclick = () => {
    try { snd(); } catch (e) {}
    $m('tvozst').textContent = 'gerando a voz...'; window.ultimaVoz = null;
    if (!window.testarVoz || !testarVoz()) { $m('tvozst').textContent = 'ele está falando, tente de novo em instantes'; return; }
    const t0 = Date.now(), iv = setInterval(() => { if (window.ultimaVoz && Date.now() - t0 > 300) { $m('tvozst').textContent = window.ultimaVoz === 'ia' ? 'voz da IA (OpenAI) ✔' : 'voz do celular (a IA não respondeu)'; window.ultimaVoz = null; clearInterval(iv) } if (Date.now() - t0 > 20000) clearInterval(iv) }, 300);
  };
  $m('apr').onchange = () => guarda.salvar('apresentador', $m('apr').checked ? '1' : '0');
  window.apresentadorAviso = e => {
    const msg = { sem_chave: 'A IA ainda não está ligada no servidor (falta a chave da OpenAI no Render). Ele usa falas prontas e a voz do celular.',
      chave_invalida: 'A chave da OpenAI no Render está errada. Ele usa falas prontas por enquanto.',
      sem_credito: 'A OpenAI recusou por falta de crédito ou limite. Ele usa falas prontas por enquanto.' }[e] || '';
    $m('aprst').textContent = msg; if (msg) log('Apresentador: ' + msg);
  };

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
        const j = await r.json(); if (j.ok) { p.className = 'pill ok'; p.textContent = 'servidor ok'; $m('aprst').textContent = j.ia ? 'IA do apresentador: ligada ✔' : 'IA do apresentador: desligada (falta a chave da OpenAI no Render)'; window.apresentadorIA = j.ia ? undefined : false; return true; }
      } catch (e) {}
      await new Promise(r => setTimeout(r, 3000));
    }
    p.className = 'pill ruim'; p.textContent = 'servidor fora do ar'; return false;
  }
  $m('salva').onclick = () => {
    window.SERVIDOR = limpaUrl($m('srv').value); $m('srv').value = window.SERVIDOR;
    guarda.salvar('servidor', window.SERVIDOR); testaServidor();
  };

  // ---------- conexao com a live ----------
  let es = null;
  const JOGO = { entrar: 1, presente: 1, curtidas: 1 };
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
      if (d.tipo === 'status') {
        estado(d.estado === 'conectado' ? 'ok' : d.estado === 'erro' ? 'ruim' : 'esp', d.msg || d.estado);
        if (d.msg) log(d.msg);
        return;
      }
      if (d.tipo === 'comentario' || d.tipo === 'chegou') { if (d.tipo === 'comentario') log(d.nome + ': ' + d.texto); try { window.apresentadorEvento && apresentadorEvento(d); } catch (e) {} return; }
      if (JOGO[d.tipo]) {
        log(d.tipo === 'entrar' ? d.nome + ' sentou' : d.tipo === 'presente' ? d.nome + ' mandou presente (nível ' + d.nivel + ')' : d.nome + ' +200 curtidas');
        try { aoEvento(d); } catch (e) { console.error(e); }
      }
    };
    es.onerror = () => estado('esp', 'sem sinal do servidor, tentando de novo...');
  }
  $m('con').onclick = conectar;

  // ---------- jogar / voltar ----------
  $m('jogar').onclick = () => {
    if (!es && limpaUsuario($m('usu').value)) conectar();
    try { snd(); } catch (e) {}
    m.classList.add('fora');
    history.pushState({ jogo: 1 }, '');
  };
  addEventListener('popstate', () => m.classList.remove('fora'));

  // ---------- testes ----------
  let nt = 0;
  const teste = ev => { try { aoEvento(ev); } catch (e) {} log('teste: ' + ev.tipo); };
  $m('t1').onclick = () => { nt++; teste({ tipo: 'entrar', id: 'teste' + nt, nome: 'Teste ' + nt, sexo: nt % 2 ? 'h' : 'm' }); };
  $m('t2').onclick = () => teste({ tipo: 'presente', id: 'teste' + Math.max(1, nt), nome: 'Teste ' + Math.max(1, nt), nivel: 1, qtd: 1 });
  $m('t3').onclick = () => teste({ tipo: 'presente', id: 'teste' + Math.max(1, nt), nome: 'Teste ' + Math.max(1, nt), nivel: 5, qtd: 1 });

  // ---------- modelos 3D que vem dentro do app ----------
  fetch('modelos/lista.json').then(r => r.json()).then(L => {
    const fs = L.map(it => ({ name: it.nome, arrayBuffer: () => fetch(it.url).then(r => r.arrayBuffer()) }));
    let n = 0;
    const fs2 = fs.map(f => ({ name: f.name, arrayBuffer: () => f.arrayBuffer().then(b => { n++; $m('carga').textContent = n < fs.length ? 'Carregando os modelos 3D... ' + n + '/' + fs.length : 'Modelos 3D prontos ✔'; return b; }) }));
    if (fs2.length) document.getElementById('mf').onchange({ target: { files: fs2, value: '' } });
  }).catch(e => { $m('carga').textContent = 'Não consegui carregar os modelos 3D'; console.error(e); });

  testaServidor().then(ok => { if (ok && limpaUsuario($m('usu').value)) conectar(); });
})();
