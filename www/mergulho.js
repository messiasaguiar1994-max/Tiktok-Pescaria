// Pescaria ao Vivo - comemoracao: a cada 100 pontos o personagem levanta, mergulha no lago,
// volta, se sacode (espirrando agua) e senta de novo no banco.
(function () {
  const PASSO = 100;              // pontos para cada mergulho
  const DUR = 6.2;                // duracao total em segundos
  let ativo = null;               // mergulho acontecendo agora
  const fila = [];                // quem esta esperando para mergulhar
  window.MERGULHO = false;        // enquanto true, a fila de pescaria espera

  // ---------- efeitos: anel de respingo e gotinhas ----------
  const FX = [];
  const gotaG = new T.SphereGeometry(0.06, 6, 4);
  const gotaM = new T.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.95 });
  function anel(pos, tam) {
    const r = new T.Mesh(new T.RingGeometry(0.6, 0.85, 32), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, side: 2 }));
    r.rotation.x = -Math.PI / 2; r.position.set(pos.x, 0.08, pos.z); sc.add(r);
    FX.push({ o: r, t0: clk.elapsedTime, vida: 1.2, tipo: 'anel', tam });
  }
  function gotas(pos, n, forca, alto) {
    for (let i = 0; i < n; i++) {
      const g = new T.Mesh(gotaG, gotaM.clone()); g.position.copy(pos); g.position.y += alto || 0;
      const a = Math.random() * Math.PI * 2, v = forca * (0.5 + Math.random());
      g.userData.v = new T.Vector3(Math.cos(a) * v, forca * (1 + Math.random() * 1.4), Math.sin(a) * v);
      sc.add(g); FX.push({ o: g, t0: clk.elapsedTime, vida: 1.1, tipo: 'gota' });
    }
  }
  function atualizaFX(dt, t) {
    for (let i = FX.length - 1; i >= 0; i--) {
      const f = FX[i], u = (t - f.t0) / f.vida;
      if (u >= 1) { sc.remove(f.o); FX.splice(i, 1); continue; }
      if (f.tipo === 'anel') { f.o.scale.setScalar(1 + u * 4 * f.tam); f.o.material.opacity = 0.9 * (1 - u); }
      else { f.o.userData.v.y -= 9.8 * dt; f.o.position.addScaledVector(f.o.userData.v, dt); f.o.material.opacity = 0.95 * (1 - u); if (f.o.position.y < 0.02) { f.o.position.y = 0.02; f.o.userData.v.set(0, 0, 0); } }
    }
  }

  // ---------- quem chega em 100, 200, 300... pontos ----------
  function confere(p) {
    const n = Math.floor(p.pts / PASSO);
    if (n > (p.mgN || 0)) { p.mgN = n; if (!fila.includes(p) && ativo?.p !== p) fila.push(p); }
  }
  const pescaOrig = window.onPesca;
  window.onPesca = function (p) { try { pescaOrig && pescaOrig.apply(this, arguments); } catch (e) {} confere(p); };

  // ---------- o mergulho ----------
  const AX = new T.Vector3(1, 0, 0), QT = new T.Quaternion(), TMP = new T.Vector3();
  const ease = u => u * u * (3 - 2 * u);
  function comeca(p) {
    ativo = { p, t0: clk.elapsedTime, S: p.g.position.clone(), q0: p.g.quaternion.clone(), f: new T.Vector3(p.fx, 0, p.fz), fase: 0 };
    ativo.D = ativo.S.clone().addScaledVector(ativo.f, 4.6); ativo.D.y = 0;
    p.st = 0; p.rod.visible = false; p.line.visible = false; p.bob.visible = false;
    window.MERGULHO = true;
    try { window.apresentadorMergulho && apresentadorMergulho(p); } catch (e) {}
    try { flash('🏊 ' + p.name + ' chegou a ' + (p.mgN * PASSO) + ' pontos! Mergulho!', 3500); } catch (e) {}
  }
  function termina() {
    const a = ativo, p = a.p;
    p.g.position.copy(a.S); p.g.quaternion.copy(a.q0);
    p.rod.visible = true; p.line.visible = true; p.bob.visible = true;
    ativo = null; window.MERGULHO = false;
  }
  function anima(t) {
    const a = ativo, p = a.p, e = t - a.t0, g = p.g, S = a.S, D = a.D;
    let pitch = 0, giro = 0;
    if (e < 0.5) { // levanta do banco
      const u = ease(e / 0.5); g.position.copy(S); g.position.y = S.y + 0.45 * u; pitch = -0.15 * u;
    } else if (e < 1.5) { // pulo em arco ate o lago, virando de cabeca
      const u = (e - 0.5) / 1.0; g.position.lerpVectors(S, D, u); g.position.y = (S.y + 0.45) * (1 - u) + Math.sin(Math.PI * u) * 2.8 - 0.4 * u;
      pitch = -0.15 - 2.2 * ease(u);
      if (a.fase < 1 && u > 0.92) { a.fase = 1; try { splash(); } catch (x) {} anel(D, 1); gotas(D, 26, 2.6); }
    } else if (e < 2.7) { // embaixo d'agua
      g.position.copy(D); g.position.y = -2.6; pitch = 0;
      if (a.fase < 2 && e > 2.2) { a.fase = 2; anel(D, 0.6); }
    } else if (e < 3.2) { // volta a superficie
      const u = ease((e - 2.7) / 0.5); g.position.copy(D); g.position.y = -2.6 + 2.75 * u;
      if (a.fase < 3) { a.fase = 3; try { splash(); } catch (x) {} anel(D, 0.8); gotas(D, 14, 1.8); }
    } else if (e < 4.1) { // pulo de volta para a beira, ao lado do banco
      const u = (e - 3.2) / 0.9; g.position.lerpVectors(D, S, u); g.position.y = 0.15 * (1 - u) + (S.y + 0.45) * u + Math.sin(Math.PI * u) * 2.2;
      pitch = Math.sin(Math.PI * u) * 0.3;
    } else if (e < 5.5) { // se sacode, espirrando agua
      const u = (e - 4.1) / 1.4; g.position.copy(S); g.position.y = S.y + 0.45 + Math.abs(Math.sin(e * 18)) * 0.06;
      giro = Math.sin(e * 34) * 0.5 * (1 - u);
      if (a.fase < 4) { a.fase = 4; a.ug = 0; }
      if (e - (a.ug || 0) > 0.12 && u < 0.85) { a.ug = e; g.localToWorld(TMP.set(0, 1.0, 0)); gotas(TMP, 6, 1.6); }
    } else if (e < DUR) { // senta de novo
      const u = ease((e - 5.5) / (DUR - 5.5)); g.position.copy(S); g.position.y = S.y + 0.45 * (1 - u);
    } else { termina(); return; }
    // rotacao: mantem o banco como base e inclina para a frente/gira no proprio eixo
    g.quaternion.copy(a.q0);
    if (pitch) g.quaternion.multiply(QT.setFromAxisAngle(AX, pitch));
    if (giro) g.quaternion.multiply(QT.setFromAxisAngle(T.Object3D.DefaultUp, giro));
  }

  // ---------- camera acompanha o mergulho ----------
  const idleAntes = idleCam;
  idleCam = function (t) {
    idleAntes(t);
    if (!ativo) return;
    const a = ativo, lado = new T.Vector3(-a.f.z, 0, a.f.x), meio = a.S.clone().lerp(a.D, 0.5);
    want.copy(meio).addScaledVector(lado, 7.5).addScaledVector(a.f, 1.5); want.y = 3.4;
    lt.copy(meio); lt.y = 0.8;
  };

  // ---------- roda junto com o jogo ----------
  const quadroAntes = window.onQuadro;
  window.onQuadro = function (dt, t) {
    try { quadroAntes && quadroAntes(dt, t); } catch (e) {}
    atualizaFX(dt, t);
    if (ativo) { if (!ativo.p.g.parent) { ativo = null; window.MERGULHO = false; } else anima(t); }
    else if (!cur && fila.length) { const p = fila.shift(); if (p.g.parent) comeca(p); }
  };

  // para testar: no console, testeMergulho()
  window.testeMergulho = (i) => { const p = P[i || 0]; if (p) { p.pts = Math.max(p.pts, PASSO * ((p.mgN || 0) + 1)); renderRank(); confere(p); } };
})();
