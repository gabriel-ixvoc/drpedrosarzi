/* ==========================================================================
   Pedro Sarzi · molde das páginas de condição (/condicoes/<slug>/)
   1. [data-figura-abas]  abas com figura (Fig. 3 das condições): troca de painel e
      estado da figura (data-estado; .on nos [data-mostra]; transform dos [data-transforma]).
      Setas, Home e End vêm do site.js ([role=tablist]).
   2. [data-angulo]       o ângulo do punho (túnel do carpo): mão de perfil desenhada a
      cada ângulo, faixa do túnel em hachura e o goniômetro do site (.gonio) no punho.
   3. [data-video]        Fig. 2 em vídeo: carrega e toca ao entrar na tela; com movimento
      reduzido ou "Pausar animações", só o pôster, e toca se a pessoa pedir.
   4. [data-copiar]       copiar as perguntas para a consulta (status aria-live).
   5. [data-assinatura]   o momento-assinatura de cada condição na figura de abas (GSAP pela
      camada assets/movimento.js; o arrasto do dedo em gatilho funciona sem ela).
   Movimento: 180 a 250 ms com var(--ease); parado com prefers-reduced-motion e com
   html.motion-paused (PS.motion.paused e o evento motionchange do site.js).
   ========================================================================== */
(function () {
'use strict';
const PS = window.PS || {};
const $ = PS.$ || ((s, c) => (c || document).querySelector(s));
const $$ = PS.$$ || ((s, c) => Array.from((c || document).querySelectorAll(s)));
const RM = matchMedia('(prefers-reduced-motion: reduce)');
const parado = () => RM.matches || !!(PS.motion && PS.motion.paused);

/* ---------- 0. Abertura da capa (CSS): tocou uma vez, sai, para pausar e voltar não repetir ---------- */
$$('.cond-capa').forEach(capa => setTimeout(() => capa.classList.add('cond-capa--aberta'), 2600));

/* ---------- 1. Abas com figura ---------- */
$$('[data-figura-abas]').forEach(fig => {
  const abas = $$('[role="tab"]', fig);
  if (!abas.length) return;
  const paineis = abas.map(a => document.getElementById(a.getAttribute('aria-controls')));
  const valorDe = (a, i) => a.dataset.valor || String(i);
  let estadoAtual = null;
  function escolher (i, pessoa) {
    const anterior = estadoAtual;
    abas.forEach((a, k) => {
      const sel = k === i;
      a.setAttribute('aria-selected', String(sel));
      a.tabIndex = sel ? 0 : -1;
      if (paineis[k]) paineis[k].hidden = !sel;
    });
    const v = valorDe(abas[i], i);
    fig.dataset.estado = v;
    $$('[data-mostra]', fig).forEach(el => el.classList.toggle('on', el.dataset.mostra.split(/\s+/).includes(v)));
    $$('[data-transforma]', fig).forEach(el => {
      let mapa = {};
      try { mapa = JSON.parse(el.dataset.transforma); } catch (e) { mapa = {}; }
      el.style.transform = mapa[v] || '';
    });
    $$('[data-aba]', fig).forEach(el => el.classList.toggle('on', el.dataset.aba === v));
    estadoAtual = v;
    /* o momento-assinatura (seção 5) anima a troca a partir do estado anterior */
    if (anterior !== v) fig.dispatchEvent(new CustomEvent('figura:estado', { detail: { valor: v, anterior, indice: i, pessoa: !!pessoa } }));
  }
  /* para o arrasto da seção 5: escolher a aba i como se a pessoa tivesse clicado */
  fig.figuraEscolher = i => { if (abas[i]) escolher(i, true); };
  fig.figuraValores = abas.map(valorDe);
  abas.forEach((a, i) => a.addEventListener('click', () => escolher(i, true)));
  /* clicar numa região do desenho escolhe a aba dela (só ponteiro: o SVG não recebe foco) */
  $$('[data-aba]', fig).forEach(el => el.addEventListener('click', () => {
    const i = abas.findIndex((a, k) => valorDe(a, k) === el.dataset.aba);
    if (i >= 0) abas[i].click();
  }));
  escolher(Math.max(0, abas.findIndex(a => a.getAttribute('aria-selected') === 'true')));
});

/* ---------- 2. O ângulo do punho ----------
   Mão de perfil: o modelo paramétrico do motion-02 (instagram/motions/motion-02.js, "perfil do
   punho"), em milímetros, com o pivô do punho em (0, 0), dedos para a direita e palma para baixo
   (flexão positiva leva a mão para baixo). Só o contorno e as hachuras de sombra da gravura: sem
   osso, nervo ou ligamento. A faixa do túnel fica do lado da palma e estreita conforme o ângulo. */
const Perfil = (function () {
  const D2R = Math.PI / 180;
  const lerp = (a, b, t) => a + (b - a) * t;
  const cl = v => Math.max(0, Math.min(1, v));
  const suave = (a, b, x) => { const t = cl((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  function prof (keys) {
    const n = keys.length;
    return s => {
      if (s <= keys[0][0]) return keys[0][1];
      if (s >= keys[n - 1][0]) return keys[n - 1][1];
      let i = 1; while (keys[i][0] < s) i++;
      const [x0, y0] = keys[i - 1], [x1, y1] = keys[i], h = x1 - x0, u = (s - x0) / h;
      const m0 = i > 1 ? (y1 - keys[i - 2][1]) / (x1 - keys[i - 2][0]) : (y1 - y0) / h;
      const m1 = i < n - 1 ? (keys[i + 1][1] - y0) / (keys[i + 1][0] - x0) : (y1 - y0) / h;
      const u2 = u * u, u3 = u2 * u;
      return (2 * u3 - 3 * u2 + 1) * y0 + (u3 - 2 * u2 + u) * h * m0 + (-2 * u3 + 3 * u2) * y1 + (u3 - u2) * h * m1;
    };
  }
  function cruza (p1, p2, p3, p4) {
    const d = (p2[0] - p1[0]) * (p4[1] - p3[1]) - (p2[1] - p1[1]) * (p4[0] - p3[0]);
    if (Math.abs(d) < 1e-9) return null;
    const ua = ((p3[0] - p1[0]) * (p4[1] - p3[1]) - (p3[1] - p1[1]) * (p4[0] - p3[0])) / d;
    const ub = ((p3[0] - p1[0]) * (p2[1] - p1[1]) - (p3[1] - p1[1]) * (p2[0] - p1[0])) / d;
    if (ua < 0 || ua > 1 || ub < 0 || ub > 1) return null;
    return [p1[0] + ua * (p2[0] - p1[0]), p1[1] + ua * (p2[1] - p1[1])];
  }
  /* antebraço, mão (punho até a junta do indicador) e falanges do indicador; raios dorsal e palmar em mm */
  const MAO = { base: [-230, 0], sgn: 1, ponta: 7.0, segs: [
    { len: 230, rd: prof([[0, 24], [0.5, 22], [1, 16.5]]), rp: prof([[0, 30], [0.45, 28.5], [1, 18.5]]) },
    { len: 84, rd: prof([[0, 16.5], [0.16, 17.4], [0.55, 12.6], [1, 9.8]]), rp: prof([[0, 18.5], [0.12, 19.6], [0.42, 27], [0.72, 24], [0.9, 20.6], [1, 19]]) },
    { len: 41, rd: prof([[0, 9.8], [0.45, 7.5], [0.9, 7.1], [1, 7.3]]), rp: prof([[0, 19], [0.24, 15.4], [0.46, 10.9], [0.72, 10.4], [1, 9.8]]) },
    { len: 24, rd: prof([[0, 7.3], [0.5, 6.3], [1, 6.0]]), rp: prof([[0, 9.8], [0.45, 9.5], [1, 8.5]]) },
    { len: 18.5, rd: prof([[0, 6.0], [0.55, 5.2], [1, 4.5]]), rp: prof([[0, 8.5], [0.55, 9.0], [1, 7.6]]) }
  ] };
  const MEDIO = { desloca: [81.5, -1.2], sgn: 1, ponta: 7.2, segs: [
    { len: 45.5, rd: prof([[0, 9.4], [0.5, 7.6], [1, 7.4]]), rp: prof([[0, 15], [0.4, 10.6], [1, 9.8]]) },
    { len: 27.5, rd: prof([[0, 7.4], [1, 6.0]]), rp: prof([[0, 9.8], [0.5, 9.6], [1, 8.5]]) },
    { len: 19.5, rd: prof([[0, 6.0], [1, 4.5]]), rp: prof([[0, 8.5], [0.6, 9.0], [1, 7.6]]) }
  ] };
  const POLEGAR = { desloca: [20, 12], sgn: -1, ponta: 7.4, segs: [
    { len: 46 * 0.9, rd: prof([[0, 15], [0.5, 12.2], [1, 9.8]]), rp: prof([[0, 17], [0.5, 13], [1, 9.4]]) },
    { len: 31 * 0.9, rd: prof([[0, 9.8], [0.5, 9.0], [1, 8.6]]), rp: prof([[0, 9.4], [0.5, 9.6], [1, 8.6]]) },
    { len: 25 * 0.9, rd: prof([[0, 8.6], [0.6, 7.6], [1, 6.8]]), rp: prof([[0, 8.6], [0.6, 9.0], [1, 7.4]]) }
  ] };
  /* mão relaxada (a pose do motion): dedos levemente dobrados, polegar junto do indicador */
  const POSE = { mcf: 15, ifp: 30, ifd: 15, mMcf: 6, mIfp: 10, mIfd: 6, pA: 10, pMcf: 6, pIf: 10 };
  const gira = (p, a) => { const c = Math.cos(a), s = Math.sin(a); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]; };
  function cadeia (spec, base, a0, flex) {
    const J = [base], A = []; let a = a0;
    spec.segs.forEach((sg, k) => {
      if (k > 0) a += spec.sgn * (flex[k] || 0) * D2R;
      A.push(a);
      const p = J[k]; J.push([p[0] + Math.cos(a) * sg.len, p[1] + Math.sin(a) * sg.len]);
    });
    return { spec, J, A, flex };
  }
  const normal = (ch, k) => { const a = ch.A[k], g = ch.spec.sgn; return [-Math.sin(a) * g, Math.cos(a) * g]; };
  function lado (ch, k, s, N, u0 = 0, u1 = 1, recuo = 0) {
    const sg = ch.spec.segs[k], a = ch.A[k], c = Math.cos(a), si = Math.sin(a), n = normal(ch, k), f = s > 0 ? sg.rp : sg.rd, out = [];
    for (let i = 0; i <= N; i++) {
      const u = lerp(u0, u1, i / N), r = Math.max(0.2, f(u) - recuo);
      out.push([ch.J[k][0] + c * sg.len * u + n[0] * r * s, ch.J[k][1] + si * sg.len * u + n[1] * r * s]);
    }
    return out;
  }
  /* o lado de fora da curva ganha arco; o de dentro é cortado na interseção e vira prega */
  function contornoLado (ch, s, N = 24) {
    const n = ch.spec.segs.length, pedacos = [], pregas = [];
    for (let k = 0; k < n; k++) pedacos.push(lado(ch, k, s, N));
    for (let k = 1; k < n; k++) {
      const fl = (ch.flex[k] || 0) * s, ant = pedacos[k - 1], prox = pedacos[k];
      if (fl > 0.01) {
        let hit = null;
        for (let i = ant.length - 1; i > ant.length * 0.4 && !hit; i--) {
          for (let j = 1; j < prox.length * 0.6; j++) { const x = cruza(ant[i - 1], ant[i], prox[j - 1], prox[j]); if (x) { hit = { i, j, x }; break; } }
        }
        if (hit) { pedacos[k - 1] = ant.slice(0, hit.i).concat([hit.x]); pedacos[k] = [hit.x].concat(prox.slice(hit.j)); pregas.push({ k, p: hit.x }); }
        else pregas.push({ k, p: ant[ant.length - 1] });
      } else if (fl < -0.01) {
        const J = ch.J[k], r = (s > 0 ? ch.spec.segs[k - 1].rp : ch.spec.segs[k - 1].rd)(1);
        const n0 = normal(ch, k - 1), n1 = normal(ch, k);
        const a0 = Math.atan2(n0[1] * s, n0[0] * s), a1 = Math.atan2(n1[1] * s, n1[0] * s);
        let d = a1 - a0; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
        const passos = Math.max(2, Math.ceil(Math.abs(d) / (6 * D2R))), arco = [];
        for (let i = 1; i < passos; i++) { const a = a0 + d * i / passos; arco.push([J[0] + Math.cos(a) * r, J[1] + Math.sin(a) * r]); }
        pedacos[k - 1] = pedacos[k - 1].concat(arco);
        pregas.push({ k, p: pedacos[k][0] });
      } else pregas.push({ k, p: pedacos[k][0] });
    }
    return { pts: [].concat(...pedacos), pregas };
  }
  function ponta (ch, N = 16) {
    const n = ch.spec.segs.length, k = n - 1, J = ch.J[n], a = ch.A[k], u = [Math.cos(a), Math.sin(a)], nn = normal(ch, k);
    const rd = ch.spec.segs[k].rd(1), rp = ch.spec.segs[k].rp(1), f = ch.spec.ponta, out = [];
    for (let i = 1; i < N; i++) {
      const ph = -Math.PI / 2 + Math.PI * i / N, R = ph < 0 ? rd : rp;
      out.push([J[0] + u[0] * Math.cos(ph) * f + nn[0] * Math.sin(ph) * R, J[1] + u[1] * Math.cos(ph) * f + nn[1] * Math.sin(ph) * R]);
    }
    return out;
  }
  function contorno (ch) {
    const d = contornoLado(ch, -1), p = contornoLado(ch, +1);
    return { dorsal: d.pts, palmar: p.pts, ponta: ponta(ch), pregasP: p.pregas };
  }
  const f1 = v => String(Math.round(v * 10) / 10);
  const linha = (pts, fecha) => pts.map((p, i) => (i ? 'L' : 'M') + f1(p[0]) + ' ' + f1(p[1])).join('') + (fecha ? 'Z' : '');
  function unha (ch, k) {
    const sg = ch.spec.segs[k], J = ch.J[k], an = ch.A[k], c = Math.cos(an), s = Math.sin(an), n = normal(ch, k);
    const P = (u, off) => { const r = sg.rd(Math.min(1, u)), ex = Math.max(0, u - 1) * sg.len; return [J[0] + c * (sg.len * Math.min(1, u) + ex) - n[0] * (r - off), J[1] + s * (sg.len * Math.min(1, u) + ex) - n[1] * (r - off)]; };
    const dentro = [];
    for (let i = 0; i <= 10; i++) { const u = lerp(0.42, 1.03, i / 10); dentro.push(P(u, 0.95 - 0.35 * (i / 10) ** 2)); }
    return [linha(dentro.concat([P(1.07, -0.25)])), linha([P(0.33, 0), P(0.42, 0.95)])];
  }
  function detalhes (ch, ol) {
    const out = { forte: [], medio: [], fraco: [] };
    /* hachuras de sombra no dorso, paralelas ao eixo, de comprimento decrescente */
    const H = [[2, 0.16, 0.84, [1.3, 2.6, 3.9]], [3, 0.16, 0.84, [1.2, 2.4, 3.6]], [4, 0.1, 0.36, [1.1, 2.2]], [1, 0.5, 0.92, [1.6, 3.2]]];
    const nivel = ['medio', 'fraco', 'fraco'];
    H.forEach(([k, u0, u1, recuos]) => recuos.forEach((r, i) => {
      const sh = (u1 - u0) * 0.12 * i;
      out[nivel[i]].push(linha(lado(ch, k, -1, 12, u0 + sh, u1 - sh * 0.6, r)));
    }));
    /* pregas das juntas dos dedos (lado da palma) */
    ol.pregasP.forEach(cr => {
      if (cr.k < 3) return;
      const J = ch.J[cr.k], d = [J[0] - cr.p[0], J[1] - cr.p[1]], L = Math.hypot(d[0], d[1]) || 1, u = [d[0] / L, d[1] / L];
      const ax = [Math.cos(ch.A[cr.k]), Math.sin(ch.A[cr.k])];
      out.forte.push(linha([cr.p, [cr.p[0] + u[0] * L * 0.42, cr.p[1] + u[1] * L * 0.42]]));
      const q = [cr.p[0] + ax[0] * 1.6, cr.p[1] + ax[1] * 1.6];
      out.medio.push(linha([q, [q[0] + u[0] * L * 0.3, q[1] + u[1] * L * 0.3]]));
    });
    { const k = 2, u = 0.46, sg = ch.spec.segs[k], c = Math.cos(ch.A[k]), s = Math.sin(ch.A[k]), n = normal(ch, k), r = sg.rp(u);
      const p = [ch.J[k][0] + c * sg.len * u + n[0] * r, ch.J[k][1] + s * sg.len * u + n[1] * r];
      out.forte.push(linha([p, [p[0] - n[0] * r * 0.36, p[1] - n[1] * r * 0.36]])); }
    out.forte.push(...unha(ch, 4));
    return out;
  }
  function polegar (th, ancora, canto) {
    const ol = contorno(th), N = 24;
    /* do primeiro quinto do metacarpo para fora: a base sai da eminência tenar, logo depois do punho */
    const d = contornoLado(th, -1).pts.slice(Math.round(N * 0.22));
    const p = contornoLado(th, +1).pts.slice(Math.round(N * 0.2));
    /* com âncora (Fig. 3): o traço de baixo do polegar (o d, pelo sinal da cadeia) sai do contorno da palma,
       como a eminência tenar, sem degrau */
    const dt = ancora ? ancora.concat(d) : d;
    const det = [];
    [[1, 0.2, 0.8, [1.4, 2.8]], [2, 0.15, 0.45, [1.2, 2.3]], [0, 0.55, 0.92, [1.8, 3.6]]].forEach(([k, u0, u1, rr]) => rr.forEach(r => det.push(linha(lado(th, k, -1, 10, u0, u1, r)))));
    det.push(...unha(th, 2));
    /* o fundo cobre também a rampa da âncora, fechando por um canto logo abaixo da faixa do túnel */
    const fd = ancora && canto ? [canto].concat(dt) : d;
    return { fundo: linha(fd.concat(ol.ponta, p.slice().reverse()), true), traco: linha(dt.concat(ol.ponta)) + linha(p), det: det.join('') };
  }
  /* faixa do túnel: do lado da palma, entre x −7 e 25 mm; dobra com o punho (peso 0 no antebraço,
     1 na mão) e fica mais fina conforme o ângulo */
  const peso = x => suave(-16, 12, x);
  const dobra = (p, a) => gira(p, peso(p[0]) * a * D2R);
  function zona (a) {
    const g = Math.min(1, Math.abs(a) / 60), esp = 7.6 * (1 - 0.36 * g), y0 = 14.2, cima = [], baixo = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24, x = lerp(-7, 25, u), w = Math.pow(Math.sin(Math.PI * u), 0.55);
      cima.push(dobra([x, y0 - esp * w], a)); baixo.push(dobra([x, y0], a));
    }
    return linha(cima.concat(baixo.reverse()), true);
  }
  /* Fig. 3 (revisão final, 24/11): antebraço de 260 mm à mostra (com o esfuminho), para a mão (168 mm do
     punho à ponta) medir cerca de 0,65 do antebraço, como no corpo; o pivô fica na prega do punho.
     MAO_T é uma cópia só desta figura: o teste da mesa do Dupuytren continua usando o MAO. */
  const MAO_T = Object.assign({}, MAO, { base: [-300, 0], segs: [
    { len: 300, rd: prof([[0, 25], [0.45, 23.5], [0.85, 18], [1, 16.5]]), rp: prof([[0, 31], [0.45, 30], [0.85, 21.5], [1, 18.5]]) }
  ].concat(MAO.segs.slice(1)) });
  /* o polegar nasce na base da mão, logo depois da prega do punho (a eminência tenar) */
  const POLEGAR_T = Object.assign({}, POLEGAR, { desloca: [15, 11.5] });
  /* pregas do punho, do lado da palma, onde a mão dobra (duas, como a distal e a proximal) */
  function pregasPunho (a) {
    return [[-3.5, 0.62], [3, 0.92]].map(([x, f]) => {
      const r = 18.5 + 0.02 * x, p0 = dobra([x, r], a), p1 = dobra([x + 0.6, r - 4.2 * f], a);
      return linha([p0, p1]);
    }).join('');
  }
  function desenho (a) {
    const main = cadeia(MAO_T, MAO_T.base, 0, [0, a, POSE.mcf, POSE.ifp, POSE.ifd]);
    const W = main.J[1], ha = main.A[1];
    const mb = gira(MEDIO.desloca, ha), mid = cadeia(MEDIO, [W[0] + mb[0], W[1] + mb[1]], ha + (POSE.mcf + POSE.mMcf) * D2R, [0, POSE.ifp + POSE.mIfp, POSE.ifd + POSE.mIfd]);
    const tb = gira(POLEGAR_T.desloca, ha), th = cadeia(POLEGAR_T, [W[0] + tb[0], W[1] + tb[1]], ha + POSE.pA * D2R, [0, POSE.pMcf, POSE.pIf]);
    const mo = contorno(mid), ol = contorno(main), det = detalhes(main, ol);
    const naMao = q => { const g = gira(q, ha); return [W[0] + g[0], W[1] + g[1]]; };
    const pol = polegar(th, [naMao([9, 19.5])], naMao([26, 15.5]));
    det.medio.push(pregasPunho(a));
    return {
      medio: linha(mo.dorsal.concat(mo.ponta, mo.palmar.slice().reverse()), true),
      mao: linha(ol.dorsal.concat(ol.ponta, ol.palmar.slice().reverse()), true),
      zona: zona(a), fraco: det.fraco.join(''), medio2: det.medio.join(''), forte: det.forte.join(''),
      polegar: pol.fundo, poltraco: pol.traco, poldet: pol.det,
      /* braços do goniômetro: o fixo no antebraço e o móvel ao longo da mão (até a junta do indicador) */
      bracos: 'M-8 0H-140' + linha([[6 * Math.cos(ha), 6 * Math.sin(ha)], [84 * Math.cos(ha), 84 * Math.sin(ha)]])
    };
  }
  return { desenho };
})();

$$('[data-angulo]').forEach(fig => {
  const range = $('input[type="range"]', fig), svg = $('.cond-angulo__svg', fig);
  if (!range || !svg) return;
  const partes = {};
  $$('[data-parte]', svg).forEach(p => { (partes[p.dataset.parte] = partes[p.dataset.parte] || []).push(p); });
  const setor = $('.cond-angulo__setor', svg), hach = $('#caHach line', svg) && $('#caHach', svg);
  const titulo = $('title', svg), graus = $('.cond-angulo__graus', fig), estado = $('.cond-angulo__estado', fig);
  const faixas = $$('.cond-angulo__faixas > li', fig), status = $('[role="status"]', fig), zerar = $('.cond-angulo__zerar', fig);
  const gonioEl = $('.cond-angulo__gonio', fig);
  const R_SETOR = 62;
  const faixaDe = a => Math.abs(a) <= 10 ? 0 : Math.abs(a) <= 35 ? 1 : 2;
  const comoTexto = a => a === 0 ? 'Punho reto' : a > 0 ? `Dobrado ${Math.abs(a)} graus` : `Para trás ${Math.abs(a)} graus`;

  function desenhar (a) {
    const d = Perfil.desenho(a);
    Object.keys(partes).forEach(k => { if (d[k] != null) partes[k].forEach(p => p.setAttribute('d', d[k])); });
    if (setor) {
      if (Math.abs(a) < 0.5) setor.setAttribute('d', '');
      else {
        const t = a * Math.PI / 180, x = R_SETOR * Math.cos(t), y = R_SETOR * Math.sin(t);
        setor.setAttribute('d', `M0 0H${R_SETOR}A${R_SETOR} ${R_SETOR} 0 0 ${a > 0 ? 1 : 0} ${x.toFixed(1)} ${y.toFixed(1)}Z`);
      }
    }
    /* a hachura do túnel fica mais densa conforme o ângulo (passo de 3,4 a 1,9 mm) */
    if (hach) {
      const passo = (3.4 - 1.5 * Math.min(1, Math.abs(a) / 60)).toFixed(2);
      hach.setAttribute('width', passo); hach.setAttribute('height', passo);
      const ln = $('line', hach); if (ln) ln.setAttribute('y2', passo);
    }
    if (gonioEl && gonioEl.gonio) gonioEl.gonio.set(90 + a);
  }
  /* texto da leitura, do controle e das faixas: muda junto com o controle */
  function rotular (a) {
    if (graus) graus.textContent = String(Math.abs(a));
    if (estado) estado.textContent = a === 0 ? 'Punho reto' : a > 0 ? 'Dobrado' : 'Para trás';
    range.setAttribute('aria-valuetext', comoTexto(a));
    range.style.setProperty('--t', String((a + 60) / 120));
    if (titulo) titulo.textContent = a === 0 ? 'Mão de perfil com o punho reto' : `Mão de perfil com o punho ${a > 0 ? 'dobrado' : 'inclinado para trás'} ${Math.abs(a)} graus`;
    const f = faixaDe(a);
    faixas.forEach((li, i) => { if (i === f) li.setAttribute('aria-current', 'true'); else li.removeAttribute('aria-current'); });
    if (zerar) zerar.setAttribute('aria-disabled', String(a === 0));
  }
  /* o status (aria-live) é escrito ao soltar o controle, não a cada passo */
  function anunciar (a) {
    if (!status) return;
    const li = faixas[faixaDe(a)], limpa = el => el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
    const nome = li ? limpa($('.cond-angulo__faixa > span', li)) : '', desc = li ? limpa($('p:last-child', li)) : '';
    /* "Dobrado 40 graus, bem dobrado. Para baixo ou para cima…" (no punho reto, sem repetir o nome) */
    status.textContent = (a === 0 ? 'Punho reto' : `${comoTexto(a)}, ${nome.toLowerCase()}`) + '. ' + desc;
  }

  let atual = 0, anim = 0;
  function irPara (alvo) {
    cancelAnimationFrame(anim);
    if (parado()) { atual = alvo; desenhar(atual); return; }
    const de = atual, t0 = performance.now(), dur = 220;
    const passo = t => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      atual = de + (alvo - de) * e;
      desenhar(atual);
      if (k < 1) anim = requestAnimationFrame(passo);
    };
    anim = requestAnimationFrame(passo);
  }
  const valor = () => Math.max(-60, Math.min(60, Math.round((+range.value || 0) / 5) * 5));
  range.addEventListener('input', () => { const a = valor(); rotular(a); irPara(a); });
  range.addEventListener('change', () => anunciar(valor()));
  if (zerar) zerar.addEventListener('click', () => {
    if (valor() === 0) return;
    range.value = '0'; rotular(0); irPara(0); anunciar(0);
  });
  fig.classList.add('cond-angulo--pronto');
  /* começa no punho reto (a escolha da pessoa não fica guardada) */
  range.value = '0'; atual = 0; rotular(0); desenhar(0);
});

/* ---------- 3. Vídeo (Fig. 2) ---------- */
$$('[data-video]').forEach(fig => {
  const video = $('video', fig), btn = $('.cond-video__ctrl', fig);
  if (!video) return;
  let visivel = false, pausadoPelaPessoa = false, pedido = false;
  const rotulo = tocando => { if (!btn) return; btn.textContent = tocando ? 'Pausar a animação' : 'Tocar a animação'; btn.dataset.estado = tocando ? 'tocando' : 'parado'; };
  const tocar = () => { const p = video.play(); if (p && p.catch) p.catch(() => rotulo(false)); };
  function sincronizar () {
    /* toca sozinho só com movimento liberado; com movimento reduzido ou pausado, só se a pessoa pedir */
    const pode = visivel && !pausadoPelaPessoa && (!parado() || pedido);
    if (pode) tocar();
    else if (!video.paused) {
      video.pause();
      /* saiu da tela logo no começo: load() devolve o pôster de verdade (o laço começa e termina no quadro do
         pôster, mas assim não depende do arquivo), sem parar num quadro de transição */
      /* o load() descarta o evento pause ainda na fila: o rótulo do botão é posto à mão */
      if (!visivel && video.currentTime < 0.6) { try { video.load(); } catch (e) { /* sem fonte ainda */ } rotulo(false); }
    }
  }
  video.addEventListener('play', () => rotulo(true));
  video.addEventListener('pause', () => rotulo(false));
  if (btn) {
    btn.hidden = false;
    rotulo(false);
    btn.addEventListener('click', () => {
      if (video.paused) { pausadoPelaPessoa = false; pedido = true; visivel = true; tocar(); }
      else { pausadoPelaPessoa = true; pedido = false; video.pause(); }
    });
  }
  document.addEventListener('motionchange', () => { if (parado()) pedido = false; sincronizar(); });
  RM.addEventListener && RM.addEventListener('change', sincronizar);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => { visivel = e.isIntersecting; sincronizar(); }, { threshold: .4 }).observe(video);
  }
});

/* ---------- 4. Copiar as perguntas para a consulta ---------- */
$$('[data-copiar]').forEach(btn => {
  const lista = $(btn.dataset.copiar);
  const status = document.getElementById('copiarStatus') || (btn.closest('section') && $('[role="status"]', btn.closest('section')));
  if (!lista) return;
  const rotulo = btn.textContent;
  let timer = 0;
  const tema = lista.dataset.condicao ? ` (${lista.dataset.condicao})` : '';
  const texto = () => `Perguntas para a consulta com o Dr. Pedro Sarzi${tema}:\n` +
    $$(':scope > li', lista).map((li, i) => `${i + 1}. ${li.textContent.replace(/\s+/g, ' ').trim()}`).join('\n');
  function reserva (t) {
    const ta = document.createElement('textarea');
    ta.value = t; ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
    document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  }
  function avisar (ok) {
    if (status) {
      status.textContent = '';
      setTimeout(() => {
        status.textContent = ok ? 'Perguntas copiadas. Cole no bloco de notas do celular e leve à consulta.' :'Não foi possível copiar aqui. Selecione a lista e copie.';
      }, 60);
    }
    if (ok) { btn.textContent = 'Perguntas copiadas'; clearTimeout(timer); timer = setTimeout(() => { btn.textContent = rotulo; }, 2600); }
  }
  btn.addEventListener('click', () => {
    const t = texto();
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(() => avisar(true), () => avisar(reserva(t)));
    else avisar(reserva(t));
  });
});

/* ---------- 5. Momento-assinatura de cada condição ----------
   Um por página, na figura de abas: data-assinatura="<nome>" no [data-figura-abas], com
   data-mov="assinatura" para o assets/movimento.js baixar o GSAP (docs/site.md, "Movimento (GSAP)").
   - gatilho      o dedo dobra, trava e solta (abertura) e segue o arrasto, com trava no grau II
   - bainha       o anel corre pelo polegar até a região e aperta (De Quervain)
   - trocas       os pictogramas se desenham a cada troca (rizartrose)
   - vira         a mão vira entre dorso e palma e o cisto incha no lugar
   - mesa         a mão desce até a mesa; no "não encosta", o ângulo abre (Dupuytren)
   - queda        a linha-guia corre até a região e um anel marca o ponto (fraturas)
   - marcos       a régua corre de um marco ao outro e o desenho do marco se faz (lesões de tendão)
   - formigamento a hachura sobe do punho até a ponta dos dedos (túnel cubital)
   - lupas        as lupas saem do cotovelo (epicondilite)
   Abertura uma vez, ao entrar na tela (se a página abriu com a figura à vista ou acima, nada toca);
   depois, cada troca de aba da pessoa anima a partir do estado anterior. Sem GSAP, com movimento
   reduzido ou "Pausar animações", as abas trocam como antes. O arrasto do dedo vale sempre (quem move é a
   pessoa). Só transform, opacity, traço e clip-path: nada mexe no layout; nada de pin nem trava de rolagem. */
const Mov = { gsap: null, ST: null };
const rodando = new Set();
const fator = () => (window.PSMov && PSMov.tokens.fator[PSMov.faixa]) || 1;
const TK = () => (window.PSMov && PSMov.tokens) || { dur: { curta: .6, media: .9, longa: 1.2 }, troca: .24, ease: 'power2.out', escalonar: .08 };
const anima = () => !!Mov.gsap && !parado();
const NUM = /-?\d*\.?\d+(?:e-?\d+)?/g;

/* interpolação dos data-transforma entre dois estados (mesmo molde, só os números mudam) */
function transformas (raiz) {
  return $$('[data-transforma]', raiz).map(el => {
    let mapa = {};
    try { mapa = JSON.parse(el.dataset.transforma); } catch (e) { mapa = {}; }
    return { el, mapa };
  });
}
function misturar (a, b, t) {
  a = a || ''; b = b || '';
  if (t <= 0) return a;
  if (t >= 1) return b;
  const na = a.match(NUM) || [], nb = b.match(NUM) || [];
  if (a.replace(NUM, '#') !== b.replace(NUM, '#') || na.length !== nb.length) return t < .5 ? a : b;
  let i = 0;
  return a.replace(NUM, () => { const v = +na[i] + (+nb[i] - +na[i]) * t; i++; return String(Math.round(v * 1000) / 1000); });
}
const aplicarEntre = (lista, de, para, t) => lista.forEach(({ el, mapa }) => { el.style.transform = misturar(mapa[de], mapa[para], t); });
const mostrar = (fig, v, filtro) => $$('[data-mostra]', fig).forEach(el => {
  if (!filtro || filtro(el)) el.classList.toggle('on', el.dataset.mostra.split(/\s+/).includes(v));
});
const doEstado = (raiz, v) => $$('[data-mostra]', raiz).filter(el => el.dataset.mostra.split(/\s+/).includes(v));

/* o que dá para desenhar em traço: com contorno, sem tracejado, fora de estados apagados */
function tracos (raizes) {
  const out = [];
  [].concat(raizes).forEach(r => {
    if (!r) return;
    const els = r.matches && r.matches('path,line,polyline,rect,circle,ellipse,use') ? [r] : [];
    els.concat($$('path,line,polyline,rect,circle,ellipse,use', r)).forEach(el => {
      if (out.includes(el) || el.getAttribute('vector-effect')) return;
      if (el.tagName.toLowerCase() === 'use') {
        const alvo = document.getElementById((el.getAttribute('href') || '').slice(1));
        if (!alvo || alvo.tagName.toLowerCase() !== 'path') return;
      }
      const cs = getComputedStyle(el);
      if (cs.stroke === 'none' || cs.strokeDasharray !== 'none' || el.getAttribute('fill') === 'transparent') return;
      out.push(el);
    });
  });
  return out;
}
const centro = el => { try { const b = el.getBBox(); return [b.x + b.width / 2, b.y + b.height / 2, Math.max(b.width, b.height) / 2]; } catch (e) { return [0, 0, 0]; } };
/* traço e respiro pelos helpers da camada (PSMov); devolvem uma linha do tempo vazia se não houver nada */
const desenho = (els, o) => els.length ? PSMov.desenhar(els, o) : Mov.gsap.timeline();
const respiro = (els, o) => els.length ? PSMov.hachura(els, o) : Mov.gsap.timeline();
function tocar (tl) {
  rodando.add(tl);
  tl.eventCallback('onComplete', () => rodando.delete(tl));
  if (parado()) tl.progress(1);
  return tl;
}

/* abertura: uma vez, quando a arte entra na tela */
function abertura (fig, criar) {
  if (fig.dataset.assinaturaVista) return null;
  const arte = $('.cond-fig__arte', fig) || fig;
  if (arte.getBoundingClientRect().top < innerHeight * .85) { fig.dataset.assinaturaVista = '1'; return null; }
  const tl = Mov.gsap.timeline({ paused: true });
  criar(tl);
  const st = Mov.ST.create({ trigger: arte, start: 'top 72%', once: true, onEnter: () => {
    fig.dataset.assinaturaVista = '1';
    tocar(tl); tl.play();
  } });
  const ab = { tl, st, terminar () { if (tl.progress() < 1) tl.progress(1); st.kill(); fig.dataset.assinaturaVista = '1'; } };
  fig.assinaturaAbertura = ab;
  return ab;
}
/* a troca da pessoa encerra a abertura que ainda não tocou ou está tocando */
const encerrarAbertura = fig => { if (fig.assinaturaAbertura) { fig.assinaturaAbertura.terminar(); fig.assinaturaAbertura = null; } };

const Assinaturas = {};

/* --- Dedo em gatilho: o dedo de perfil segue um parâmetro contínuo p (0 = grau I ... 3 = grau IV).
   O goniômetro lê o ângulo da junta do meio ao vivo; no grau II o dedo trava e solta com o estalo. --- */
Assinaturas.gatilho = { base (fig) {
  const svg = $('.cond-fig__arte svg', fig), vals = fig.figuraValores;
  if (!svg || !vals || vals.length < 2) return null;
  const lista = transformas(fig);
  const pip = lista.find(o => /-90/.test(o.mapa[vals[vals.length - 1]] || '')) || lista[0];
  const vivo = $('.dg-vivo', svg), setor = $('.dg-setor', svg), estalo = $('.dg-estalo', svg);
  const ultimo = vals.length - 1;
  let p = Math.max(0, vals.indexOf(fig.dataset.estado)), tw = null;
  function aplicar (q) {
    p = Math.max(0, Math.min(ultimo, q));
    const i = Math.min(ultimo - 1, Math.floor(p)), t = p - i;
    aplicarEntre(lista, vals[i], vals[i + 1], t);
    const m = misturar(pip.mapa[vals[i]], pip.mapa[vals[i + 1]], t).match(NUM);
    const ang = Math.abs(m ? +m[0] : 0);
    if (vivo) vivo.textContent = Math.round(ang) + '°';
    if (setor) {
      const r = ang * Math.PI / 180;
      setor.setAttribute('d', ang < .5 ? '' : `M270 250H373A103 103 0 0 0 ${(270 + 103 * Math.cos(r)).toFixed(1)} ${(250 - 103 * Math.sin(r)).toFixed(1)}Z`);
    }
    mostrar(fig, vals[Math.round(p)], el => !el.closest('.dg-leitura'));
  }
  function fim () {
    tw = null;
    p = Math.max(0, vals.indexOf(fig.dataset.estado));
    aplicarEntre(lista, vals[p], vals[p], 1);
    mostrar(fig, vals[p]);
    if (setor) setor.setAttribute('d', '');
    fig.classList.remove('dg--vivo');
  }
  function irPara (alvo, dur) {
    if (tw) { tw.kill(); tw = null; }
    if (!anima()) { fim(); return; }
    fig.classList.add('dg--vivo');
    const o = { p };
    tw = Mov.gsap.to(o, { p: alvo, duration: dur || Math.min(1.2, .45 + .2 * Math.abs(alvo - p)) * fator(), ease: TK().ease,
      onUpdate: () => aplicar(o.p), onComplete: fim });
  }
  function solta () {
    if (!anima() || !estalo) return;
    Mov.gsap.timeline()
      .fromTo(estalo, { opacity: 0, scale: .82, svgOrigin: '188 214' }, { opacity: 1, scale: 1, svgOrigin: '188 214', duration: .12, ease: 'power2.out' })
      .to(estalo, { opacity: 0, duration: .6, ease: 'power1.in', clearProps: 'transform' }, '+=.18');
  }
  /* arrasto: para a esquerda (e, com o mouse, para cima) dobra; no toque, só o lado (a rolagem segue livre) */
  let arr = null, preso = 0;
  function comTrava (raw) {
    if (preso === 1) {
      if (raw >= 1.45) { preso = 0; solta(); return raw; }
      if (raw < .8) { preso = 0; return raw; }
      return .9 + Math.max(0, raw - .9) * .12;
    }
    if (preso === -1) {
      if (raw <= .55) { preso = 0; solta(); return raw; }
      if (raw > 1.2) { preso = 0; return raw; }
      return 1.1 - Math.max(0, 1.1 - raw) * .12;
    }
    if (p < .9 && raw >= .9 && raw < 1.45) { preso = 1; return .9; }
    if (p > 1.1 && raw <= 1.1 && raw > .55) { preso = -1; return 1.1; }
    return raw;
  }
  svg.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    arr = { x: e.clientX, y: e.clientY, p0: p, id: e.pointerId, moveu: false, w: svg.getBoundingClientRect().width || 300, mouse: e.pointerType === 'mouse' };
  });
  svg.addEventListener('pointermove', e => {
    if (!arr || e.pointerId !== arr.id) return;
    const dx = arr.x - e.clientX, dy = arr.mouse ? arr.y - e.clientY : 0;
    if (!arr.moveu) {
      if (Math.abs(dx) + Math.abs(dy) < 6) return;
      arr.moveu = true;
      encerrarAbertura(fig);
      if (tw) { tw.kill(); tw = null; }
      arr.p0 = p;
      try { svg.setPointerCapture(e.pointerId); } catch (_) { /* sem captura */ }
      fig.classList.add('cond-fig--arrasto', 'dg--vivo');
    }
    e.preventDefault();
    aplicar(comTrava(Math.max(0, Math.min(ultimo, arr.p0 + (dx + dy) / (arr.w * .16)))));
  });
  const soltar = e => {
    if (!arr || e.pointerId !== arr.id) return;
    const moveu = arr.moveu;
    arr = null; preso = 0;
    if (!moveu) return;
    fig.classList.remove('cond-fig--arrasto');
    const alvo = Math.round(p);
    if (vals[alvo] === fig.dataset.estado) irPara(alvo, .3);
    else fig.figuraEscolher(alvo);
  };
  svg.addEventListener('pointerup', soltar);
  svg.addEventListener('pointercancel', soltar);
  /* clique nas abas (e o fim do arrasto): o dedo vai do ângulo atual até o grau escolhido */
  fig.addEventListener('figura:estado', e => {
    if (!e.detail.pessoa) return;
    encerrarAbertura(fig);
    const de = p;
    if (anima()) aplicar(de);
    irPara(e.detail.indice);
  });
  return {
    abertura () {
      if (fig.dataset.estado !== vals[0]) return;
      abertura(fig, tl => {
        const o = { p: 0 }, k = fator(), up = () => aplicar(o.p);
        tl.add(() => fig.classList.add('dg--vivo'))
          .to(o, { p: .9, duration: TK().dur.media * k, ease: TK().ease, onUpdate: up })
          .to(o, { p: .97, duration: .42, ease: 'sine.inOut', onUpdate: up })
          .add(solta)
          .to(o, { p: 2, duration: .2, ease: 'power3.out', onUpdate: up })
          .to(o, { p: 2, duration: .5 })
          .to(o, { p: 1.1, duration: TK().dur.media * k, ease: 'power2.inOut', onUpdate: up })
          .to(o, { p: 1.03, duration: .38, ease: 'sine.inOut', onUpdate: up })
          .add(solta)
          .to(o, { p: 0, duration: .22, ease: 'power3.out', onUpdate: up })
          .add(fim);
      });
    }
  };
} };

/* --- De Quervain: o anel corre pelo polegar até a região escolhida e aperta, como a bainha --- */
Assinaturas.bainha = { gsap (fig) {
  const svg = $('.cond-fig__arte svg', fig), anel = svg && $('.dq-anel', svg);
  if (!anel) return null;
  const C = {};
  $$('.dq-fixo', svg).forEach(c => { const g = c.closest('[data-mostra]'); C[g.dataset.mostra] = [+c.getAttribute('cx'), +c.getAttribute('cy'), +c.getAttribute('r')]; });
  const zona = v => $(`[data-mostra="${v}"] use`, svg);
  const por = v => C[v] || Object.values(C)[0];
  const pos = (x, y, r) => { anel.setAttribute('cx', x.toFixed(2)); anel.setAttribute('cy', y.toFixed(2)); anel.setAttribute('r', Math.max(1, r).toFixed(2)); };
  pos(...por(fig.dataset.estado));
  const aperta = (tl, v, de, at) => {
    const [x, y, r] = por(v), o = { r: de };
    tl.to(o, { r, duration: TK().dur.media * fator(), ease: TK().ease, onUpdate: () => pos(x, y, o.r) }, at)
      .fromTo(anel, { strokeWidth: 1.8 }, { strokeWidth: .9, duration: TK().dur.media * fator(), ease: TK().ease }, '<')
      .add(respiro([zona(v)].filter(Boolean)), '<');
    return tl;
  };
  fig.addEventListener('figura:estado', e => {
    if (!e.detail.pessoa || !anima()) { pos(...por(e.detail.valor)); return; }
    encerrarAbertura(fig);
    const [x0, y0, r0] = por(e.detail.anterior), [x1, y1, r1] = por(e.detail.valor);
    /* curva por fora do polegar (para o lado de fora da mão) */
    const cx = (x0 + x1) / 2 - 34, cy = (y0 + y1) / 2 + 6, o = { t: 0 };
    const tl = Mov.gsap.timeline();
    tl.to(o, { t: 1, duration: .7 * fator(), ease: 'power2.inOut', onUpdate: () => {
      const t = o.t, u = 1 - t;
      pos(u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1, r0 + (r1 + 12 - r0) * t);
    } });
    aperta(tl, e.detail.valor, r1 + 12, '>-.05');
    tocar(tl);
  });
  return { restaurar: () => pos(...por(fig.dataset.estado)), abertura () {
    abertura(fig, tl => {
      const v = fig.dataset.estado, r = por(v)[2];
      tl.add(desenho($$('.cp-mao', svg), { duracao: TK().dur.longa * fator() }), .1)
        .fromTo(anel, { opacity: 0 }, { opacity: 1, duration: .4, immediateRender: true }, .75);
      aperta(tl, v, r + 22, .75);
    });
  } };
} };

/* --- Rizartrose: as seis cenas se desenham a cada troca, uma depois da outra --- */
Assinaturas.trocas = { gsap (fig) {
  const svg = $('.cond-fig__arte svg', fig);
  const raiz = svg && $('g[fill="none"]', svg);
  if (!raiz) return null;
  const celulas = Array.from(raiz.children).filter(g => g.tagName.toLowerCase() === 'g');
  const filetes = Array.from(raiz.children).filter(el => el.tagName.toLowerCase() === 'path');
  const doCenario = (c, v) => {
    const proprios = doEstado(c, v);
    return { tr: tracos(proprios), zonas: proprios.flatMap(g => $$('.cp-zona', g)) };
  };
  const cenas = (tl, v, at, base) => celulas.forEach((c, i) => {
    const fixos = base ? tracos($$(':scope > :not([data-mostra])', c)) : [];
    const { tr, zonas } = doCenario(c, v);
    const t0 = at + i * TK().escalonar * 1.5;
    tl.add(desenho(fixos.concat(tr), { duracao: TK().dur.curta * fator(), escalonar: .025 }), t0);
    if (zonas.length) tl.add(respiro(zonas), t0 + .35);
  });
  fig.addEventListener('figura:estado', e => {
    if (!e.detail.pessoa || !anima()) return;
    encerrarAbertura(fig);
    const tl = Mov.gsap.timeline();
    cenas(tl, e.detail.valor, 0, false);
    tocar(tl);
  });
  return { abertura () {
    abertura(fig, tl => {
      tl.add(desenho(filetes, { duracao: TK().dur.media * fator() }), 0);
      cenas(tl, fig.dataset.estado, .25, true);
    });
  } };
} };

/* --- Cisto sinovial: a mão vira como uma ficha (passa de lado) e o cisto incha no lugar --- */
Assinaturas.vira = { gsap (fig) {
  const svg = $('.cond-fig__arte svg', fig);
  const lista = transformas(fig);
  const mao = lista.filter(o => !o.el.hasAttribute('data-aba')), marcas = lista.filter(o => o.el.hasAttribute('data-aba'));
  if (!svg || !mao.length) return null;
  const guia = v => $$(`[data-aba="${v}"] .cp-lupa__guia`, svg);
  const zona = v => $$(`[data-aba="${v}"] .cp-zona`, svg);
  const incha = (tl, v, at) => tl
    .add(respiro(zona(v), { duracao: TK().dur.curta * fator() }), at)
    .add(desenho(guia(v), { duracao: TK().dur.curta * fator() }), at + .2);
  fig.addEventListener('figura:estado', e => {
    if (!e.detail.pessoa || !anima()) return;
    encerrarAbertura(fig);
    const { anterior: de, valor: para } = e.detail, a = { t: 0 }, b = { t: 0 };
    const vira = (mao[0].mapa[de] || '') !== (mao[0].mapa[para] || '');
    const tl = Mov.gsap.timeline();
    aplicarEntre(lista, de, para, 0);
    tl.to(a, { t: 1, duration: (vira ? TK().dur.media : .3) * fator(), ease: 'power2.inOut', onUpdate: () => aplicarEntre(mao, de, para, a.t) }, 0)
      .to(b, { t: 1, duration: TK().dur.curta * fator(), ease: TK().ease, onUpdate: () => aplicarEntre(marcas, de, para, b.t) }, vira ? .45 * fator() : 0);
    incha(tl, para, (vira ? .5 : .1) * fator());
    tocar(tl);
  });
  return { abertura () {
    abertura(fig, tl => {
      const v = fig.dataset.estado, b = { t: 0 }, alvo = marcas.filter(o => /scale\(1\)/.test(o.mapa[v] || ''));
      tl.add(desenho($$('.cp-mao', svg), { duracao: TK().dur.longa * fator() }), .1)
        .fromTo(alvo.map(o => o.el), { opacity: 0 }, { opacity: 1, duration: .05, immediateRender: true, clearProps: 'opacity' }, .9)
        .fromTo(b, { t: 0 }, { t: 1, duration: TK().dur.curta * fator(), ease: TK().ease, immediateRender: false,
          onUpdate: () => alvo.forEach(o => { o.el.style.transform = `scale(${b.t})`; }) }, .9);
      incha(tl, v, 1);
    });
  } };
} };

/* --- Dupuytren: a mão desce até a mesa; no "não encosta", o ângulo abre e conta até 30° --- */
Assinaturas.mesa = { gsap (fig) {
  const svg = $('.cond-fig__arte svg', fig);
  if (!svg || !$('.mm-mao', svg)) return null;
  const desce = (tl, v, at) => {
    const g = $(`[data-mostra="${v}"]:not(.cond-fig__rotulo-apagado) .mm-mao`, svg);
    if (!g) return tl;
    const k = fator(), grau = $$('.mm-grau', g), num = $('.mm-num', g);
    tl.fromTo(g, { y: -16 }, { y: 0, duration: TK().dur.media * k, ease: TK().ease, clearProps: 'transform', immediateRender: true }, at);
    if (grau.length) {
      const eixo = $('.cond-angulo__eixo', g), t = (eixo && eixo.getAttribute('transform') || '').match(NUM) || [0, 0];
      tl.fromTo(grau, { opacity: 0, scale: .2, svgOrigin: `${t[0]} ${t[1]}` },
        { opacity: 1, scale: 1, svgOrigin: `${t[0]} ${t[1]}`, duration: TK().dur.curta * k, ease: TK().ease, clearProps: 'transform', immediateRender: true }, at + .55 * k);
    }
    if (num) {
      const fim = num.textContent, alvo = parseFloat(fim) || 0, o = { n: 0 };
      tl.fromTo(num, { opacity: 0 }, { opacity: 1, duration: .3, immediateRender: true }, at + .55 * k);
      if (alvo) tl.fromTo(o, { n: 0 }, { n: alvo, duration: TK().dur.curta * k, ease: TK().ease, immediateRender: true,
        onUpdate: () => { num.textContent = Math.round(o.n) + '°'; }, onComplete: () => { num.textContent = fim; } }, at + .55 * k);
    }
    return tl;
  };
  fig.addEventListener('figura:estado', e => {
    if (!e.detail.pessoa || !anima()) return;
    encerrarAbertura(fig);
    tocar(desce(Mov.gsap.timeline(), e.detail.valor, 0));
  });
  return { abertura () { abertura(fig, tl => desce(tl, fig.dataset.estado, .1)); } };
} };

/* --- Fraturas: a linha-guia corre do nome até a região, a região acende e um anel marca o ponto --- */
Assinaturas.queda = { gsap (fig) {
  const svg = $('.cond-fig__arte svg', fig);
  if (!svg) return null;
  const NS = 'http://www.w3.org/2000/svg';
  const aneis = [];
  const anel = i => {
    if (!aneis[i]) {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('class', 'fr-impacto'); c.setAttribute('r', '1'); c.style.opacity = '0';
      svg.appendChild(c); aneis[i] = c;
    }
    return aneis[i];
  };
  const marca = (tl, v, at) => {
    const guia = $(`.fr-guias [data-mostra="${v}"]`, svg), regiao = $(`g[data-mostra="${v}"][data-aba]`, svg);
    const k = fator();
    if (guia) tl.add(desenho([guia], { duracao: TK().dur.curta * k }), at);
    if (regiao) {
      tl.add(respiro($$('use', regiao), { duracao: TK().dur.curta * k }), at + .4 * k);
      /* um anel por região: o anel de marca de cada uma; sem ele (mão), a última zona */
      const pontos = $$('.cp-lupa__marca', regiao);
      (pontos.length ? pontos : $$('use', regiao).slice(-1)).forEach((el, i) => {
        const [x, y, r0] = el.tagName.toLowerCase() === 'circle' ? [+el.getAttribute('cx'), +el.getAttribute('cy'), +el.getAttribute('r')] : centro(el);
        const c = anel(i), o = { r: r0 };
        tl.fromTo(o, { r: r0 }, { r: r0 * 1.8, duration: TK().dur.media * k, ease: 'power2.out', immediateRender: false,
          onStart: () => { c.setAttribute('cx', x); c.setAttribute('cy', y); },
          onUpdate: () => c.setAttribute('r', o.r.toFixed(2)) }, at + .45 * k + i * TK().escalonar)
          .fromTo(c, { opacity: .75 }, { opacity: 0, duration: TK().dur.media * k, ease: 'power1.in', immediateRender: false }, '<');
      });
    }
    return tl;
  };
  fig.addEventListener('figura:estado', e => {
    if (!e.detail.pessoa || !anima()) return;
    encerrarAbertura(fig);
    tocar(marca(Mov.gsap.timeline(), e.detail.valor, 0));
  });
  return { abertura () {
    abertura(fig, tl => {
      tl.add(desenho($$('.cp-mao', svg), { duracao: TK().dur.longa * fator() }), .1);
      marca(tl, fig.dataset.estado, .9 * fator());
    });
  } };
} };

/* --- Lesões de tendão: a régua corre de um marco ao outro, o marco acende e o desenho dele se faz --- */
Assinaturas.marcos = { gsap (fig) {
  const svg = $('.cond-fig__arte svg', fig), vals = fig.figuraValores;
  if (!svg || !vals) return null;
  const trechos = $$(':scope > path[data-mostra]', svg);   /* trecho 1→2 ("ii iii") e 2→3 ("iii") */
  const arte = v => $$(':scope > g[data-mostra]', svg).filter(g => g.dataset.mostra === v);
  const medalha = v => $(`[data-aba="${v}"] circle[data-mostra]`, svg);
  const marco = (tl, de, para, at) => {
    const k = fator(), a = Math.max(0, vals.indexOf(de)), b = vals.indexOf(para);
    let t = at;
    for (let i = a; i < b; i++) {
      const tr = trechos.find(p => p.dataset.mostra.split(/\s+/)[0] === vals[i + 1]);
      if (tr) { tl.add(desenho([tr], { duracao: .5 * k, ease: 'none' }), t); t += .5 * k; }
    }
    const m = medalha(para);
    if (m) {
      const [x, y] = [m.getAttribute('cx'), m.getAttribute('cy')];
      tl.fromTo(m, { scale: .55, svgOrigin: `${x} ${y}` }, { scale: 1, svgOrigin: `${x} ${y}`, duration: TK().dur.curta * k, ease: TK().ease, clearProps: 'transform', immediateRender: false }, t);
    }
    const g = arte(para), lupas = g.flatMap(x => $$('use', x));
    tl.add(desenho(tracos(g), { duracao: TK().dur.media * k, escalonar: .06 }), t + .1);
    lupas.forEach(u => {
      const [x, y] = centro(u);
      tl.fromTo(u, { opacity: 0, scale: .9, svgOrigin: `${x} ${y}` }, { opacity: 1, scale: 1, svgOrigin: `${x} ${y}`, duration: TK().dur.curta * k, ease: TK().ease, clearProps: 'transform', immediateRender: false }, t + .15);
    });
    return tl;
  };
  fig.addEventListener('figura:estado', e => {
    if (!e.detail.pessoa || !anima()) return;
    encerrarAbertura(fig);
    tocar(marco(Mov.gsap.timeline(), e.detail.anterior, e.detail.valor, 0));
  });
  return { abertura () {
    abertura(fig, tl => {
      tl.add(desenho($$('.cp-mao', svg), { duracao: TK().dur.longa * fator() }), .1);
      marco(tl, vals[0], fig.dataset.estado, .8 * fator());
    });
  } };
} };

/* --- Túnel cubital: a hachura do nervo escolhido sobe do punho até a ponta dos dedos --- */
Assinaturas.formigamento = { gsap (fig) {
  const svg = $('.cond-fig__arte svg', fig);
  if (!svg) return null;
  const sobe = (tl, v, at) => {
    const zonas = $$(`.cp-zona[data-mostra~="${v}"]`, svg);
    if (zonas.length) tl.fromTo(zonas, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: TK().dur.longa * fator(),
      ease: 'power2.out', stagger: .1, clearProps: 'clipPath', immediateRender: true }, at);
    return tl;
  };
  fig.addEventListener('figura:estado', e => {
    if (!e.detail.pessoa || !anima()) return;
    encerrarAbertura(fig);
    tocar(sobe(Mov.gsap.timeline(), e.detail.valor, 0));
  });
  return { abertura () {
    abertura(fig, tl => {
      tl.add(desenho($$('.cp-mao', svg), { duracao: TK().dur.longa * fator(), escalonar: .12 }), .1);
      sobe(tl, fig.dataset.estado, .8 * fator());
    });
  } };
} };

/* --- Epicondilite: as duas lupas saem do cotovelo; a do lado escolhido se aproxima --- */
Assinaturas.lupas = { gsap (fig) {
  const svg = $('.cond-fig__arte svg', fig);
  if (!svg) return null;
  const lupas = $$('g[data-aba] > use', svg);
  const zonaDe = u => { const e = $('ellipse', u.parentNode); return e ? `${e.getAttribute('cx')} ${e.getAttribute('cy')}` : '0 0'; };
  const foco = (tl, v, at) => {
    const u = $(`g[data-aba="${v}"] > use`, svg), z = $(`use[data-mostra="${v}"]`, svg);
    if (u) { const [x, y] = centro(u); tl.fromTo(u, { scale: .93, svgOrigin: `${x} ${y}` }, { scale: 1, svgOrigin: `${x} ${y}`, duration: TK().dur.curta * fator(), ease: TK().ease, clearProps: 'transform', immediateRender: false }, at); }
    if (z) tl.add(respiro([z]), at + .1);
    return tl;
  };
  fig.addEventListener('figura:estado', e => {
    if (!e.detail.pessoa || !anima()) return;
    encerrarAbertura(fig);
    tocar(foco(Mov.gsap.timeline(), e.detail.valor, 0));
  });
  return { abertura () {
    abertura(fig, tl => {
      const k = fator();
      tl.add(desenho($$('.cp-braco', svg), { duracao: TK().dur.longa * k }), .1);
      /* o grupo inteiro da lupa (com o véu do lado apagado) sai da região do cotovelo */
      lupas.forEach((u, i) => tl.fromTo(u.parentNode, { opacity: 0, scale: .18, svgOrigin: zonaDe(u) }, { opacity: 1, scale: 1, svgOrigin: zonaDe(u),
        duration: TK().dur.media * k, ease: TK().ease, clearProps: 'transform,opacity', immediateRender: true }, .9 * k + i * .14));
      foco(tl, fig.dataset.estado, (.9 + TK().dur.media) * k + .1);
    });
  } };
} };

/* montagem: a parte sem GSAP (arrasto do dedo) já; a animada quando a camada de movimento estiver pronta */
const comAssinatura = $$('[data-assinatura]').map(fig => {
  const def = Assinaturas[fig.dataset.assinatura];
  return def ? { fig, def, base: def.base ? def.base(fig) : null } : null;
}).filter(Boolean);
if (comAssinatura.length) {
  document.addEventListener('motionchange', () => { if (parado()) rodando.forEach(tl => tl.progress(1)); });
  document.addEventListener('DOMContentLoaded', () => {
    if (!window.PSMov) return;
    PSMov.pronto.then(r => {
      if (!r) return;
      Mov.gsap = r.gsap; Mov.ST = r.ScrollTrigger;
      const ganchos = comAssinatura.map(a => {
        const g = a.def.gsap ? a.def.gsap(a.fig) : a.base;
        return g ? { fig: a.fig, g } : null;
      }).filter(Boolean);
      /* aberturas só com movimento liberado; mudou de faixa, o GSAP desfaz e a que não tocou volta a esperar */
      r.mm.add('(prefers-reduced-motion: no-preference)', () => {
        ganchos.forEach(({ fig, g }) => { fig.classList.add('cond-fig--mov'); if (g.abertura) g.abertura(); });
        return () => ganchos.forEach(({ fig, g }) => {
          fig.classList.remove('cond-fig--mov'); fig.assinaturaAbertura = null;
          aplicarEntre(transformas(fig), fig.dataset.estado, fig.dataset.estado, 1);
          if (g.restaurar) g.restaurar();
        });
      });
    });
  });
}
})();
