// Pescaria ao Vivo - servidor na internet
// O aplicativo do celular se conecta aqui. Este servidor escuta a live do TikTok
// e repassa comentarios, presentes e curtidas para o app (por SSE).
//   GET /                         -> {"ok":true} (o app mostra "servidor ok")
//   GET /eventos?usuario=fulano   -> fluxo de eventos da live de @fulano
//   GET /foto?u=URL               -> foto de perfil do TikTok (evita bloqueio no celular)
//   GET /simular?usuario=fulano&tipo=entrar&id=ana&nome=Ana&sexo=m   -> teste sem live
const http = require('http');

const PORTA = process.env.PORT || 3000;
const CHAVE_EULER = process.env.EULER_API_KEY || ''; // opcional: chave do eulerstream.com

const nz = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const limpaUsuario = u => String(u || '').trim().replace(/^@/, '').replace(/[^a-zA-Z0-9._]/g, '').toLowerCase();
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };
const json = (res, o, st = 200) => { res.writeHead(st, { 'Content-Type': 'application/json', ...CORS }); res.end(JSON.stringify(o)); };

// ---------- leitura dos eventos (formato novo 2.x e antigo da biblioteca) ----------
const img = i => i && ((i.urlList && i.urlList[0]) || (i.url_list && i.url_list[0]) || (Array.isArray(i.url) ? i.url[0] : i.url) || (i.urls && i.urls[0])) || '';
const pessoa = d => {
  const u = d.user || d;
  return {
    id: String(u.uniqueId || d.uniqueId || u.displayId || d.userId || u.userId || u.idStr || u.id || u.secUid || u.nickname || d.nickname || ''),
    nome: u.nickname || d.nickname || u.uniqueId || d.uniqueId || u.displayId || '?',
    foto: d.profilePictureUrl || u.profilePictureUrl || img(u.avatarThumb) || img(u.avatarMedium) || img(u.avatarLarge) || img(u.profilePicture) || (u.profilePictureUrls && u.profilePictureUrls[0]) || ''
  };
};
const texto = d => String(d.comment !== undefined ? d.comment : (d.content !== undefined ? d.content : ''));
const NIVEIS = [['rose', 1], ['bracelet', 2], ['finger heart', 3], ['tiny diny', 4], ['capybara', 5]], POR_MOEDAS = { 1: 1, 2: 2, 5: 3, 10: 4, 30: 5 };
const presente = d => {
  const g = d.gift || {}, x = d.giftDetails || {};
  return {
    nome: d.giftName || x.giftName || g.name || '',
    tipo: d.giftType !== undefined ? d.giftType : (x.giftType !== undefined ? x.giftType : g.type),
    moedas: d.diamondCount !== undefined ? d.diamondCount : (x.diamondCount !== undefined ? x.diamondCount : g.diamondCount)
  };
};
function nivel(d) { const g = presente(d), n = nz(g.nome); for (const [k, i] of NIVEIS) if (n.includes(k)) return i; return POR_MOEDAS[g.moedas] || 0; }

// ---------- salas: uma conexao com o TikTok por usuario, compartilhada pelos apps ----------
const salas = new Map();
let libCache = null;
async function carregarLib() {
  if (libCache) return libCache;
  let lib; try { lib = await import('tiktok-live-connector'); } catch (e) { lib = require('tiktok-live-connector'); }
  return libCache = Object.assign({}, lib.default && typeof lib.default === 'object' ? lib.default : {}, lib);
}

function sala(usuario) {
  let s = salas.get(usuario);
  if (s) return s;
  s = { usuario, clientes: new Set(), conn: null, estado: 'conectando', msg: '', likes: {}, tmr: null, fim: null, ativa: true };
  s.emit = o => { const m = 'data: ' + JSON.stringify(o) + '\n\n'; s.clientes.forEach(r => r.write(m)); };
  s.status = (estado, msg) => { s.estado = estado; s.msg = msg || ''; s.emit({ tipo: 'status', estado, msg: s.msg }); console.log('[' + usuario + ']', estado, msg || ''); };
  salas.set(usuario, s);
  conectar(s);
  return s;
}

function fechar(s) {
  s.ativa = false; clearTimeout(s.tmr);
  try { if (s.conn) { s.conn.removeAllListeners(); s.conn.disconnect(); } } catch (e) {}
  salas.delete(s.usuario); console.log('[' + s.usuario + '] sala fechada');
}

async function conectar(s) {
  if (!s.ativa) return;
  clearTimeout(s.tmr);
  try {
    if (s.conn) { try { s.conn.removeAllListeners(); s.conn.disconnect(); } catch (e) {} s.conn = null; }
    const lib = await carregarLib(), E = lib.WebcastEvent || {}, K = lib.ControlEvent || {};
    const C = lib.TikTokLiveConnection || lib.WebcastPushConnection;
    const op = { processInitialData: false };
    if (CHAVE_EULER) op.signApiKey = CHAVE_EULER;
    const c = new C(s.usuario, op); s.conn = c;
    for (const n of new Set([E.CHAT, 'chat'])) c.on(n, d => {
      const p = pessoa(d), t = texto(d);
      const m = nz(t).match(/^\s*eu\b\s*(homem|mulher|h|m)?\b/);
      s.emit({ tipo: 'comentario', ...p, texto: t });
      if (!m || !p.id) return;
      const x = m[1];
      s.emit({ tipo: 'entrar', ...p, sexo: x ? (x[0] === 'h' ? 'h' : 'm') : null });
    });
    for (const n of new Set([E.GIFT, 'gift'])) c.on(n, d => {
      const g = presente(d); if (g.tipo === 1 && !d.repeatEnd) return;
      const i = nivel(d), p = pessoa(d); if (!i || !p.id) return;
      s.emit({ tipo: 'presente', ...p, nivel: i, qtd: Math.max(1, Math.min(d.repeatCount || 1, 10)) });
    });
    for (const n of new Set([E.LIKE, 'like'])) c.on(n, d => {
      const p = pessoa(d); if (!p.id) return;
      s.likes[p.id] = (s.likes[p.id] || 0) + (d.likeCount || d.count || 1);
      if (s.likes[p.id] >= 50) { const q = Math.floor(s.likes[p.id] / 50); s.likes[p.id] %= 50; s.emit({ tipo: 'curtidas', ...p, qtd: Math.min(q, 5) }); }
    });
    for (const n of new Set([E.MEMBER, 'member'])) c.on(n, d => { const p = pessoa(d); if (p.id) s.emit({ tipo: 'chegou', ...p }); });
    c.on(K.DISCONNECTED || 'disconnected', () => { if (!s.ativa) return; s.status('reconectando', 'A live caiu ou terminou. Tentando de novo...'); s.tmr = setTimeout(() => conectar(s), 8000); });
    c.on(K.ERROR || 'error', e => console.log('[' + s.usuario + '] aviso:', (e && e.message) || e));
    s.status('conectando', 'Procurando a live de @' + s.usuario + '...');
    await c.connect();
    s.status('conectado', 'Conectado na live de @' + s.usuario);
  } catch (e) {
    const m = String((e && e.message) || e);
    const off = /isn't online|not online|offline|LIVE has ended/i.test(m);
    const semSala = /Room ID/i.test(m);
    s.status('erro', semSala ? 'Nao achei a live de @' + s.usuario + ' (ela esta no ar?). Tentando de novo...' : off ?'A live de @' + s.usuario + ' nao esta no ar. Tentando de novo...' : 'Nao consegui conectar: ' + m + '. Tentando de novo...');
    if (s.ativa) s.tmr = setTimeout(() => conectar(s), 15000);
  }
}

// ---------- fotos de perfil ----------
const fotos = new Map();
async function foto(res, u) {
  try {
    const h = new URL(u).hostname;
    if (!/(tiktok|byteoversea|ibyteimg|ibytedtos|muscdn)/.test(h)) throw 0;
    let c = fotos.get(u);
    if (!c) { const r = await fetch(u); if (!r.ok) throw 0; c = { tipo: r.headers.get('content-type') || 'image/jpeg', buf: Buffer.from(await r.arrayBuffer()) }; if (fotos.size > 400) fotos.clear(); fotos.set(u, c); }
    res.writeHead(200, { 'Content-Type': c.tipo, 'Cache-Control': 'max-age=3600', ...CORS }); res.end(c.buf);
  } catch (e) { res.writeHead(404, CORS); res.end(); }
}


// ---------- apresentador com IA (OpenAI) ----------
// A chave fica so aqui no servidor (variavel OPENAI_API_KEY no Render), nunca dentro do app.
const OPENAI = process.env.OPENAI_API_KEY || '';
const MODELOS_TEXTO = [process.env.MODELO_TEXTO, 'gpt-4.1-mini', 'gpt-4o-mini'].filter(Boolean);
const MODELO_VOZ = process.env.MODELO_VOZ || 'gpt-4o-mini-tts';
const VOZ = process.env.VOZ || 'ash';
const JEITO_VOZ = process.env.JEITO_VOZ || 'Fale em portugues do Brasil, como um apresentador de TV animado e engracado, com energia, ritmo rapido e sotaque brasileiro.';
const PERSONA = `Voce e o "Capitao Pescador", apresentador de uma live de pescaria no TikTok. Voce esta num barquinho dando voltas no lago.
Como o jogo funciona: quem comenta "eu homem" ou "eu mulher" senta num banco na beira do lago. Cada 50 curtidas pesca um peixe pequeno. Presentes pescam peixes melhores: Rosa = peixe da rosa, Team Bracelet = peixe dourado, Finger Heart = peixe robo, Tiny Diny = baleia, Capybara = peixe misterioso surpresa. Quem pesca mais fica em primeiro no ranking.
Regras da sua fala:
- Portugues do Brasil, bem informal e animado, estilo narrador de futebol/apresentador de auditorio. Pode usar girias leves.
- No maximo 2 frases curtas (ate 28 palavras). Nada de emojis, hashtags, listas ou aspas.
- Chame as pessoas pelo nome que aparece. Se o nome for estranho ou cheio de simbolos, use so a parte legivel.
- Provoque a competicao de forma divertida (ex.: "fulano esta em primeiro, voces vao deixar?"), mas nunca exija presentes, nunca prometa premios, dinheiro ou vantagens fora do jogo.
- Elogie quem pesca e comente o peixe de um jeito engracado.
- Se um comentario for ofensivo, sexual, preconceituoso, politico ou pedir algo perigoso, nao repita: mude de assunto com bom humor.
- Nunca diga que e uma IA, nunca leia links nem numeros de telefone.`;
const ultimoPorSala = new Map();
async function openai(caminho, corpo) {
  const r = await fetch((process.env.OPENAI_URL || 'https://api.openai.com/v1/') + caminho, { method: 'POST', headers: { Authorization: 'Bearer ' + OPENAI, 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) });
  if (!r.ok) { const t = await r.text(); const e = new Error('OpenAI ' + r.status + ': ' + t.slice(0, 200)); e.status = r.status; throw e; }
  return r;
}
async function gerarTexto(evento, contexto) {
  let erro;
  for (const modelo of MODELOS_TEXTO) {
    try {
      const r = await openai('chat/completions', { model: modelo, max_tokens: 90, temperature: 0.95, messages: [
        { role: 'system', content: PERSONA },
        { role: 'user', content: 'Situacao da live agora: ' + contexto + '\nO que aconteceu: ' + evento + '\nResponda so com a sua fala.' }] });
      const j = await r.json();
      return String(j.choices[0].message.content || '').replace(/["“”*#]/g, '').trim().slice(0, 260);
    } catch (e) { erro = e; if (e.status === 401 || e.status === 429) break; }
  }
  throw erro;
}
async function gerarVoz(texto) {
  const r = await openai('audio/speech', { model: MODELO_VOZ, voice: VOZ, input: texto, instructions: JEITO_VOZ, response_format: 'mp3' });
  return Buffer.from(await r.arrayBuffer()).toString('base64');
}
function lerCorpo(req) { return new Promise((ok, er) => { let b = ''; req.on('data', c => { b += c; if (b.length > 8000) req.destroy(); }); req.on('end', () => { try { ok(JSON.parse(b || '{}')); } catch (e) { er(e); } }); req.on('error', er); }); }
async function apresentador(req, res) {
  let q; try { q = await lerCorpo(req); } catch (e) { return json(res, { erro: 'pedido invalido' }, 400); }
  if (!OPENAI) return json(res, { erro: 'sem_chave' }, 503);
  const sala = limpaUsuario(q.usuario) || 'teste', agora = Date.now();
  if (agora - (ultimoPorSala.get(sala) || 0) < 3500) return json(res, { erro: 'devagar' }, 429); // controla o gasto
  ultimoPorSala.set(sala, agora);
  const evento = String(q.evento || '').slice(0, 400), contexto = String(q.contexto || '').slice(0, 600);
  try {
    const texto = await gerarTexto(evento, contexto);
    let audio = '';
    if (q.voz !== false) { try { audio = await gerarVoz(texto); } catch (e) { console.log('[voz] falhou:', e.message); } }
    return json(res, { texto, audio });
  } catch (e) { console.log('[apresentador] falhou:', e.message); return json(res, { erro: e.status === 401 ? 'chave_invalida' : e.status === 429 ? 'sem_credito' : 'falhou' }, 502); }
}

// ---------- rotas ----------
http.createServer((req, res) => {
  let u; try { u = new URL(req.url, 'http://x'); } catch (e) { res.writeHead(400); return res.end(); }
  const r = u.pathname;
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }
  if (r === '/' || r === '/status') return json(res, { ok: true, salas: [...salas.keys()].length, ia: !!OPENAI });
  if (r === '/apresentador' && req.method === 'POST') return apresentador(req, res);
  if (r === '/foto') return foto(res, u.searchParams.get('u') || '');
  if (r === '/eventos') {
    const usuario = limpaUsuario(u.searchParams.get('usuario'));
    if (!usuario) return json(res, { erro: 'falta o usuario' }, 400);
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no', ...CORS });
    res.write(':ok\n\n');
    const s = sala(usuario);
    clearTimeout(s.fim); s.clientes.add(res);
    res.write('data: ' + JSON.stringify({ tipo: 'status', estado: s.estado, msg: s.msg }) + '\n\n');
    const bate = setInterval(() => res.write(':bip\n\n'), 20000); // mantem a conexao viva
    req.on('close', () => {
      clearInterval(bate); s.clientes.delete(res);
      if (!s.clientes.size) s.fim = setTimeout(() => { if (!s.clientes.size) fechar(s); }, 120000);
    });
    return;
  }
  if (r === '/simular') {
    const q = Object.fromEntries(u.searchParams), usuario = limpaUsuario(q.usuario); delete q.usuario;
    if (q.nivel) q.nivel = +q.nivel; if (q.qtd) q.qtd = +q.qtd;
    const s = salas.get(usuario); if (!s) return json(res, { erro: 'nenhum app conectado em @' + usuario }, 404);
    s.emit(q); return json(res, { ok: true, enviado: q });
  }
  res.writeHead(404, CORS); res.end();
}).listen(PORTA, () => console.log('Servidor da Pescaria ao Vivo na porta ' + PORTA));
