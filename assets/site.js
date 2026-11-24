/* ==========================================================================
   Pedro Sarzi · comportamento compartilhado do site
   Carregado com defer ANTES dos scripts de página (pages/*.js), que usam
   a API exposta em window.PS. Ganchos e inventário: docs/site.md.
   ========================================================================== */
(function () {
'use strict';

/* Link único de agendamento. Hoje é o Direct do Instagram; para trocar
   (WhatsApp, Doctoralia), mude só esta linha. Todo <a data-agendar>
   recebe este endereço. */
const AGENDAR_URL = 'https://ig.me/m/pedro_sarzi';

const $  = (s, c) => { try { return (c || document).querySelector(s); } catch (e) { return null; } };
const $$ = (s, c) => { try { return Array.from((c || document).querySelectorAll(s)); } catch (e) { return []; } };
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const reducedMQ = matchMedia('(prefers-reduced-motion: reduce)');
const RM = reducedMQ.matches;
const COARSE = matchMedia('(hover:none), (pointer:coarse)').matches;

/* Relógio de animação ancorado no primeiro quadro desenhado. */
function animate (dur, onStep, onDone) {
  if (RM) { onStep(1); if (onDone) onDone(); return; }
  let start = null;
  function frame (t) {
    if (start === null) start = t;
    const k = clamp((t - start) / dur, 0, 1);
    onStep(k);
    if (k < 1) requestAnimationFrame(frame); else if (onDone) onDone();
  }
  requestAnimationFrame(frame);
}
/* Suavização independente da taxa de quadros. */
const smooth = (rate, dt) => 1 - Math.pow(1 - rate, Math.min(dt, 100) / 16.667);
const easeOut = k => 1 - Math.pow(1 - k, 3);

/* ---------- Estado de movimento (botão "Pausar animações") ---------- */
let paused = reducedMQ.matches;
let motionBtn = null;
function syncMotion () {
  document.documentElement.classList.toggle('motion-paused', paused);
  if (motionBtn) motionBtn.setAttribute('aria-pressed', String(paused));
  document.dispatchEvent(new Event('motionchange'));
}

const PS = window.PS = {
  AGENDAR_URL, $, $$, lerp, clamp, animate, smooth, easeOut, RM, COARSE,
  motion: {
    get paused () { return paused; },
    set (v) { paused = !!v; syncMotion(); }
  }
};

/* ---------- 1. Links de agendamento ---------- */
$$('a[data-agendar]').forEach(a => { a.href = AGENDAR_URL; a.target = '_blank'; a.rel = 'noopener'; });

/* ---------- 2. Goniômetro ---------- */
/* Monta o SVG: arco, marcas a cada 5° (maiores a cada 15° e 45°),
   números 0/45/90/135/180 e ponteiro. 0° à esquerda, 180° à direita. */
const NS = 'http://www.w3.org/2000/svg';
function gonioSVG (o) {
  const { cx, cy, r, numeros, passo } = o;
  const pt = (a, rr) => { const t = a * Math.PI / 180; return [(cx - rr * Math.cos(t)).toFixed(2), (cy - rr * Math.sin(t)).toFixed(2)]; };
  let marcas = '';
  for (let a = 0; a <= 180; a += passo) {
    const m45 = a % 45 === 0, m15 = a % 15 === 0;
    const len = m45 ? o.l45 : m15 ? o.l15 : o.l5;
    const [x1, y1] = pt(a, r), [x2, y2] = pt(a, r - len);
    marcas += `<line class="gonio__marca${m45 ? ' gonio__marca--45' : m15 ? ' gonio__marca--15' : ''}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  }
  let nums = '';
  if (numeros) [0, 45, 90, 135, 180].forEach(a => {
    /* o.pontas: 0 e 180 ficam fora do arco, com o mesmo afastamento (.4em) dos dois lados,
       assentados .3em acima da linha de base (opção do manifesto; as outras peças guardam o desenho) */
    if (o.pontas && a % 180 === 0) {
      const [x] = pt(a, r);
      nums += `<text class="gonio__num" x="${x}" y="${cy}" dx="${a ? '.4em' : '-.4em'}" dy="-.3em" text-anchor="${a ? 'start' : 'end'}">${a}</text>`;
      return;
    }
    const [x, y] = pt(a, r + 13);
    /* 45, 90 e 135 levam data-a: o criarGonio os afasta do arco pelo tamanho real da letra */
    nums += `<text class="gonio__num"${a % 180 ? ` data-a="${a}"` : ''} x="${x}" y="${(+y + (a % 180 === 0 ? -9 : 0)).toFixed(2)}" text-anchor="middle" dominant-baseline="central">${a}</text>`;
  });
  const [ax, ay] = pt(0, r), [bx, by] = pt(180, r);
  return `<svg viewBox="${o.vb}" aria-hidden="true" focusable="false">
    <line class="gonio__base" x1="${ax - o.base}" y1="${cy}" x2="${+bx + o.base}" y2="${cy}"/>
    <path class="gonio__arco" d="M${ax} ${ay}A${r} ${r} 0 0 1 ${bx} ${by}"/>
    ${marcas}${nums}
    <g class="gonio__agulha-g" transform="rotate(0 ${cx} ${cy})"><line class="gonio__agulha" x1="${cx + o.cauda}" y1="${cy}" x2="${cx - r + o.folga}" y2="${cy}"/></g>
    <circle class="gonio__eixo" cx="${cx}" cy="${cy}" r="${o.eixo}"/><circle class="gonio__centro" cx="${cx}" cy="${cy}" r="${o.centro}"/>
  </svg>`;
}
const GONIO_GRANDE = { vb: '-26 -28 292 160', cx: 120, cy: 120, r: 112, passo: 5, l5: 5, l15: 9, l45: 14, numeros: true, base: 10, cauda: 14, folga: 8, eixo: 5, centro: 2 };
const GONIO_MINI = { vb: '0 0 56 32', cx: 28, cy: 29, r: 25, passo: 15, l5: 0, l15: 3, l45: 5.5, numeros: false, base: 0, cauda: 0, folga: 4, eixo: 3.2, centro: 1.4 };

/* Números 45, 90 e 135 assentados fora do arco conforme a letra que o CSS deu a cada peça
   (13 a 24 unidades): o centro vai para r + meio traço + meia caixa na direção do ângulo + folga
   (no mínimo 5 px de tela), nunca mais perto que os r + 13 do desenho original. Mede com getBBox;
   com a peça escondida (caixa zerada), estima pela fonte e refaz quando ela aparece (resize) e
   quando a Cormorant termina de carregar. O 0 e o 180 não se mexem. */
const gonios = [];
function assentarNumeros (el, o) {
  const svg = $('svg', el), nums = $$('.gonio__num[data-a]', el);
  if (!svg || !nums.length) return;
  const arco = $('.gonio__arco', svg);
  const traco = arco ? parseFloat(getComputedStyle(arco).strokeWidth) || 1 : 1;
  let escala = 0;
  try { const m = svg.getScreenCTM(); escala = m ? Math.hypot(m.a, m.b) : 0; } catch (e) {}
  nums.forEach(t => {
    const a = +t.dataset.a, th = a * Math.PI / 180, c = Math.cos(th), s = Math.sin(th);
    const fs = parseFloat(getComputedStyle(t).fontSize) || 13;
    let w = 0, h = 0, ox = 0, oy = 0;
    try {
      const b = t.getBBox();
      if (b.width) { w = b.width / 2; h = b.height / 2; ox = b.x + w - (+t.getAttribute('x')); oy = b.y + h - (+t.getAttribute('y')); }
    } catch (e) {}
    if (!w) { w = fs * .27 * t.textContent.length; h = fs * .6; }
    const folga = Math.max(fs * .25, escala ? 5 / escala : 4);
    const d = Math.max(o.r + 13, o.r + traco / 2 + w * Math.abs(c) + h * s + folga);
    t.setAttribute('x', (o.cx - d * c - ox).toFixed(2));
    t.setAttribute('y', (o.cy - d * s - oy).toFixed(2));
  });
}
let reassentar = 0;
const reassentarTodos = () => { cancelAnimationFrame(reassentar); reassentar = requestAnimationFrame(() => gonios.forEach(([el, o]) => assentarNumeros(el, o))); };
addEventListener('resize', reassentarTodos, { passive: true });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(reassentarTodos);

function criarGonio (el, opts) {
  const o = Object.assign({}, el.dataset.gonioNumeros === 'false' ? Object.assign({}, GONIO_GRANDE, { numeros: false }) : GONIO_GRANDE, opts);
  el.innerHTML = gonioSVG(o);
  if (o.numeros) { assentarNumeros(el, o); gonios.push([el, o]); }
  const g = $('.gonio__agulha-g', el);
  let atual = 0, anim = 0;
  const api = {
    get valor () { return atual; },
    set (deg) { cancelAnimationFrame(anim); atual = clamp(+deg || 0, 0, 180); g.setAttribute('transform', `rotate(${atual.toFixed(2)} ${o.cx} ${o.cy})`); },
    varrer (para, dur = 1400) {
      if (RM || paused) { api.set(para); return; }
      const de = atual, t0 = performance.now();
      const passo = t => { const k = clamp((t - t0) / dur, 0, 1); api.set(lerp(de, para, easeOut(k))); if (k < 1) anim = requestAnimationFrame(passo); };
      anim = requestAnimationFrame(passo);
    }
  };
  el.gonio = api;
  return api;
}
PS.gonio = criarGonio;
$$('[data-gonio]').forEach(el => {
  const g = criarGonio(el), v = +el.dataset.gonioValor || 0;
  if (!('gonioVarrer' in el.dataset)) { g.set(v); return; }
  if (!('IntersectionObserver' in window)) { g.varrer(v); return; }
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); setTimeout(() => g.varrer(v), 250); } }, { threshold: .4 });
  io.observe(el);
});

/* Controle do goniômetro: indica a rolagem e pausa as animações.
   A partir de 1400 px fica fixo no canto inferior esquerdo, na margem livre
   da página; abaixo disso a margem não comporta o controle sem cobrir texto,
   e ele entra no cabeçalho, antes do botão de agendar. */
motionBtn = document.createElement('button');
motionBtn.type = 'button';
motionBtn.className = 'motion-control gonio-ctrl';
motionBtn.innerHTML = '<span class="gonio-ctrl__dial"></span><span class="gonio-ctrl__rotulo">Pausar animações</span>';
document.body.append(motionBtn);
const dial = criarGonio($('.gonio-ctrl__dial', motionBtn), GONIO_MINI);
$('svg', motionBtn).insertAdjacentHTML('beforeend', '<g class="gonio__pausa"><line x1="25" y1="13" x2="25" y2="22"/><line x1="31" y1="13" x2="31" y2="22"/></g>');
motionBtn.addEventListener('click', () => { paused = !paused; syncMotion(); });
reducedMQ.addEventListener('change', () => { paused = reducedMQ.matches; syncMotion(); });
syncMotion();
(function lugarDoControle () {
  const barra = $('#hdr .cabecalho__in');
  if (!barra) return;
  const estreito = matchMedia('(max-width:1399px)');
  const mover = () => {
    if (estreito.matches) barra.insertBefore(motionBtn, $('.cabecalho__cta', barra) || $('#burger', barra));
    else document.body.append(motionBtn);
  };
  estreito.addEventListener('change', mover);
  mover();

  /* Fixo (a partir de 1400 px), o controle acompanha a superfície que está
     sob ele: sobre capítulo claro vira marfim (.gonio-ctrl--claro). Testa o
     ponto central uma vez por quadro, só durante a rolagem e no resize. */
  /* .manifesto (home) é marfim sem a classe de capítulo: entra na lista */
  const CLARO = '.cap--marfim,.cap--linho,.sup-clara,.manifesto';
  const SUPERFICIE = CLARO + ',.cap,.capa,.rodape,.sup-escura,.gaveta';
  let pedido = 0;
  const conferir = () => {
    pedido = 0;
    let claro = false;
    if (!estreito.matches && motionBtn.isConnected && !motionBtn.closest('#hdr')) {
      const r = motionBtn.getBoundingClientRect();
      const pilha = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      for (const el of pilha) {
        if (motionBtn.contains(el)) continue;
        const sup = el.closest(SUPERFICIE);
        if (sup) { claro = sup.matches(CLARO); break; }
      }
    }
    motionBtn.classList.toggle('gonio-ctrl--claro', claro);
  };
  const agendar = () => { if (!pedido) pedido = requestAnimationFrame(conferir); };
  addEventListener('scroll', agendar, { passive: true });
  addEventListener('resize', agendar, { passive: true });
  estreito.addEventListener('change', agendar);
  agendar();
})();

/* ---------- 3. Cabeçalho, página atual, rolagem ---------- */
(function header () {
  const hdr = $('#hdr'), fab = $('#fab'), rodape = $('.rodape'), raiz = document.documentElement;
  /* A barra de agendar (#fab) aparece assim que nenhum botão "Agendar avaliação"
     da página está na tela (o da capa saiu) e some enquanto outro está: nunca
     dois iguais ao mesmo tempo. Só existe abaixo de 600 px (site.css). */
  const ctasVisiveis = new Set();
  const fabMQ = matchMedia('(max-width:599px)');
  let ctasProntos = !('IntersectionObserver' in window);
  if (fab && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) ctasVisiveis.add(e.target); else ctasVisiveis.delete(e.target); });
      ctasProntos = true;
      syncFab();
    });
    const observar = () => $$('main .btn[data-agendar]').forEach(b => io.observe(b));
    observar();
    /* o resultado do questionário cria um botão novo */
    new MutationObserver(() => { ctasVisiveis.forEach(b => { if (!b.isConnected) ctasVisiveis.delete(b); }); observar(); })
      .observe($('main') || document.body, { childList: true, subtree: true });
  }
  /* Um bloco dourado sólido por tela: enquanto o botão de agendar da capa está à
     vista, o do cabeçalho fica fantasma (html.cta-capa-visivel, site.css).
     "À vista" desconta a faixa do cabeçalho: botão da capa escondido sob ele
     não conta, e o do cabeçalho volta a ser sólido. A margem segue a altura
     real do cabeçalho (muda em 1100 px), refeita só quando ela muda. */
  const ctaCapa = $('main .capa .btn[data-agendar]');
  if (ctaCapa && 'IntersectionObserver' in window) {
    let ioCta = null, alturaCta = -1;
    const observarCta = () => {
      const h = hdr ? Math.round(hdr.getBoundingClientRect().height) : 0;
      if (h === alturaCta) return;
      alturaCta = h;
      if (ioCta) ioCta.disconnect();
      ioCta = new IntersectionObserver(([e]) => raiz.classList.toggle('cta-capa-visivel', e.isIntersecting),
        { rootMargin: `-${h}px 0px 0px 0px`, threshold: .5 });
      ioCta.observe(ctaCapa);
    };
    observarCta();
    addEventListener('resize', observarCta, { passive: true });
  }
  const norm = p => p.replace(/index\.html$/, '').replace(/\/?$/, '/');
  const aqui = norm(location.pathname);
  $$('#nav a, #drawer a, .rodape__lista a').forEach(a => {
    if (!a.getAttribute('href') || a.getAttribute('href').startsWith('#') || a.origin !== location.origin) return;
    const on = norm(a.pathname) === aqui;
    a.classList.toggle('active', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  let last = scrollY, tick = false;
  /* Rolagem que a pessoa não fez (âncora ao abrir a página, clique em link
     interno) não esconde o cabeçalho: o destino já desconta a altura dele
     (scroll-padding-top) e ficaria uma faixa vazia acima do título. */
  let auto = !!location.hash;
  ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(t => addEventListener(t, () => { auto = false; }, { passive: true, capture: true }));
  document.addEventListener('click', e => { if (e.target.closest && e.target.closest('a[href^="#"]')) auto = true; }, true);
  function syncFab () {
    if (!fab) return;
    const on = ctasProntos && !ctasVisiveis.size && !(rodape && rodape.getBoundingClientRect().top < innerHeight);
    fab.classList.toggle('show', on);
    /* com a barra na tela, o foco e as âncoras param acima dela (scroll-padding-bottom) */
    raiz.classList.toggle('fab-visivel', on && fabMQ.matches);
  }
  function onScroll () {
    tick = false;
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    if (hdr) {
      hdr.classList.toggle('stuck', y > 12);
      const oculto = !auto && y > 420 && y > last && !document.body.classList.contains('menu-open');
      hdr.classList.toggle('hide', oculto);
      /* espelho no html: o que fica preso abaixo do cabeçalho sobe junto (--hdr-vis) */
      raiz.classList.toggle('hdr-oculto', oculto);
    }
    syncFab();
    dial.set(max > 0 ? (y / max) * 180 : 0);
    last = y;
  }
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  onScroll();

  /* Página aberta com #âncora: o navegador já salta para o destino, mas fontes e
     imagens que chegam depois podem empurrá-lo. Uma vez só, depois das fontes e
     do load, e só se a pessoa ainda não rolou, recoloca o destino no lugar. */
  if (location.hash.length > 1) {
    let alvo = null;
    try { alvo = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (e) { alvo = null; }
    if (alvo) {
      const pronto = () => new Promise(r => { if (document.readyState === 'complete') r(); else addEventListener('load', r, { once: true }); });
      Promise.all([document.fonts ? document.fonts.ready : null, pronto()]).then(() => requestAnimationFrame(() => {
        if (auto) alvo.scrollIntoView({ block: 'start', behavior: 'instant' });
      }));
    }
  }
})();

/* ---------- 4. Menu mobile ---------- */
(function menu () {
  const b = $('#burger'), d = $('#drawer');
  if (!b || !d) return;
  const close = () => { document.body.classList.remove('menu-open'); b.setAttribute('aria-expanded', 'false'); };
  b.addEventListener('click', () => {
    const open = document.body.classList.toggle('menu-open');
    b.setAttribute('aria-expanded', String(open));
  });
  $$('a', d).forEach(a => a.addEventListener('click', close));
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
})();

/* ---------- 5. Revelação (opcional) ---------- */
/* Adiciona .in quando o elemento entra na tela. O CSS base não esconde
   nada: só use para um momento específico (ex.: a barra #steps). */
(function reveal () {
  const els = $$('[data-rv], .stagger, .rise, #steps');
  if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  const io = new IntersectionObserver(ents => ents.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }), { threshold: .12, rootMargin: '0px 0px -8% 0px' });
  els.forEach(e => io.observe(e));
})();

/* ---------- 6. Contadores (data-count; data-cnt aceito por compatibilidade) ---------- */
(function counters () {
  const els = $$('[data-count], [data-cnt]');
  if (!els.length) return;
  const run = el => {
    const to = +(el.dataset.count ?? el.dataset.cnt), suf = el.dataset.suffix || '';
    animate(1800, k => { el.textContent = Math.round(to * easeOut(k)).toLocaleString('pt-BR') + (k === 1 ? suf : ''); });
  };
  if (!('IntersectionObserver' in window)) { els.forEach(run); return; }
  const io = new IntersectionObserver(ents => ents.forEach(en => {
    if (!en.isIntersecting) return;
    io.unobserve(en.target); run(en.target);
  }), { threshold: .6 });
  els.forEach(e => io.observe(e));
})();

/* ---------- 7. Acordeão: <details class="acordeao__item"> com altura animada ---------- */
(function acordeao () {
  $$('details.acordeao__item').forEach(d => {
    const s = $('summary', d);
    if (!s) return;
    /* estado-alvo explícito: cliques rápidos seguidos alternam o alvo, e a
       animação sempre parte da altura atual (três cliques terminam aberto) */
    let anim = null, alvo = d.open;
    d.addEventListener('toggle', () => { if (!anim) alvo = d.open; });
    s.addEventListener('click', e => {
      /* com movimento reduzido ou "Pausar animações", abre e fecha sem animar */
      if (RM || paused || !d.animate) return;
      e.preventDefault();
      const ini = d.offsetHeight;
      if (anim) { anim.onfinish = null; anim.cancel(); anim = null; }
      alvo = !alvo;
      d.open = true;
      const fim = alvo ? d.offsetHeight : s.offsetHeight;
      const a = anim = d.animate({ height: [ini + 'px', fim + 'px'] }, { duration: 250, easing: 'cubic-bezier(.2,.7,.1,1)' });
      a.onfinish = () => { if (anim !== a) return; anim = null; d.open = alvo; };
    });
  });
})();

/* ---------- 8. Rolagem suave para âncoras (delegada: vale para links criados depois) ---------- */
document.addEventListener('click', e => {
  const a = e.target.closest && e.target.closest('a[href^="#"]');
  if (!a || e.defaultPrevented) return;
  const id = a.getAttribute('href');
  if (id.length < 2) return;
  const t = $(id);
  if (!t) return;
  e.preventDefault();
  t.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
  if (history.replaceState) history.replaceState(null, '', id);
  /* O foco vai junto, para o próximo Tab continuar do destino (pular para o
     conteúdo, links da capa). [data-goto] leva o foco para a aba (home.js). */
  if (a.hasAttribute('data-goto') || t === document.activeElement) return;
  if (!t.matches('a[href],button,input,select,textarea,[tabindex]')) t.setAttribute('tabindex', '-1');
  t.focus({ preventScroll: true });
});

$$('#yr').forEach(el => { el.textContent = new Date().getFullYear(); });

/* ---------- 10. COMPONENTES COMPARTILHADOS (home, /dr/ e /prp/) ---------- */
/* Fichas que viram: .sinal > .sinal__giro > .sinal__frente (.sinal__virar,
   aria-expanded) + .sinal__verso (inert enquanto fechado, .sinal__voltar; o site.css também
   esconde a face fechada com visibility, para navegador sem inert).
   Uma ficha aberta por lista; Esc fecha; o foco vai para o verso e volta. */
(function fichasQueViram () {
  $$('.sinal').forEach(ficha => {
    const virar = $('.sinal__virar', ficha), voltar = $('.sinal__voltar', ficha);
    if (!virar || !voltar) return;
    /* o × fica no canto de cima (posição absoluta): vai para o começo do verso no DOM para a
       ordem do Tab seguir a ordem visual (× antes dos links das condições); o lugar na tela não muda */
    if (voltar.parentElement && voltar.parentElement.firstElementChild !== voltar) voltar.parentElement.prepend(voltar);
    let trava = 0;
    function vira (aberta, foco) {
      const frente = $('.sinal__frente', ficha), verso = $('.sinal__verso', ficha);
      /* trava de toque duplo (.sinal--virando, site.css): por 520 ms (o giro inteiro) nenhuma face
         recebe toque, para o 2º toque não abrir um link do verso nem desvirar.
         Vale também com movimento reduzido. */
      if (aberta !== ficha.classList.contains('virado')) {
        ficha.classList.add('sinal--virando');
        clearTimeout(trava);
        trava = setTimeout(() => ficha.classList.remove('sinal--virando'), 520);
      }
      ficha.classList.toggle('virado', aberta);
      virar.setAttribute('aria-expanded', String(aberta));
      verso.inert = !aberta; frente.inert = aberta;
      /* ao abrir, o foco vai ao primeiro link das condições (o conteúdo do verso); Shift+Tab chega ao × */
      if (foco) (aberta ? ($('a', verso) || voltar) : virar).focus({ preventScroll: true });
    }
    ficha.vira = vira;
    virar.addEventListener('click', () => {
      $$('.sinal.virado', ficha.parentElement).forEach(f => { if (f !== ficha && f.vira) f.vira(false, false); });
      vira(true, true);
    });
    voltar.addEventListener('click', () => vira(false, true));
    ficha.addEventListener('keydown', e => { if (e.key === 'Escape' && ficha.classList.contains('virado')) vira(false, true); });
  });
})();

/* Pontos de carrossel: <div class="pontos" aria-hidden="true"> logo depois de
   uma lista que vira carrossel (celular em pé e deitado). Os pontos aparecem só
   enquanto a lista rola de lado e mostra uma ficha por vez (deitado, com três à
   vista, a ficha cortada na borda já diz que há mais); o item mais perto do
   centro marca o seu ponto; tocar num ponto leva o item ao encaixe; o foco do
   teclado numa ficha fora da tela leva o carrossel até ela. */
(function pontos () {
  $$('.pontos').forEach(el => {
    const lista = el.previousElementSibling;
    if (!lista || !lista.children.length) return;
    const itens = Array.from(lista.children);
    el.style.setProperty('--n', itens.length);
    el.innerHTML = itens.map((x, i) => `<button type="button" tabindex="-1" data-i="${i}"></button>`).join('');
    const bs = $$('button', el);
    let atual = -1;
    const marca = i => { if (i === atual) return; atual = i; bs.forEach((b, k) => b.classList.toggle('on', k === i)); };
    const modo = () => RM || paused ? 'auto' : 'smooth';
    const rola = () => lista.scrollWidth > lista.clientWidth + 1;
    /* encaixe pelo centro (em pé) ou pelo começo, na margem (deitado) */
    const peloInicio = () => /start/.test(getComputedStyle(itens[0]).scrollSnapAlign);
    /* scrollTo (posição final), não scrollBy: com scroll-snap-stop:always, a rolagem relativa
       parava na ficha seguinte e o 4º ponto levava só à 2ª ficha */
    const ir = (i, behavior) => {
      const fr = itens[i].getBoundingClientRect(), lr = lista.getBoundingClientRect();
      const dx = peloInicio() ? fr.left - lr.left - (parseFloat(getComputedStyle(lista).scrollPaddingLeft) || 0)
        : (fr.left + fr.width / 2) - (lr.left + lista.clientWidth / 2);
      lista.scrollTo({ left: lista.scrollLeft + dx, behavior });
    };
    bs.forEach(b => b.addEventListener('click', () => ir(+b.dataset.i, modo())));
    let pedido = 0;
    const conferir = () => {
      pedido = 0;
      const lr = lista.getBoundingClientRect(), meio = lr.left + lista.clientWidth / 2;
      let perto = 0, menor = Infinity;
      itens.forEach((f, i) => { const r = f.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - meio); if (d < menor) { menor = d; perto = i; } });
      marca(perto);
    };
    lista.addEventListener('scroll', () => { if (!pedido) pedido = requestAnimationFrame(conferir); }, { passive: true });
    /* em grade (tablet e computador) a lista não rola de lado e os pontos somem */
    const medir = () => { el.hidden = !rola() || itens[0].getBoundingClientRect().width * 2 <= lista.clientWidth; conferir(); };
    if ('ResizeObserver' in window) new ResizeObserver(medir).observe(lista);
    else addEventListener('resize', medir, { passive: true });
    medir();
    /* Tab numa ficha fora da tela: o encaixe obrigatório devolvia o carrossel à ficha anterior e o
       anel de foco ficava fora da vista. Depois da rolagem do próprio navegador (próximo quadro),
       a ficha focada vai ao encaixe (se ainda não estiver inteira à vista) e marca o seu ponto. */
    lista.addEventListener('focusin', e => {
      if (!rola()) return;
      const i = itens.findIndex(f => f.contains(e.target));
      if (i < 0) return;
      marca(i);
      requestAnimationFrame(() => {
        const fr = itens[i].getBoundingClientRect(), lr = lista.getBoundingClientRect();
        const inteira = fr.left >= lr.left - 1 && fr.right <= lr.left + lista.clientWidth + 1;
        if (!peloInicio() || !inteira) ir(i, modo());
      });
    });
  });
})();

/* Onde atende (três locais): marca o dia de hoje na agenda (#semana) e escreve a
   frase "Hoje" (#semanaAgora); o nome de cada local (.local__filtro) apaga na
   agenda os turnos dos outros locais e escolhe o local do mapa; o mapa do Google
   só carrega quando a pessoa toca em "Mostrar o mapa aqui" (#mapaBtn).
   Dados de cada local no próprio HTML: data-local, data-mapa (busca) e data-nome. */
(function ondeAtende () {
  /* Nomes de local e endereço não quebram no meio ("São Luiz / Alphaville", "Agú, / 630"), nem a
     faixa de horário da frase "Hoje" ("das 8h / às 16h"), nem a frequência do sábado na agenda
     ("dois / por mês": a quebra cai depois da vírgula): troca o espaço por espaço sem quebra no
     "Onde atende", no rodapé e no menu. */
  const NOMES = /(São Luiz Alphaville|São Luiz Osasco|Clínica Fares|Centro de Osasco|Rua Antônio Agú(?:, 630)?|dois por mês|das\s\d{1,2}h(?:\d{2})?\sàs\s\d{1,2}h(?:\d{2})?)/g;
  const semQuebra = raiz => {
    const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
    for (let n; (n = w.nextNode());) {
      if (NOMES.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(NOMES, m => m.replace(/ /g, ' '));
      NOMES.lastIndex = 0;
    }
  };
  $$('#onde, .rodape__frase, .rodape address, .gaveta__contato').forEach(semQuebra);

  const semana = $('#semana');
  const hoje = semana && $(`:scope > li[data-dia="${new Date().getDay()}"]`, semana);
  if (hoje) {
    hoje.classList.add('hoje'); hoje.setAttribute('aria-current', 'date');
    $('.semana__dia', hoje).insertAdjacentHTML('beforeend', '<span class="semana__hoje">hoje</span>');
    const agora = $('#semanaAgora');
    if (agora) {
      const turnos = $$('.semana__turnos > li', hoje).map(t => {
        const hora = $('.turno__hora', t).textContent.trim(), onde = $('.turno__local', t).textContent.trim();
        if (!t.dataset.local) return onde.charAt(0).toLowerCase() + onde.slice(1);
        return `<b>${onde.replace(/ /g, ' ')}</b>, das ${hora}`;
      });
      agora.innerHTML = hoje.dataset.agora || ('Hoje: ' + turnos.join('; ') + '.');
      semQuebra(agora);
      agora.hidden = false;
    }
  }

  const btn = $('#mapaBtn'), quadro = $('#mapa');
  const locais = $$('.local[data-local]');
  /* mapa padrão: a Clínica Fares (endereço confirmado e local da foto da fachada), pelo
     data-local, e não pela ordem da lista (que começa pelo São Luiz Alphaville) */
  const padrao = locais.find(l => l.dataset.local === 'fares') || locais[0];
  let escolhido = padrao;
  /* Mapa sob demanda: "Carregando o mapa…" até o load do iframe, e o link
     "Abrir no Google Maps" sempre embaixo (o iframe de outra origem não avisa
     quando falha). O botão some com a troca: se o foco estava nele, vai para o
     iframe ("Mapa: <local>"), para não cair no <body>. O aviso para leitor de tela
     sai num status fixo, fora do #mapa (que fica aria-busy), criado vazio e
     escrito depois, para ser anunciado; o texto visível fica aria-hidden. */
  let aviso = null;
  if (btn && quadro) {
    aviso = document.createElement('p');
    aviso.className = 'sr-only'; aviso.setAttribute('role', 'status'); aviso.setAttribute('aria-live', 'polite');
    quadro.after(aviso);
  }
  const anunciar = texto => { if (!aviso) return; aviso.textContent = ''; setTimeout(() => { aviso.textContent = texto; }, 120); };
  const mostrarMapa = () => {
    const busca = escolhido ? escolhido.dataset.mapa : 'Clínica Fares, Rua Antônio Agú, 630, Osasco SP';
    const nome = escolhido ? escolhido.dataset.nome : 'Clínica Fares';
    const devolver = !!btn && document.activeElement === btn;
    const anel = devolver && btn.matches(':focus-visible');
    const caixa = document.createElement('div');
    caixa.className = 'mapa__quadro';
    caixa.innerHTML = '<p class="mapa__carregando" aria-hidden="true">Carregando o mapa…</p>';
    const f = document.createElement('iframe');
    f.title = 'Mapa: ' + nome;
    f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade';
    f.addEventListener('load', () => { const c = $('.mapa__carregando', caixa); if (c) c.remove(); quadro.removeAttribute('aria-busy'); anunciar('Mapa carregado.'); }, { once: true });
    f.src = 'https://www.google.com/maps?q=' + encodeURIComponent(busca) + '&output=embed';
    caixa.prepend(f);
    const abrir = document.createElement('p');
    abrir.className = 'mapa__abrir';
    abrir.innerHTML = '<a class="link" target="_blank" rel="noopener">Abrir no Google Maps<span class="sr-only"> (abre em nova aba)</span></a>';
    $('a', abrir).href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(busca);
    quadro.textContent = ''; quadro.append(caixa, abrir);
    quadro.setAttribute('aria-busy', 'true');
    quadro.dataset.carregado = '';
    anunciar('Carregando o mapa: ' + nome + '…');
    if (devolver) {
      /* o Chrome não dá :focus-visible a um iframe: o anel vai no quadro, por classe, só
         quando o botão foi acionado pelo teclado, e sai quando o foco deixa o mapa */
      if (anel) {
        caixa.classList.add('mapa__quadro--foco');
        f.addEventListener('blur', () => caixa.classList.remove('mapa__quadro--foco'), { once: true });
      }
      f.focus({ preventScroll: true });
    }
  };
  if (btn && quadro) btn.addEventListener('click', mostrarMapa);

  /* A dica sob os locais vira um status (aria-live): diz qual local filtra a
     agenda e, no celular, oferece "Ver na agenda", que rola só quando tocado. */
  const dica = $('.locais__dica');
  const dicaOriginal = dica ? dica.innerHTML : '';
  if (dica) { dica.setAttribute('role', 'status'); dica.setAttribute('aria-live', 'polite'); }
  const avisar = local => {
    if (!dica) return;
    if (!local) { dica.innerHTML = dicaOriginal; dica.classList.remove('filtrada'); return; }
    const nome = ($('.local__nome', local) || local).textContent.trim();
    const art = /^(clínica|casa|unidade)/i.test(nome) ? 'da' : 'do';
    dica.innerHTML = `Agenda filtrada: só os dias ${art} <b>${nome.replace(/ /g, ' ')}</b>.`;
    const ver = document.createElement('button');
    ver.type = 'button'; ver.className = 'locais__ver'; ver.textContent = 'Ver na agenda';
    ver.addEventListener('click', () => {
      const alvo = $('.onde__horario') || semana;
      if (alvo) alvo.scrollIntoView({ behavior: RM || paused ? 'auto' : 'smooth', block: 'start' });
    });
    dica.append(' ', ver);
    dica.classList.add('filtrada');
  };

  locais.forEach(local => {
    const b = $('.local__filtro', local);
    if (!b) return;
    b.addEventListener('click', () => {
      const ligar = b.getAttribute('aria-pressed') !== 'true';
      locais.forEach(l => { const x = $('.local__filtro', l); if (x) x.setAttribute('aria-pressed', 'false'); });
      b.setAttribute('aria-pressed', String(ligar));
      const id = ligar ? local.dataset.local : '';
      if (semana) {
        $$('.semana__turnos > li', semana).forEach(t => t.classList.toggle('fora', !!id && t.dataset.local !== id));
        $$(':scope > li', semana).forEach(d => d.classList.toggle('fora', !!id && !$(`[data-local="${id}"]`, d)));
      }
      avisar(ligar ? local : null);
      escolhido = ligar ? local : padrao;
      if (quadro && 'carregado' in quadro.dataset) mostrarMapa();
    });
  });
})();


/* ---------- 9. Depois dos scripts de página: acessibilidade e pausa fora da tela ---------- */
function accessibility () {
  const drawer = $('#drawer'), burger = $('#burger');
  if (drawer && burger) {
    burger.setAttribute('aria-controls', 'drawer');
    const sync = () => {
      const open = document.body.classList.contains('menu-open');
      drawer.inert = !open; drawer.setAttribute('aria-hidden', String(!open));
      burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      $$('main, .rodape').forEach(el => { el.inert = open; });
    };
    sync();
    new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    document.addEventListener('keydown', e => {
      if (!document.body.classList.contains('menu-open')) return;
      if (e.key === 'Escape') { burger.focus(); return; }
      if (e.key === 'Tab') {
        const f = [burger, ...$$('a,button', drawer)], i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && (i === f.length - 1 || i < 0)) { e.preventDefault(); burger.focus(); }
      }
    });
    matchMedia('(min-width:1000px)').addEventListener('change', e => { if (e.matches && document.body.classList.contains('menu-open')) burger.click(); });
  }
  /* Abas com teclado (setas, Home, End). O painel de cada lista é
     ligado por id: #xrList → #xrPanel; #tabNav → .pane; ou aria-controls. */
  $$('[role="tablist"]').forEach((list, group) => {
    const tabs = $$('[role="tab"]', list);
    const panels = list.id === 'xrList' ? [$('#xrPanel')] : list.id === 'tabNav' ? $$('.pane') : [];
    function sync () {
      tabs.forEach((tab, i) => {
        tab.id ||= `tab-${group}-${i}`;
        const sel = tab.getAttribute('aria-selected') === 'true';
        tab.tabIndex = sel ? 0 : -1;
        const panel = panels.length === 1 ? panels[0] : panels[i];
        if (panel) { panel.id ||= `panel-${group}-${i}`; tab.setAttribute('aria-controls', panel.id); if (sel || panels.length > 1) panel.setAttribute('aria-labelledby', tab.id); }
      });
    }
    tabs.forEach(tab => tab.addEventListener('click', sync));
    list.addEventListener('keydown', e => {
      let i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      if (['ArrowRight', 'ArrowDown'].includes(e.key)) i = (i + 1) % tabs.length;
      else if (['ArrowLeft', 'ArrowUp'].includes(e.key)) i = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') i = 0;
      else if (e.key === 'End') i = tabs.length - 1;
      else return;
      e.preventDefault(); tabs[i].click(); tabs[i].focus();
    });
    sync();
  });
  $$('a').filter(a => !a.textContent.trim() && !a.getAttribute('aria-label') && a.href.includes('instagram'))
    .forEach(a => a.setAttribute('aria-label', 'Instagram do Dr. Pedro Sarzi'));
  /* Link que abre em nova aba avisa o leitor de tela (o /links/ já traz o aviso no HTML). */
  $$('a[target="_blank"]').forEach(a => {
    const rotulo = a.getAttribute('aria-label');
    if (rotulo) { if (!/nova aba/i.test(rotulo)) a.setAttribute('aria-label', rotulo + ' (abre em nova aba)'); return; }
    if (/nova aba/i.test(a.textContent)) return;
    a.insertAdjacentHTML('beforeend', '<span class="sr-only"> (abre em nova aba)</span>');
  });
}

function offscreen () {
  const cards = $$('.lab-card, .xray');
  if ('IntersectionObserver' in window && cards.length) {
    const io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('lab-offscreen', !e.isIntersecting)), { rootMargin: '100px' });
    cards.forEach(c => io.observe(c));
  }
  document.addEventListener('visibilitychange', () => document.documentElement.classList.toggle('lab-offscreen', document.hidden));
}

function depois () { accessibility(); offscreen(); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', depois);
else setTimeout(depois, 0);

})();
