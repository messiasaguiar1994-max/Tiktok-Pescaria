// Pescaria ao Vivo - apresentador no barco ("Capitao Pescador")
// Fala com o chat usando a IA do servidor (OpenAI). Sem IA, usa falas prontas e a voz do celular.
(function () {
  const CENTRO = new T.Vector3(0, 0, -24), RAIO = 11.5, VEL = 0.07; // volta no lago
  const cfg = {
    ligado: () => { try { return localStorage.getItem('pesc_apresentador') !== '0'; } catch (e) { return true; } }
  };

  // ---------- barco ----------
  const barco = new T.Group();
  const madeira = M(0x8a5530), madeiraClara = M(0xb07a45), branco = M(0xf4f1ea), vermelho = M(0xd8402f);
  const casco = new T.Mesh(new T.SphereGeometry(1, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), madeira);
  madeira.side = 2; casco.scale.set(1.15, 0.55, 2.4); casco.position.y = 0.4;
  const borda = new T.Mesh(new T.TorusGeometry(1, 0.07, 6, 28), madeiraClara); borda.scale.set(1.15, 2.4, 1); borda.rotation.x = Math.PI / 2; borda.position.y = 0.4;
  const banco1 = new T.Mesh(new T.BoxGeometry(2.0, 0.1, 0.45), madeiraClara); banco1.position.set(0, 0.42, 0.7);
  const banco2 = new T.Mesh(new T.BoxGeometry(2.0, 0.1, 0.45), madeiraClara); banco2.position.set(0, 0.42, -1.1);
  const mastro = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 2.2, 6), madeiraClara); mastro.position.set(0, 1.4, 1.6);
  const bandeira = new T.Mesh(new T.PlaneGeometry(0.8, 0.5), vermelho); bandeira.material.side = 2; bandeira.position.set(0.4, 2.25, 1.6);
  const boia = new T.Mesh(new T.TorusGeometry(0.28, 0.09, 8, 16), branco); boia.position.set(1.12, 0.62, -0.2); boia.rotation.y = Math.PI / 2;
  barco.add(casco, borda, banco1, banco2, mastro, bandeira, boia);
  barco.traverse(o => { if (o.isMesh) { o.castShadow = true; } });

  // personagem provisorio (trocado pelo modelo "apresentador.glb" quando ele existir)
  const lugar = new T.Group(); lugar.position.set(0, 0.47, -0.6); barco.add(lugar);
  function provisorio() {
    const g = new T.Group(), pele = M(0xf2c9a0), roupa = M(0x2f6fd6), chapeu = M(0xffffff);
    const corpo = new T.Mesh(new T.CylinderGeometry(0.3, 0.36, 0.8, 12), roupa); corpo.position.y = 0.45;
    const cab = new T.Mesh(new T.SphereGeometry(0.3, 16, 12), pele); cab.position.y = 1.12;
    const aba = new T.Mesh(new T.CylinderGeometry(0.42, 0.42, 0.05, 16), chapeu); aba.position.y = 1.36;
    const topo = new T.Mesh(new T.CylinderGeometry(0.26, 0.3, 0.26, 16), chapeu); topo.position.y = 1.5;
    const faixa = new T.Mesh(new T.CylinderGeometry(0.305, 0.305, 0.06, 16), M(0x14223d)); faixa.position.y = 1.4;
    const olho = new T.SphereGeometry(0.04, 8, 6), preto = M(0x111111);
    const o1 = new T.Mesh(olho, preto), o2 = new T.Mesh(olho, preto); o1.position.set(-0.1, 1.16, 0.27); o2.position.set(0.1, 1.16, 0.27);
    const boca = new T.Mesh(new T.SphereGeometry(0.07, 10, 6), M(0x7a2020)); boca.scale.set(1.3, 0.35, 0.5); boca.position.set(0, 1.0, 0.27);
    const bracoG = new T.CylinderGeometry(0.08, 0.08, 0.6, 8);
    const bE = new T.Group(), bD = new T.Group();
    const mE = new T.Mesh(bracoG, roupa), mD = new T.Mesh(bracoG, roupa); mE.position.y = -0.3; mD.position.y = -0.3;
    bE.add(mE); bD.add(mD); bE.position.set(-0.36, 0.78, 0); bD.position.set(0.36, 0.78, 0);
    const mic = new T.Mesh(new T.SphereGeometry(0.07, 8, 6), M(0x222222)); mic.position.set(0, -0.62, 0.05); bD.add(mic);
    g.add(corpo, cab, aba, topo, faixa, o1, o2, boca, bE, bD);
    g.userData = { boca, bE, bD, cab };
    return g;
  }
  let pessoa = provisorio(); lugar.add(pessoa);
  let mixer = null, acoes = {};
  barco.scale.setScalar(1.7);
  barco.position.set(CENTRO.x + RAIO, -0.15, CENTRO.z);
  sc.add(barco);

  // modelo 3D do apresentador (arquivo com "apresentador" no nome)
  window.onModeloApresentador = g => {
    const m = prep(g.scene, 1.7, 1);
    lugar.remove(pessoa); pessoa = m; lugar.add(m);
    m.traverse(o => { if (o.isMesh) o.castShadow = true; });
    if (g.animations && g.animations.length) {
      mixer = new T.AnimationMixer(g.scene);
      g.animations.forEach(a => { acoes[nz(a.name)] = mixer.clipAction(a); });
      const parado = Object.keys(acoes).find(k => /idle|parad|respir|stand/.test(k)) || Object.keys(acoes)[0];
      if (parado) acoes[parado].play();
      acoes._parado = acoes[parado];
      acoes._fala = acoes[Object.keys(acoes).find(k => /talk|fala|wave|acen|gesto/.test(k))] || null;
    }
  };

  // ---------- balao de fala ----------
  const css = document.createElement('style');
  css.textContent = `#fala{position:fixed;left:50%;bottom:16px;transform:translateX(-50%) scale(.9);width:340px;box-sizing:border-box;
    padding:8px 12px 9px;border-radius:16px;background:rgba(10,20,45,.86);border:2px solid #ffd34d;color:#fff;
    font:700 14px/1.32 system-ui,Roboto,sans-serif;text-align:left;opacity:0;transition:opacity .25s,transform .25s;pointer-events:none;
    box-shadow:0 0 14px rgba(255,200,60,.45)}#fala.on{opacity:1;transform:translateX(-50%) scale(1)}
    #fala b{display:block;color:#ffd34d;font-size:11px;letter-spacing:.4px;margin-bottom:2px}`;
  document.head.appendChild(css);
  const balao = document.createElement('div'); balao.id = 'fala'; balao.innerHTML = '<b>🎙️ CAPITÃO PESCADOR</b><span></span>';
  document.getElementById('st').appendChild(balao);
  const txt = balao.querySelector('span');

  // ---------- estado da live (para a IA saber o que esta acontecendo) ----------
  const chat = []; // ultimos comentarios
  let lider = null, ultimaFala = 0, falando = false, ocupado = false;
  const fila = [];
  const agora = () => Date.now();
  function contexto() {
    const r = [...P].sort((a, b) => b.pts - a.pts).slice(0, 3).map((p, i) => (i + 1) + 'o ' + p.name + ' (' + p.pts + ' pontos)').join(', ');
    const c = chat.slice(-4).map(x => x.nome + ' disse: ' + x.texto).join(' | ');
    return (P.length ? P.length + ' pessoas sentadas no lago. Ranking: ' + r + '.' : 'Ninguem sentou ainda.') + (c ? ' Ultimos comentarios: ' + c : '');
  }

  // prioridade: maior = mais importante. Eventos velhos sao descartados.
  function poe(tipo, evento, prio, extra) {
    if (!cfg.ligado()) return;
    // junta eventos repetidos do mesmo tipo (ex.: varias pessoas chegando)
    const igual = fila.find(f => f.tipo === tipo && (tipo === 'chegou' || tipo === 'sentou' || tipo === 'chat'));
    if (igual) { igual.evento = evento; igual.t = agora(); igual.nomes = (igual.nomes || []).concat(extra && extra.nome ? [extra.nome] : []); return; }
    fila.push({ tipo, evento, prio, t: agora(), nomes: extra && extra.nome ? [extra.nome] : [], ...(extra || {}) });
    if (fila.length > 12) { fila.sort((a, b) => b.prio - a.prio); fila.length = 12; }
  }

  // ganchos do jogo
  window.onPesca = (p, peixe, pontos, nivel) => {
    poe('pesca', p.name + ' acabou de pescar: ' + peixe + ' (vale ' + pontos + ' pontos). Elogie e comente o peixe.', 5 + nivel, { nome: p.name });
    const top = [...P].sort((a, b) => b.pts - a.pts)[0];
    if (top && lider && top !== lider) poe('lider', top.name + ' passou ' + lider.name + ' e agora e o primeiro do ranking! Provoque o pessoal a reagir.', 9);
    if (top) lider = top;
  };
  window.onSentou = p => { poe('sentou', p.name + ' sentou no banco para pescar. De boas-vindas e diga como pescar (curtidas e presentes).', 4, { nome: p.name }); };
  window.apresentadorEvento = d => {
    if (d.tipo === 'comentario' && d.texto) {
      chat.push({ nome: d.nome, texto: String(d.texto).slice(0, 120) }); if (chat.length > 8) chat.shift();
      if (/^\s*eu\b/i.test(d.texto)) return; // quem pede pra sentar ja e tratado em "sentou"
      poe('chat', 'Responda o comentario de ' + d.nome + ': "' + String(d.texto).slice(0, 120) + '"', 3, { nome: d.nome });
    } else if (d.tipo === 'chegou') {
      poe('chegou', 'Chegou na live: ' + d.nome + '. Cumprimente e chame para comentar "eu homem" ou "eu mulher" para sentar e pescar.', 2, { nome: d.nome });
    }
  };

  // ---------- falas prontas (quando a IA nao esta disponivel) ----------
  const pick = a => a[Math.random() * a.length | 0];
  function falaPronta(f) {
    const n = f.nomes && f.nomes.length ? f.nomes[f.nomes.length - 1] : 'galera';
    switch (f.tipo) {
      case 'pesca': return pick(['OLHA ISSO! ' + n + ' fisgou um peixão! Que pescaria, meu povo!', 'É PEIXE! ' + n + ' tá on fire hoje, quem vai alcançar?', 'Segura que vem! ' + n + ' puxou mais um da água!']);
      case 'lider': { const t = [...P].sort((a, b) => b.pts - a.pts)[0]; return pick(['Ihhhh galera, ' + (t ? t.name : n) + ' tá em primeiro! Vocês vão deixar?', 'Mudou o ranking! ' + (t ? t.name : n) + ' assumiu a liderança, quem tem coragem de passar?']); }
      case 'sentou': return pick(['Bem-vindo ao lago, ' + n + '! Manda curtidas e presentes pra pescar!', 'Senta aí, ' + n + '! Cada 50 curtidas é um peixe, e presente pesca peixe melhor!']);
      case 'chegou': return pick(['Chegou ' + n + '! Comenta eu homem ou eu mulher e senta pra pescar!', 'Fala, ' + n + '! O lago tá cheio de peixe, comenta eu pra entrar!']);
      case 'chat': return pick(['Valeu pelo comentário, ' + n + '! Bora pescar que o peixe tá mordendo!', 'É isso aí, ' + n + '! E aí, vai pescar ou vai só olhar?']);
      default: return pick(['Atenção, pescadores! Comenta eu homem ou eu mulher pra sentar no lago!', 'Cada 50 curtidas é um peixinho! Rosa pesca o peixe da rosa, e a Capybara traz um peixe surpresa!', 'O lago tá calmo demais... quem vai ser o primeiro a pescar um peixe dourado?', 'Olha o ranking, galera! Quem vai tomar o primeiro lugar?']);
    }
  }

  // ---------- voz ----------
  function vozCelular(texto) {
    return new Promise(ok => {
      try {
        const u = new SpeechSynthesisUtterance(texto); u.lang = 'pt-BR'; u.rate = 1.08; u.pitch = 1.05;
        const v = speechSynthesis.getVoices().find(x => /pt[-_]BR/i.test(x.lang)); if (v) u.voice = v;
        u.onend = ok; u.onerror = ok; speechSynthesis.speak(u);
        setTimeout(ok, 1500 + texto.length * 90);
      } catch (e) { setTimeout(ok, 1500 + texto.length * 60); }
    });
  }
  async function vozIA(b64) {
    try { snd(); } catch (e) {}
    const bin = atob(b64), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    const buf = await AC.decodeAudioData(u8.buffer);
    return new Promise(ok => {
      const s = AC.createBufferSource(), g = AC.createGain(); g.gain.value = 1.6; s.buffer = buf; s.connect(g); g.connect(AC.destination);
      s.onended = ok; s.start(); setTimeout(ok, buf.duration * 1000 + 500);
    });
  }

  async function falar(f) {
    ocupado = true;
    let texto = '', audio = '';
    const srv = window.SERVIDOR, usu = (localStorage.getItem('pesc_usuario') || 'teste');
    if (srv && window.apresentadorIA !== false) {
      try {
        const c = new AbortController(), tm = setTimeout(() => c.abort(), 12000);
        const r = await fetch(srv + '/apresentador', { method: 'POST', signal: c.signal, headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ usuario: usu, evento: f.evento, contexto: contexto() }) });
        clearTimeout(tm);
        const j = await r.json();
        if (j.texto) { texto = j.texto; audio = j.audio || ''; }
        else if (j.erro === 'sem_chave' || j.erro === 'chave_invalida' || j.erro === 'sem_credito') { window.apresentadorIA = false; window.apresentadorAviso && apresentadorAviso(j.erro); }
      } catch (e) {}
    }
    if (!texto) texto = falaPronta(f);
    txt.textContent = texto; balao.classList.add('on'); falando = true; closeBarco = (++nFalas % 2 === 0) && !cur;
    if (acoes._fala) { acoes._fala.reset().fadeIn(.3).play(); }
    try { if (audio) await vozIA(audio); else await vozCelular(texto); } catch (e) { await new Promise(r => setTimeout(r, 2500)); }
    falando = false; if (acoes._fala) acoes._fala.fadeOut(.4);
    setTimeout(() => balao.classList.remove('on'), 1200);
    ultimaFala = agora(); ocupado = false;
  }

  // escolhe o proximo assunto
  setInterval(() => {
    if (ocupado || !cfg.ligado()) return;
    const menu = document.getElementById('menu'); if (menu && !menu.classList.contains('fora')) { ultimaFala = Math.max(ultimaFala, agora() - 25000); return; } // so fala com o jogo na tela
    const t = agora();
    for (let i = fila.length - 1; i >= 0; i--) if (t - fila[i].t > (fila[i].prio >= 5 ? 40000 : 20000)) fila.splice(i, 1);
    if (t - ultimaFala < 1800) return;
    if (fila.length) { fila.sort((a, b) => b.prio - a.prio || b.t - a.t); return falar(fila.shift()); }
    if (t - ultimaFala > 35000) falar({ tipo: 'parado', evento: 'A live esta calma. Explique de um jeito divertido como funcionam as legendas (comentar eu, curtidas e presentes) ou provoque o pessoal com o ranking.', prio: 1, nomes: [] });
  }, 600);
  ultimaFala = agora() - 25000; // primeira fala uns 10s depois de abrir

  // ---------- camera: de vez em quando mostra o barco enquanto ele fala ----------
  let closeBarco = false, nFalas = 0;
  const idleOrig = idleCam;
  idleCam = function (t) {
    idleOrig(t);
    if (falando && closeBarco) {
      const fx = Math.cos(ang) * 6.5, fz = Math.sin(ang) * 6.5;
      want.set(barco.position.x - fx * 0.2 + 5.5, 3.6, barco.position.z + 6.5);
      lt.set(barco.position.x, 1.6, barco.position.z);
    }
  };

  // ---------- movimento ----------
  let ang = 0;
  window.onQuadro = (dt, t) => {
    if (mixer) mixer.update(dt);
    ang += VEL * dt;
    const x = CENTRO.x + Math.cos(ang) * RAIO, z = CENTRO.z + Math.sin(ang) * RAIO * 0.75;
    barco.position.set(x, -0.15 + Math.sin(t * 1.6) * 0.06, z);
    barco.rotation.y = Math.atan2(-Math.sin(ang) * RAIO, Math.cos(ang) * RAIO * 0.75) + Math.PI / 2 + Math.PI;
    barco.rotation.z = Math.sin(t * 1.3) * 0.04; barco.rotation.x = Math.sin(t * 1.1) * 0.03;
    bandeira.rotation.y = Math.sin(t * 4) * 0.25;
    // apresentador vira para a camera e mexe a boca/braco quando fala
    const alvo = new T.Vector3().copy(cam.position); lugar.updateWorldMatrix(true, false);
    const local = lugar.worldToLocal(alvo); lugar.children[0] && (lugar.children[0].rotation.y = Math.atan2(local.x, local.z));
    const u = pessoa.userData || {};
    if (u.boca) u.boca.scale.y = falando ? 0.35 + Math.abs(Math.sin(t * 14)) * 0.9 : 0.35;
    if (u.bD) u.bD.rotation.x = falando ? -1.2 + Math.sin(t * 3) * 0.15 : -0.2;
    if (u.bE) u.bE.rotation.z = falando ? 0.5 + Math.sin(t * 5) * 0.5 : 0.1;
    if (u.cab) u.cab.rotation.z = falando ? Math.sin(t * 6) * 0.08 : 0;
    if (!mixer && pessoa) pessoa.position.y = falando ? Math.abs(Math.sin(t * 7)) * 0.05 : 0;
  };
})();
