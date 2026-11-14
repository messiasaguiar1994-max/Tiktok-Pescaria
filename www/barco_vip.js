// Pescaria ao Vivo - quem chega a 500 pontos sobe no barco e passa a pescar de la, junto com o apresentador.
(function () {
  const PONTOS = 500;
  const LUGARES = [ // posicoes no barco (x: lado, z: frente/tras), em medidas do barco
    { x: 0.62, z: 0.35 }, { x: -0.62, z: 0.35 }, { x: 0.62, z: 1.25 }, { x: -0.62, z: 1.25 }
  ];
  const ocupado = LUGARES.map(() => null);
  const fila = [];
  let pulo = null; // transicao banco -> barco acontecendo
  const V = new T.Vector3(), V2 = new T.Vector3(), RC = new T.Raycaster(), DOWN = new T.Vector3(0, -1, 0);

  // altura do conves em cada lugar (raio de cima para baixo no modelo do barco)
  function conves(l) {
    const B = window.BARCO; if (!B) return 0.47;
    if (l.y !== undefined && l.v === B.children.length) return l.y;
    const alvo = []; B.traverse(o => { if (o.isMesh && o.visible) alvo.push(o); });
    B.updateMatrixWorld(true);
    RC.set(B.localToWorld(V.set(l.x, 8, l.z)), DOWN);
    const h = RC.intersectObjects(alvo, false)[0];
    l.y = h ? B.worldToLocal(h.point.clone()).y : 0.47; l.v = B.children.length;
    return l.y;
  }
  // posicao/direcao no mundo de um lugar do barco
  function alvoLugar(i, pos) {
    const B = window.BARCO, l = LUGARES[i];
    B.updateMatrixWorld(true);
    pos.copy(B.localToWorld(V.set(l.x, conves(l), l.z)));
    const fora = B.localToWorld(V2.set(l.x + Math.sign(l.x), conves(l), l.z)).sub(pos); fora.y = 0; fora.normalize();
    return fora; // para onde a pessoa olha (para fora do barco, para a agua)
  }
  function aplica(p, pos, fora) {
    p.g.position.copy(pos); p.lb.scale.set(0.8, 1.0, 1); // foto/nome menores no barco
    const ry = Math.atan2(-fora.x, -fora.z);
    p.g.rotation.set(0, ry, 0);
    p.fx = -Math.sin(ry); p.fz = -Math.cos(ry);
    p.bt.set(pos.x + p.fx * 3.2, 0.08, pos.z + p.fz * 3.2);
    if (!p.st && !(cur && cur.p === p)) p.bob.position.copy(p.bt);
  }

  // volta para um banco livre (quando o barco esta cheio, quem subiu primeiro desce)
  function voltaBanco(p) {
    const seat = SEATS.find(s => !s.p); if (!seat) return;
    seat.p = p; p.seat = seat; ocupado[p.barco] = null; p.barco = undefined;
    p.g.position.set(seat.x, 0.55, seat.z); p.g.rotation.set(0, seat.ry, 0); p.lb.scale.set(1.28, 1.6, 1);
    p.fx = -Math.sin(seat.ry); p.fz = -Math.cos(seat.ry);
    const dx = seat.x - LC[0], dz = seat.z - LC[1], dl = Math.hypot(dx, dz), br = 16 + Math.random() * 3;
    p.bt.set(LC[0] + dx / dl * br, 0.08, LC[1] + dz / dl * br); p.bob.position.copy(p.bt);
  }

  function sobe(p) {
    let i = ocupado.indexOf(null);
    if (i < 0) { // barco cheio: quem esta ha mais tempo volta pro banco
      const velho = ocupado.reduce((a, b) => (a && a.vipT <= b.vipT ? a : b));
      i = velho.barco; voltaBanco(velho);
    }
    if (p.seat) { p.seat.p = null; p.seat = null; } // libera o banco para outra pessoa
    ocupado[i] = p; p.vipT = clk.elapsedTime;
    pulo = { p, i, t0: clk.elapsedTime, S: p.g.position.clone() };
    p.rod.visible = false; p.line.visible = false; p.bob.visible = false; p.st = 0;
    try { flash('⛵ ' + p.name + ' chegou a ' + PONTOS + ' pontos e subiu no barco!', 4000); } catch (e) {}
    try { window.apresentadorBarco && apresentadorBarco(p); } catch (e) {}
  }

  // quem chega a 500
  const pescaAntes = window.onPesca;
  window.onPesca = function (p) {
    try { pescaAntes && pescaAntes.apply(this, arguments); } catch (e) {}
    if (p.pts >= PONTOS && !p.vip) { p.vip = true; if (!fila.includes(p)) fila.push(p); }
  };

  // camera acompanha o pulo para o barco
  const idleAntes = idleCam;
  idleCam = function (t) {
    idleAntes(t);
    if (!pulo) return;
    const B = window.BARCO; if (!B) return;
    lt.copy(pulo.p.g.position); lt.y = 1.2;
    want.copy(B.position).add(V.set(9, 6, 9));
  };

  const quadroAntes = window.onQuadro;
  window.onQuadro = function (dt, t) {
    try { quadroAntes && quadroAntes(dt, t); } catch (e) {}
    if (!window.BARCO) return;
    // comeca o pulo quando nao tem captura nem mergulho acontecendo
    if (!pulo && fila.length && !cur && !window.MERGULHO && !(window.MERG_FILA && MERG_FILA.length)) { const p = fila.shift(); if (p.g.parent) sobe(p); }
    window.PULO_BARCO = !!pulo;
    if (pulo) {
      const p = pulo.p, e = (t - pulo.t0) / 1.8;
      const pos = new T.Vector3(), fora = alvoLugar(pulo.i, pos);
      if (e >= 1 || !p.g.parent) {
        pulo = null; p.barco = ocupado.indexOf(p); p.rod.visible = p.line.visible = p.bob.visible = true; aplica(p, pos, fora);
        try { splash(); } catch (x) {}
      } else {
        const u = e * e * (3 - 2 * e);
        p.g.position.lerpVectors(pulo.S, pos, u); p.g.position.y += Math.sin(Math.PI * e) * 6;
        p.g.rotation.y += dt * 9; // gira no ar
      }
    }
    // quem esta no barco anda junto com ele
    ocupado.forEach((p, i) => {
      if (!p || (pulo && pulo.p === p)) return;
      if (!p.g.parent) { ocupado[i] = null; return; }
      const pos = new T.Vector3(), fora = alvoLugar(i, pos); aplica(p, pos, fora);
    });
  };

  window.testeBarco = (i) => { const p = P[i || 0]; if (p) { p.pts = Math.max(p.pts, PONTOS); renderRank(); window.onPesca(p, 'teste', 0, 0, true); } };
})();
