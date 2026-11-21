// Pescaria ao Vivo - quem chega a 200 pontos ganha um banco grande e alto (trono), acima dos outros pescadores.
(function () {
  const PONTOS = 200, ALTURA = 1.7;
  const fila = [];
  let sobe = null; // animacao subindo no trono

  const madeira = M(0x7a4a24), ouro = M(0xf2c230, { metalness: 0.6, roughness: 0.3 }), vermelho = M(0xb3202a, { roughness: 0.6 });
  function constroi(seat) {
    const g = new T.Group();
    const base = new T.Mesh(new T.BoxGeometry(1.7, ALTURA, 1.2), madeira); base.position.y = ALTURA / 2;
    const faixa = new T.Mesh(new T.BoxGeometry(1.75, 0.12, 1.25), ouro); faixa.position.y = ALTURA - 0.1;
    const faixa2 = faixa.clone(); faixa2.position.y = 0.15;
    const degrau = new T.Mesh(new T.BoxGeometry(1.4, 0.5, 0.6), madeira); degrau.position.set(0, 0.25, -0.85);
    const assento = new T.Mesh(new T.BoxGeometry(1.5, 0.2, 1.0), vermelho); assento.position.y = ALTURA + 0.45;
    const encosto = new T.Mesh(new T.BoxGeometry(1.5, 1.6, 0.18), ouro); encosto.position.set(0, ALTURA + 1.2, 0.5);
    const almof = new T.Mesh(new T.BoxGeometry(1.25, 1.3, 0.1), vermelho); almof.position.set(0, ALTURA + 1.15, 0.4);
    const bE = new T.Mesh(new T.BoxGeometry(0.16, 0.5, 1.0), ouro), bD = bE.clone(); bE.position.set(-0.75, ALTURA + 0.7, 0); bD.position.set(0.75, ALTURA + 0.7, 0);
    const pe = new T.Mesh(new T.CylinderGeometry(0.09, 0.09, 0.45, 8), ouro);
    [[-0.65, -0.4], [0.65, -0.4], [-0.65, 0.4], [0.65, 0.4]].forEach(([x, z]) => { const k = pe.clone(); k.position.set(x, ALTURA + 0.2, z); g.add(k); });
    const coroa = new T.Mesh(new T.ConeGeometry(0.22, 0.35, 5), ouro); coroa.position.set(0, ALTURA + 2.15, 0.5);
    g.add(base, faixa, faixa2, degrau, assento, encosto, almof, bE, bD, coroa);
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    g.position.set(seat.x, 0, seat.z); g.rotation.y = seat.ry; sc.add(g);
    return g;
  }

  // coloca/remove o trono de uma pessoa (usado tambem quando ela vai para o barco ou volta para um banco)
  window.tronoPara = (p, instantaneo) => {
    if (!p.seat) return;
    if (p.tronoMesh) sc.remove(p.tronoMesh);
    p.tronoMesh = constroi(p.seat); p.trono = true;
    if (instantaneo) p.g.position.y = 0.55 + ALTURA;
  };
  window.tronoRemove = p => { if (p.tronoMesh) { sc.remove(p.tronoMesh); p.tronoMesh = null; } };

  // chega a 200 pontos
  const pescaAntes = window.onPesca;
  window.onPesca = function (p) {
    try { pescaAntes && pescaAntes.apply(this, arguments); } catch (e) {}
    if (p.pts >= PONTOS && !p.trono && !p.tronoFila && p.barco === undefined && !p.vip) { p.tronoFila = true; fila.push(p); }
  };

  const idleAntes = idleCam;
  idleCam = function (t) {
    idleAntes(t);
    if (!sobe) return;
    const q = sobe.p.g.position, p = sobe.p;
    want.set(q.x + p.fx * 6 - p.fz * 2.5, 2.4 + ALTURA, q.z + p.fz * 6 + p.fx * 2.5); lt.set(q.x, 1.2 + ALTURA * 0.7, q.z);
  };

  const quadroAntes = window.onQuadro;
  window.onQuadro = function (dt, t) {
    try { quadroAntes && quadroAntes(dt, t); } catch (e) {}
    const livre = !cur && !window.MERGULHO && !window.PULO_BARCO && !(window.MERG_FILA && MERG_FILA.length);
    if (!sobe && fila.length && livre) {
      const p = fila.shift(); p.tronoFila = false;
      if (p.g.parent && p.seat && p.barco === undefined) {
        tronoPara(p); sobe = { p, t0: t, y0: p.g.position.y };
        try { flash('👑 ' + p.name + ' chegou a ' + PONTOS + ' pontos e ganhou o banco gigante!', 3500); } catch (e) {}
        try { window.apresentadorTrono && apresentadorTrono(p); } catch (e) {}
        try { tn && tn('sine', 523, 1046, 0, 0.5, 0.12); } catch (e) {}
      }
    }
    window.SUBINDO_TRONO = !!sobe;
    if (sobe) {
      const p = sobe.p, u = Math.min((t - sobe.t0) / 1.4, 1), k = u * u * (3 - 2 * u);
      p.g.position.y = sobe.y0 + (0.55 + ALTURA - sobe.y0) * k + Math.sin(Math.PI * u) * 1.2;
      if (u >= 1) { p.g.position.y = 0.55 + ALTURA; sobe = null; }
    }
  };

  window.testeTrono = (i) => { const p = P[i || 0]; if (p) { p.pts = Math.max(p.pts, PONTOS); renderRank(); window.onPesca(p, 'teste', 0, 0, true); } };
})();
