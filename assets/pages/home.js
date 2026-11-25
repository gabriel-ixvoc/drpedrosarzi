/* ==========================================================================
   Home (/) · componentes da página (v3, out/2026)
   Carregado depois de site.js (window.PS). A home não usa pages/lab.*.
   Ordem: atlas (abas + imagem da condição) →
   questionário → frase da marca (rolagem) → caminhos (régua). As fichas
   que viram e o "Onde atende" são componentes do site.js (seção 10).
   Ganchos e inventário: docs/site.md.
   ========================================================================== */
(function () {
'use strict';
const { $, $$, clamp } = window.PS;
const PS = window.PS;
const RM = PS.RM;
const parado = () => RM || PS.motion.paused;

/* ---------- 1. ONDE DÓI? Abas + imagem da condição + ficha ----------
   .tab-btn, .pane e .atlas__img[data-i] seguem a mesma ordem (25/11/2026:
   a mão em linha com camadas e pontos saiu; cada condição tem a sua imagem).
   Links com [data-goto] (fichas de sinais, questionário) escolhem a
   condição na hora; a rolagem até #tratamentos fica com o site.js. */
(function atlas () {
  const nav = $('#tabNav');
  if (!nav) return;
  const btns = $$('.tab-btn', nav), panes = $$('.pane'), imgs = $$('.atlas__img'),
        legenda = $('#atlasLegenda');
  function set (i) {
    i = clamp(+i || 0, 0, btns.length - 1);
    btns.forEach((b, k) => { b.classList.toggle('on', k === i); b.setAttribute('aria-selected', String(k === i)); });
    panes.forEach((p, k) => p.classList.toggle('on', k === i));
    imgs.forEach(p => p.classList.toggle('on', +p.dataset.i === i));
    if (legenda && panes[i] && panes[i].dataset.fig) legenda.textContent = panes[i].dataset.fig;
  }
  /* Abaixo de 1000 px a ficha fica embaixo da placa: depois do toque numa aba, se o título da ficha escolhida estiver fora da tela, a página rola
     só o necessário para ele aparecer (block 'nearest' + scroll-margin-bottom do
     home.css). Só nesses cliques: [data-goto], ?atlas=
     e o 'Ver no atlas' do questionário têm a rolagem deles. */
  const estreito = matchMedia('(max-width:999px)');
  function mostraFicha (i) {
    if (!estreito.matches) return;
    const p = panes[clamp(+i || 0, 0, panes.length - 1)];
    const h = p && $('h3', p);
    if (!h) return;
    requestAnimationFrame(() => {
      const r = h.getBoundingClientRect();
      const topo = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      if (r.top >= topo && r.bottom <= innerHeight - 72) return;
      h.scrollIntoView({ behavior: parado() ? 'auto' : 'smooth', block: 'nearest' });
    });
  }
  btns.forEach(b => b.addEventListener('click', () => { set(b.dataset.i); mostraFicha(b.dataset.i); }));
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('[data-goto]');
    if (!a) return;
    set(a.dataset.goto);
    const i = clamp(+a.dataset.goto || 0, 0, btns.length - 1);
    requestAnimationFrame(() => btns[i].focus({ preventScroll: true }));
  });
  window.__setTab = set;
  set(0);
  // Links de outras páginas abrem uma condição: ../?atlas=<data-slug>#tratamentos
  const pedida = new URLSearchParams(location.search).get('atlas');
  const alvo = pedida ? btns.findIndex(b => b.dataset.slug === pedida) : -1;
  if (alvo > 0) set(alvo);
})();

/* ---------- 2. ENTENDA SEUS SINTOMAS (questionário) ----------
   Cinco perguntas, sem nível de urgência. O resultado sempre termina em
   "Ver onde ele atende" (o agendamento saiu do site em 25/11/2026). O progresso aparece no goniômetro #qProg. */
(function quiz () {
  const body = $('#quizBody'), progEl = $('#qProg'), numEl = $('#qNum'), backEl = $('#qBack');
  if (!body) return;
  const passo = numEl && numEl.closest('.quiz__passo');

  const Q = [
    { q: 'Onde começa o incômodo?', h: 'Escolha a região mais próxima do que você sente.', r: 'Onde começa',
      o: [
        { t: 'No punho e nos dedos', s: 'Formigam ou adormecem, do polegar à metade do anelar', v: { carpo: 3 } },
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
    carpo: { tab: 0, name: 'Síndrome do túnel do carpo', curto: 'túnel do carpo', pag: [['tunel-do-carpo', 'o túnel do carpo']],
      d: 'Formigamento do polegar à metade do anelar, pior à noite, costuma estar ligado ao nervo mediano apertado no punho.',
      n: ['Exame da sensibilidade e da força da mão', 'Manobras simples no consultório', 'Eletroneuromiografia, exame que mede a condução do nervo, se necessário', 'Conversa sobre órtese, infiltração ou cirurgia, conforme o caso'] },
    gatilho: { tab: 1, name: 'Dedo em gatilho', curto: 'dedo em gatilho', pag: [['dedo-em-gatilho', 'o dedo em gatilho']],
      d: 'Travamento e estalo ao mexer o dedo costumam vir do tendão que passa com dificuldade pela polia, um anel na base do dedo.',
      n: ['Exame do dedo e do ponto onde o tendão trava', 'Avaliação do grau de travamento', 'Conversa sobre órtese, infiltração ou cirurgia, conforme o caso'] },
    tendinite: { tab: 2, name: 'Tenossinovite de De Quervain', curto: 'De Quervain', pag: [['de-quervain', 'De Quervain']],
      d: 'Dor na lateral do punho ao torcer ou segurar costuma estar ligada aos tendões do polegar, que inflamam dentro de um túnel estreito.',
      n: ['Exame da lateral do punho, com uma manobra simples (teste de Finkelstein)', 'Conversa sobre a rotina e os movimentos que pioram a dor', 'Conversa sobre órtese, infiltração ou cirurgia, conforme o caso'] },
    artrose: { tab: 3, name: 'Rizartrose', curto: 'rizartrose', pag: [['rizartrose', 'a rizartrose']],
      d: 'Dor na base do polegar ao abrir potes ou girar a chave pode vir do desgaste da cartilagem dessa articulação.',
      n: ['Exame da base do polegar e da força da pinça', 'Raio-X para ver o desgaste da articulação', 'Conversa sobre órtese, exercícios, infiltração ou cirurgia, conforme o caso'] },
    caroco: { tab: 4, name: 'Cisto sinovial ou contratura de Dupuytren', curto: 'cisto sinovial', pag: [['cisto-sinovial', 'o cisto sinovial'], ['dupuytren', 'a contratura de Dupuytren']],
      d: 'Um caroço na mão pode ter causas diferentes. As mais comuns são o cisto sinovial, uma bolsa de líquido junto ao punho, e a contratura de Dupuytren, um nódulo firme na palma.',
      n: ['Exame do caroço: tamanho, consistência e relação com tendões e articulações', 'Ultrassom, se necessário', 'Conversa sobre acompanhamento ou tratamento, conforme o caso'] },
    trauma: { tab: 6, name: 'Fratura ou lesão de tendão', curto: 'fraturas', pag: [['fraturas', 'fraturas'], ['lesoes-de-tendao', 'lesões de tendão']],
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
        <p class="qres__ler">${r.pag.map(([s, t]) => `<a class="link" href="condicoes/${s}/">Ler tudo sobre ${t}</a>`).join(' ')}</p>
        <details class="acordeao__item qres__resumo"><summary>O que você respondeu</summary><dl class="ficha">${resumo}</dl></details>
        <div class="acoes qres__acoes">
          <a class="btn btn--fantasma" href="#onde">Ver onde ele atende</a>
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
    /* Refazer: volta à pergunta 1 e, se o alto do questionário (goniômetro e
       contador) ficou fora da tela, rola até ele, descontando o cabeçalho. */
    $('#qAgain').addEventListener('click', () => {
      step = 0; ans.fill(null); renderStep();
      $('h3', body).focus({ preventScroll: true });
      const topo = $('.quiz__topo');
      if (!topo) return;
      const r = topo.getBoundingClientRect();
      const cab = $('#hdr');
      const hdr = document.documentElement.classList.contains('hdr-oculto') || !cab ? 0 : cab.getBoundingClientRect().bottom;
      if (r.top < hdr || r.top > innerHeight - 120) topo.scrollIntoView({ behavior: parado() ? 'instant' : 'smooth', block: 'start' });
    });
  }

  backEl.addEventListener('click', e => { if (!advancing && step > 0) { step--; renderStep(); if (e.detail === 0) focusHeading(); } });
  renderStep();
})();

/* ---------- 3. FRASE DA MARCA: o arco do movimento ----------
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
  const g = PS.gonio(arco, { vb: '-40 -54 1080 610', cx: C.cx, cy: C.cy, r: C.r, passo: 5, l5: 10, l15: 18, l45: 30, numeros: true, pontas: true, base: 36, cauda: 0, folga: 44, eixo: 9, centro: 3.5 });
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
  /* tela baixa (celular deitado, janela de até 500 px de altura): a cena presa
     não cabe; fica parada e compacta (home.css). Fora do parado() geral, que a mão também usa. */
  const baixa = matchMedia('(max-height:500px)');
  function modo () {
    const estatico = parado() || baixa.matches;
    sec.classList.toggle('manifesto--estatico', estatico);
    if (estatico) pinta(1); else onScroll();
  }
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  document.addEventListener('motionchange', modo);
  if (baixa.addEventListener) baixa.addEventListener('change', modo); else if (baixa.addListener) baixa.addListener(modo);
  modo();
})();

/* ---------- 4. CAMINHOS DE CUIDADO: régua graduada ----------
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
