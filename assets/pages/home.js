/* ==========================================================================
   Home (/) · componentes da página (v3, out/2026)
   Carregado depois de site.js (window.PS). A home não usa pages/lab.*.
   Ordem: ossos → mão em camadas → atlas (abas + pontos da mão) →
   questionário → frase da marca (rolagem) → caminhos (régua). As fichas
   que viram e o "Onde atende" são componentes do site.js (seção 10).
   Ganchos e inventário: docs/site.md.
   ========================================================================== */
(function () {
'use strict';
const { $, $$, clamp, lerp, easeOut } = window.PS;
const PS = window.PS;
const RM = PS.RM;
const NS = 'http://www.w3.org/2000/svg';
const parado = () => RM || PS.motion.paused;

/* ---------- 1. OSSOS EM TRAÇO DE GRAVURA ---------- */
const HAND_BONES = [
  // indicador
  [158,352,152,262,9],[151,256,145,196,8],[144,190,141,152,7],[140,146,139,122,6],
  // médio
  [189,354,188,258,9.5],[188,252,186,186,8.5],[186,180,185,140,7.5],[185,134,184,106,6.5],
  // anelar
  [216,352,218,262,9],[219,256,222,198,8],[223,192,225,154,7],[225,148,226,120,6],
  // mínimo
  [240,350,245,270,8],[246,264,252,216,7],[253,210,257,182,6],[258,176,261,158,5.5],
  // polegar
  [152,360,118,336,11],[114,332,92,310,10],[88,306,74,276,8.5],
  // rádio e ulna
  [176,398,172,442,19],[212,400,216,442,14]
];
const HAND_CARPALS = [
  [162,368,10,8,-12],[182,370,10,8,8],[202,366,11,9,0],[222,370,10,8,14],
  [168,388,10,7,-18],[188,390,10,7,0],[208,388,9,7,12],[226,394,7,5,0]
];

/* Cada osso: contorno fino + linha de eixo (a "hachura" do atlas). */
function drawBones (target) {
  if (!target) return;
  target.textContent = '';
  HAND_BONES.forEach(([x1, y1, x2, y2, w]) => {
    const L = Math.hypot(x2 - x1, y2 - y1), r = w * .55, n = w * .29;
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('transform', `translate(${x1} ${y1}) rotate(${Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI - 90})`);
    g.innerHTML =
      `<path class="osso" d="M${-r} 0C${-r} ${-r} ${r} ${-r} ${r} 0C${r} ${L * .18} ${n} ${L * .27} ${n} ${L * .5}S${r * 1.25} ${L * .85} ${r} ${L}C${r} ${L + r} ${-r} ${L + r} ${-r} ${L}C${-r * 1.25} ${L * .85} ${-n} ${L * .7} ${-n} ${L * .5}S${-r} ${L * .18} ${-r} 0Z"/>` +
      `<path class="osso__eixo" d="M${-w * .14} 3Q${-w * .08} ${L * .5} ${-w * .14} ${L - 3}"/>`;
    target.append(g);
  });
  HAND_CARPALS.forEach(([x, y, rx, ry, rot]) => {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('class', 'osso');
    p.setAttribute('d', `M${-rx} 0Q${-rx} ${-ry} 0 ${-ry}Q${rx} ${-ry} ${rx} 0Q${rx * .7} ${ry} 0 ${ry}Q${-rx} ${ry} ${-rx} 0Z`);
    p.setAttribute('transform', `translate(${x} ${y}) rotate(${rot})`);
    target.append(p);
  });
}
drawBones($('#bones'));

/* ---------- 2. MÃO EM CAMADAS (Fig. 1 do atlas) ----------
   Ganchos: #handbox, #handSvg (viewBox 10 70 320 400), #handGeo,
   #scanMask, #scanC, #scanRing, #boneLayer, #bones, #nerves,
   .hs[data-i][data-x][data-y] (um ponto por condição), .hand-hint.
   Cria .lab-card.lab-hand e os botões [data-layer]. Devolve aim(), que
   leva a lupa até um ponto (o atlas usa ao trocar de condição). */
function handExperience () {
  const box = $('#handbox'), svg = $('#handSvg');
  if (!box || !svg) return null;
  const card = document.createElement('div');
  card.className = 'lab-card lab-hand';
  box.before(card); card.append(box);

  const controls = document.createElement('div');
  controls.className = 'lab-tabs mao__camadas';
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', 'Camada anatômica');
  controls.innerHTML = '<button type="button" data-layer="scan" aria-pressed="true">Lupa</button><button type="button" data-layer="bones" aria-pressed="false">Ossos</button><button type="button" data-layer="nerves" aria-pressed="false">Nervos</button>';
  card.prepend(controls);

  const boneLayer = $('#boneLayer'), nerves = $('#nerves'), bones = $('#bones');
  let layer = 'scan';

  // Base anatômica legível; a lupa realça uma região por cima dela.
  const base = bones.cloneNode(true);
  base.removeAttribute('id'); base.setAttribute('class', 'mao__base');
  boneLayer.before(base);
  const tendon = document.createElementNS(NS, 'g');
  tendon.setAttribute('class', 'mao__tendoes');
  tendon.innerHTML = '<path d="M178 470C180 378 153 309 141 159"/><path d="M191 470C196 357 186 267 184 130"/><path d="M207 470C221 358 223 270 226 147"/><path d="M216 470C232 372 250 280 259 176"/><path d="M166 470C168 380 118 333 84 287"/>';
  base.after(tendon);
  const folds = document.createElementNS(NS, 'g');
  folds.setAttribute('class', 'mao__dobras');
  // pregas dos dedos (base, PIP dupla, DIP), do polegar, linhas da palma e do punho
  folds.innerHTML = '<path d="M141 251.5Q150.5 254 160 251.5M142 256Q150.5 258.5 159 256M136 193Q144.5 196 153 193M136.5 198Q144.5 201 152.5 198M132 149Q139.5 151.5 147 149M178 248Q188 250.5 198 248M178.5 252.5Q188 255 197.5 252.5M177 183Q186 186 195 183M177.5 188Q186 191 194.5 188M176.5 137Q184.5 139.5 192.5 137M210.5 252Q219.5 254.5 228.5 252M211 256.5Q219.5 259 228 256.5M214.5 195.5Q223 198.5 231.5 196M215 200.5Q223 203.5 231 201M218.5 151Q225.5 153.5 232.5 151.5M240.5 265Q248.5 267.5 256.5 265.5M248 213Q255.5 215.5 263 213.5M248.5 217.5Q255.5 220 262.5 218M254 179Q260.5 181.5 267 179.5M82 300Q86 308 97 309M96 315Q100 322 112 323M260 298C236 302 206 295 172 271M134 303C160 310 205 319 243 336M136 307C128 332 137 374 168 411M160 421Q196 428 233 419M162 431Q197 437 231 429"/>';
  boneLayer.before(folds);

  const scanC = $('#scanC'), ring = $('#scanRing');
  scanC.setAttribute('r', '70'); ring.setAttribute('r', '66');
  let pos = { x: 192, y: 372 }, anim = 0;
  const api = { ativo: { x: 192, y: 372 } };
  function desenha () {
    scanC.setAttribute('cx', pos.x); scanC.setAttribute('cy', pos.y);
    ring.setAttribute('cx', pos.x); ring.setAttribute('cy', pos.y);
  }
  /* Leva a lupa até (x, y). Suave quando a troca vem de um clique; direta
     quando segue o cursor ou com movimento reduzido. */
  api.aim = (x, y, suave) => {
    cancelAnimationFrame(anim);
    const alvo = { x: +x, y: +y };
    if (!suave || parado()) { pos = alvo; desenha(); return; }
    const de = { ...pos }, t0 = performance.now(), dur = 520;
    const passo = t => {
      const k = easeOut(clamp((t - t0) / dur, 0, 1));
      pos = { x: lerp(de.x, alvo.x, k), y: lerp(de.y, alvo.y, k) }; desenha();
      if (k < 1) anim = requestAnimationFrame(passo);
    };
    anim = requestAnimationFrame(passo);
  };

  $$('[data-layer]', card).forEach(b => b.addEventListener('click', () => {
    layer = b.dataset.layer;
    $$('[data-layer]', card).forEach(t => t.setAttribute('aria-pressed', String(t === b)));
    if (layer === 'scan') boneLayer.setAttribute('mask', 'url(#scanMask)'); else boneLayer.removeAttribute('mask');
    bones.style.opacity = layer === 'nerves' ? '.15' : '1';
    nerves.style.opacity = layer === 'bones' ? '0' : '1';
    ring.style.opacity = layer === 'scan' ? '' : '0';
    card.dataset.camada = layer;
  }));

  // A lupa segue o cursor; quando ele sai, volta para a condição escolhida.
  let pending = 0;
  box.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch' || layer !== 'scan' || PS.motion.paused) return;
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(() => {
      const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
      const m = svg.getScreenCTM(); if (!m) return;
      const local = p.matrixTransform(m.inverse()); api.aim(local.x, local.y, false);
    });
  }, { passive: true });
  box.addEventListener('pointerleave', () => api.aim(api.ativo.x, api.ativo.y, true));

  function position () {
    const m = svg.getScreenCTM(); if (!m) return;
    const bounds = box.getBoundingClientRect();
    $$('.hs', box).forEach(b => {
      const p = svg.createSVGPoint(); p.x = +b.dataset.x; p.y = +b.dataset.y;
      const xy = p.matrixTransform(m);
      b.style.left = (xy.x - bounds.left) + 'px'; b.style.top = (xy.y - bounds.top) + 'px';
    });
  }
  if ('ResizeObserver' in window) new ResizeObserver(position).observe(box);
  position();
  $('.hand-hint', box).textContent = PS.COARSE ? 'Toque nos pontos da mão' : 'Passe o cursor sobre a mão para ver por dentro';

  /* Goniômetro em volta da placa: centro no punho, ponteiro ao longo do dedo
     médio. Varre de 0° a 90° quando a placa aparece na tela. */
  const gEl = $('.mao__gonio', box);
  if (gEl && PS.gonio) {
    const g = PS.gonio(gEl, { vb: '0 0 960 500', cx: 480, cy: 480, r: 432, passo: 5, l5: 7, l15: 12, l45: 20, numeros: true, base: 24, cauda: 0, folga: 30, eixo: 5, centro: 2 });
    g.set(0);
    if ('IntersectionObserver' in window && !parado()) {
      const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); setTimeout(() => g.varrer(90, 1400), 200); } }, { threshold: .35 });
      io.observe(card);
    } else g.set(90);
  }
  return api;
}
const mao = handExperience();

/* ---------- 3. ONDE DÓI? Abas + pontos da mão + figura ----------
   .tab-btn, .pane, .xr-ov[data-ov] e .hs[data-i] seguem a mesma ordem.
   Links com [data-goto] (fichas de sinais, questionário) escolhem a
   condição na hora; a rolagem até #tratamentos fica com o site.js. */
(function atlas () {
  const nav = $('#tabNav');
  if (!nav) return;
  const btns = $$('.tab-btn', nav), panes = $$('.pane'), overlays = $$('.xr-ov'),
        hots = $$('.hs'), legenda = $('#atlasLegenda');
  function set (i, instantaneo) {
    i = clamp(+i || 0, 0, btns.length - 1);
    btns.forEach((b, k) => { b.classList.toggle('on', k === i); b.setAttribute('aria-selected', String(k === i)); });
    panes.forEach((p, k) => p.classList.toggle('on', k === i));
    overlays.forEach(o => o.classList.toggle('on', +o.dataset.ov === i));
    hots.forEach(h => { const on = +h.dataset.i === i; h.classList.toggle('on', on); h.setAttribute('aria-pressed', String(on)); });
    if (legenda && panes[i] && panes[i].dataset.fig) legenda.textContent = panes[i].dataset.fig;
    const h = hots.find(x => +x.dataset.i === i);
    if (mao && h) { mao.ativo = { x: +h.dataset.x, y: +h.dataset.y }; mao.aim(h.dataset.x, h.dataset.y, !instantaneo); }
  }
  btns.forEach(b => b.addEventListener('click', () => set(b.dataset.i)));
  hots.forEach(h => h.addEventListener('click', () => set(h.dataset.i)));
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('[data-goto]');
    if (!a) return;
    set(a.dataset.goto);
    const i = clamp(+a.dataset.goto || 0, 0, btns.length - 1);
    requestAnimationFrame(() => btns[i].focus({ preventScroll: true }));
  });
  window.__setTab = set;
  set(0, true);
  // Links de outras páginas abrem uma condição: ../?atlas=<data-slug>#tratamentos
  const pedida = new URLSearchParams(location.search).get('atlas');
  const alvo = pedida ? btns.findIndex(b => b.dataset.slug === pedida) : -1;
  if (alvo > 0) set(alvo, true);
})();

/* ---------- 4. ENTENDA SEUS SINTOMAS (questionário) ----------
   Cinco perguntas, sem nível de urgência. O resultado sempre termina em
   "Agendar avaliação". O progresso aparece no goniômetro #qProg. */
(function quiz () {
  const body = $('#quizBody'), progEl = $('#qProg'), numEl = $('#qNum'), backEl = $('#qBack');
  if (!body) return;
  const passo = numEl && numEl.closest('.quiz__passo');

  const Q = [
    { q: 'Onde começa o incômodo?', h: 'Escolha a região mais próxima do que você sente.', r: 'Onde começa',
      o: [
        { t: 'No punho e nos dedos', s: 'Formigam ou adormecem, do polegar ao anelar', v: { carpo: 3 } },
        { t: 'Em um dedo que trava ou estala', s: 'Às vezes precisa da outra mão para esticar', v: { gatilho: 3 } },
        { t: 'Na lateral do punho, do lado do polegar', s: 'Dói ao torcer o punho, pegar peso ou fazer pinça', v: { tendinite: 3 } },
        { t: 'Na base do polegar', s: 'Dói ao abrir potes, girar a chave ou escrever', v: { artrose: 3, tendinite: 1 } },
        { t: 'Na mão ou no punho, depois de queda, pancada ou corte', s: 'Começou com um acidente', v: { trauma: 4 } }
      ] },
    { q: 'Como o sintoma aparece?', h: 'O tipo de sintoma ajuda a indicar a estrutura envolvida.', r: 'Como aparece',
      o: [
        { t: 'Formigamento ou dormência, pior à noite', s: 'Acorda e sacode a mão', v: { carpo: 3 } },
        { t: 'Travamento ou estalo ao mexer o dedo', s: 'Mais forte ao acordar', v: { gatilho: 3 } },
        { t: 'Dor ao segurar, torcer ou apertar', s: 'Melhora com repouso', v: { tendinite: 3, artrose: 1 } },
        { t: 'Inchaço, caroço ou mudança no formato', s: 'Na mão, no punho ou em um dedo', v: { caroco: 4, trauma: 1 } }
      ] },
    { q: 'Há quanto tempo isso acontece?', h: 'Ajuda a entender como o quadro evoluiu.', r: 'Há quanto tempo',
      o: [
        { t: 'Menos de um mês', s: 'Começou há pouco' },
        { t: 'De um a seis meses', s: 'Vai e volta' },
        { t: 'Mais de seis meses', s: 'Já faz parte da rotina' },
        { t: 'Não sei dizer', s: 'Foi aparecendo aos poucos' }
      ] },
    { q: 'O que você já tentou?', h: 'Ajuda a pensar no próximo passo.', r: 'O que já tentou',
      o: [
        { t: 'Nada ainda', s: 'É a primeira vez que procura ajuda' },
        { t: 'Remédio ou pomada', s: 'Alivia por um tempo' },
        { t: 'Fisioterapia ou tala', s: 'Melhorou em parte' },
        { t: 'Infiltração, ou já me falaram em cirurgia', s: 'O caso já foi avaliado antes' }
      ] },
    { q: 'Quanto isso atrapalha o seu dia?', h: 'Última pergunta.', r: 'No dia a dia',
      o: [
        { t: 'Incomoda, mas eu convivo', s: 'Sem limitar as tarefas' },
        { t: 'Atrapalha o trabalho', s: 'Digitar, dirigir, usar ferramentas' },
        { t: 'Me acorda à noite', s: 'Afeta o sono' },
        { t: 'Perdi força e deixo cair objetos', s: 'Já limita o uso da mão' }
      ] }
  ];

  const RES = {
    carpo: { tab: 0, name: 'Síndrome do túnel do carpo', curto: 'túnel do carpo',
      d: 'Formigamento do polegar ao anelar, pior à noite, costuma estar ligado ao nervo mediano apertado no punho.',
      n: ['Exame da sensibilidade e da força da mão', 'Manobras simples no consultório', 'Eletroneuromiografia, exame que mede a condução do nervo, se necessário', 'Conversa sobre órtese, infiltração ou cirurgia, conforme o caso'] },
    gatilho: { tab: 1, name: 'Dedo em gatilho', curto: 'dedo em gatilho',
      d: 'Travamento e estalo ao mexer o dedo costumam vir do tendão que passa com dificuldade pela polia, um anel na base do dedo.',
      n: ['Exame do dedo e do ponto onde o tendão trava', 'Avaliação do grau de travamento', 'Conversa sobre órtese, infiltração ou cirurgia, conforme o caso'] },
    tendinite: { tab: 2, name: 'Tenossinovite de De Quervain', curto: 'De Quervain',
      d: 'Dor na lateral do punho ao torcer ou segurar costuma estar ligada aos tendões do polegar, que inflamam dentro de um túnel estreito.',
      n: ['Exame da lateral do punho, com uma manobra simples (teste de Finkelstein)', 'Conversa sobre a rotina e os movimentos que pioram a dor', 'Conversa sobre órtese, infiltração ou cirurgia, conforme o caso'] },
    artrose: { tab: 3, name: 'Rizartrose', curto: 'rizartrose',
      d: 'Dor na base do polegar ao abrir potes ou girar a chave pode vir do desgaste da cartilagem dessa articulação.',
      n: ['Exame da base do polegar e da força da pinça', 'Raio-X para ver o desgaste da articulação', 'Conversa sobre órtese, exercícios, infiltração ou cirurgia, conforme o caso'] },
    caroco: { tab: 4, name: 'Cisto sinovial ou contratura de Dupuytren', curto: 'cisto sinovial',
      d: 'Um caroço na mão pode ter causas diferentes. As mais comuns são o cisto sinovial, uma bolsa de líquido junto ao punho, e a contratura de Dupuytren, um nódulo firme na palma.',
      n: ['Exame do caroço: tamanho, consistência e relação com tendões e articulações', 'Ultrassom, se necessário', 'Conversa sobre acompanhamento ou tratamento, conforme o caso'] },
    trauma: { tab: 6, name: 'Fratura ou lesão de tendão', curto: 'fraturas',
      d: 'Dor, inchaço ou dificuldade de mexer depois de queda, pancada ou corte pedem avaliação para ver se houve fratura ou lesão de tendão.',
      alerta: 'Se houve corte e o dedo não dobra ou ficou dormente, procure atendimento no mesmo dia.',
      n: ['Exame da mão e do movimento dos dedos', 'Raio-X e, se necessário, outro exame de imagem', 'Conversa sobre imobilização, cirurgia e reabilitação, conforme o caso'] }
  };

  let step = 0, advancing = false, advanceTimer = null;
  const ans = new Array(Q.length).fill(null);

  function paint () {
    const total = Q.length;
    numEl.textContent = Math.min(step + 1, total);
    if (passo) passo.hidden = false;
    if (progEl.gonio) progEl.gonio.varrer(step / total * 180, 500);
    backEl.hidden = step === 0;
  }

  /* Quem responde pelo teclado continua no questionário: o foco vai para
     o título da pergunta seguinte (a opção clicada some ao renderizar). */
  function focusHeading () {
    const h = $('h3', body);
    if (h) h.focus({ preventScroll: true });
  }

  function renderStep () {
    clearTimeout(advanceTimer); advancing = false; backEl.disabled = false;
    const s = Q[step];
    body.innerHTML = `
      <div class="qstep on">
        <h3 class="quiz__pergunta" tabindex="-1">${s.q}</h3>
        <p class="quiz__ajuda">${s.h}</p>
        <div class="opcoes qopts">
          ${s.o.map((o, i) => `<button type="button" class="opcao qopt" data-i="${i}" aria-pressed="${ans[step] === i}">${o.t}<small>${o.s}</small></button>`).join('')}
        </div>
      </div>`;
    $$('.qopt', body).forEach(b => b.addEventListener('click', e => {
      if (advancing) return;
      const teclado = e.detail === 0;
      advancing = true; backEl.disabled = true;
      $$('.qopt', body).forEach(o => { o.disabled = true; o.setAttribute('aria-pressed', String(o === b)); });
      b.classList.add('sel');
      ans[step] = +b.dataset.i;
      advanceTimer = setTimeout(() => {
        step++;
        if (step < Q.length) { renderStep(); paint(); } else result();
        if (teclado) focusHeading();
      }, RM ? 0 : 280);
    }));
    paint();
  }

  function result () {
    const score = { carpo: 0, gatilho: 0, tendinite: 0, artrose: 0, caroco: 0, trauma: 0 };
    ans.forEach((a, i) => {
      if (a === null) return;
      Object.entries(Q[i].o[a].v || {}).forEach(([k, v]) => { score[k] += v; });
    });
    // Empate: vence a condição apontada na primeira pergunta (onde começa).
    const q1 = ans[0] === null ? {} : (Q[0].o[ans[0]].v || {});
    const key = Object.keys(score).sort((a, b) => (score[b] - score[a]) || ((q1[b] || 0) - (q1[a] || 0)))[0];
    const r = RES[key];

    if (progEl.gonio) progEl.gonio.varrer(180, 600);
    if (passo) passo.hidden = true;
    numEl.textContent = String(Q.length);
    backEl.hidden = true;

    const resumo = ans.map((a, i) => a === null ? '' : `<div><dt>${Q[i].r}</dt><dd>${Q[i].o[a].t}</dd></div>`).join('');
    body.innerHTML = `
      <div class="qstep on qres" data-resultado="${key}">
        <p class="qres__pre">Suas respostas lembram</p>
        <h3 class="qres__nome" tabindex="-1">${r.name}</h3>
        <p class="qres__texto">${r.d}</p>
        ${r.alerta ? `<p class="qres__alerta">${r.alerta}</p>` : ''}
        <h4>O que costuma ser visto na consulta</h4>
        <ul class="pane__lista">${r.n.map(x => `<li>${x}</li>`).join('')}</ul>
        <details class="acordeao__item qres__resumo"><summary>O que você respondeu</summary><dl class="ficha">${resumo}</dl></details>
        <div class="acoes qres__acoes">
          <a class="btn" href="${PS.AGENDAR_URL}" data-agendar target="_blank" rel="noopener">Agendar avaliação</a>
          <button class="link" id="qSeeTab" type="button">Ver ${r.curto} no atlas</button>
          <button class="link" id="qAgain" type="button">Refazer</button>
        </div>
        <p class="nota qres__nota">Orientação educativa, baseada só nas suas respostas. O diagnóstico depende do exame na consulta.</p>
      </div>`;

    $('#qSeeTab').addEventListener('click', () => {
      if (window.__setTab) window.__setTab(r.tab);
      $('#tratamentos').scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
      const aba = $$('.tab-btn')[r.tab];
      if (aba) aba.focus({ preventScroll: true });
    });
    $('#qAgain').addEventListener('click', () => {
      step = 0; ans.fill(null); renderStep();
      $('h3', body).focus({ preventScroll: true });
    });
  }

  backEl.addEventListener('click', e => { if (!advancing && step > 0) { step--; renderStep(); if (e.detail === 0) focusHeading(); } });
  renderStep();
})();

/* ---------- 5. FRASE DA MARCA: o arco do movimento ----------
   Ganchos: #manifesto, .manifesto__trilho (altura da cena), #mArco,
   .mw (palavras), .manifesto__valores li[data-limiar], #mGraus.
   A rolagem dentro do trilho vira um ângulo de 0° a 180°: o ponteiro
   gira, o setor percorrido ganha hachura, cada palavra ganha tinta e cada
   valor aparece quando o ponteiro passa pelo seu limiar. */
(function manifesto () {
  const sec = $('#manifesto');
  if (!sec || !PS.gonio) return;
  const trilho = $('.manifesto__trilho', sec), arco = $('#mArco'), graus = $('#mGraus'),
        palavras = $$('.mw', sec), valores = $$('.manifesto__valores li', sec);
  const C = { cx: 500, cy: 500, r: 460 };
  const g = PS.gonio(arco, { vb: '-40 -54 1080 610', cx: C.cx, cy: C.cy, r: C.r, passo: 5, l5: 10, l15: 18, l45: 30, numeros: true, base: 36, cauda: 0, folga: 44, eixo: 9, centro: 3.5 });
  const svg = $('svg', arco);
  svg.insertAdjacentHTML('afterbegin', '<defs><pattern id="mHach" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><line x1="0" y1="0" x2="0" y2="9" stroke="#7E6A38" stroke-width=".9" opacity=".38"/></pattern></defs>');
  const agulha = $('.gonio__agulha-g', svg);
  agulha.insertAdjacentHTML('beforebegin', `<path class="manifesto__setor" d=""/><path class="manifesto__setor-borda" d=""/>`);
  const setor = $('.manifesto__setor', svg), borda = $('.manifesto__setor-borda', svg);
  const ponto = (a, r) => { const t = a * Math.PI / 180; return [C.cx - r * Math.cos(t), C.cy - r * Math.sin(t)]; };
  function desenhaSetor (a) {
    if (a <= .2) { setor.setAttribute('d', ''); borda.setAttribute('d', ''); return; }
    const r = C.r - 3, [x0, y0] = ponto(0, r), [x1, y1] = ponto(a, r);
    setor.setAttribute('d', `M${C.cx} ${C.cy}L${x0.toFixed(1)} ${y0.toFixed(1)}A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}Z`);
    borda.setAttribute('d', `M${x0.toFixed(1)} ${y0.toFixed(1)}A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`);
  }
  const suave = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  function pinta (p) {
    const ang = 180 * suave(clamp(p / .88, 0, 1));
    g.set(ang); desenhaSetor(ang);
    graus.textContent = Math.round(ang);
    const n = palavras.length;
    palavras.forEach((w, i) => w.classList.toggle('on', p >= .03 + i * (.62 / n)));
    valores.forEach(v => v.classList.toggle('on', ang >= +v.dataset.limiar));
  }
  let tick = false;
  function onScroll () {
    tick = false;
    if (sec.classList.contains('manifesto--estatico')) return;
    const r = trilho.getBoundingClientRect(), curso = r.height - innerHeight;
    pinta(curso > 0 ? clamp(-r.top / curso, 0, 1) : 1);
  }
  function modo () {
    const estatico = parado();
    sec.classList.toggle('manifesto--estatico', estatico);
    if (estatico) pinta(1); else onScroll();
  }
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  document.addEventListener('motionchange', modo);
  modo();
})();

/* ---------- 7. CAMINHOS DE CUIDADO: régua graduada ----------
   Ganchos: #trilha, .trilha__marco[data-i] (role=tab), .trilha__painel,
   .trilha__seta[data-dir]. As setas do teclado ficam com o site.js
   (abas). A régua se desenha uma vez, quando aparece na tela. */
(function trilha () {
  const raiz = $('#trilha');
  if (!raiz) return;
  const marcos = $$('.trilha__marco', raiz), paineis = $$('.trilha__painel', raiz), setas = $$('.trilha__seta', raiz);
  let atual = 0;
  function set (i) {
    i = clamp(+i || 0, 0, marcos.length - 1);
    const dir = i >= atual ? 1 : -1;
    atual = i;
    marcos.forEach((m, k) => {
      m.classList.toggle('on', k === i); m.classList.toggle('feito', k < i);
      m.setAttribute('aria-selected', String(k === i)); m.tabIndex = k === i ? 0 : -1;
    });
    paineis.forEach((p, k) => {
      const on = k === i;
      p.hidden = !on; p.classList.toggle('on', on);
      if (on) { p.style.setProperty('--dir', dir); p.style.animation = 'none'; void p.offsetWidth; p.style.animation = ''; }
    });
    raiz.style.setProperty('--feito', i / (marcos.length - 1));
    setas[0].disabled = i === 0;
    setas[1].disabled = i === marcos.length - 1;
  }
  marcos.forEach(m => m.addEventListener('click', () => set(m.dataset.i)));
  $$('.trilha__ir', raiz).forEach(b => b.addEventListener('click', () => { set(b.dataset.ir); marcos[atual].focus({ preventScroll: true }); }));
  setas.forEach(s => s.addEventListener('click', () => {
    set(atual + (+s.dataset.dir));
    if (s.disabled) (setas.find(x => !x.disabled) || marcos[atual]).focus();
  }));
  if ('IntersectionObserver' in window && !parado()) {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); raiz.classList.add('visto'); } }, { threshold: .3 });
    io.observe(raiz);
  } else raiz.classList.add('visto');
  set(0);
})();

/* O foco que acompanha as âncoras fica no site.js (seção 8). */

})();
