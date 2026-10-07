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
    const [x, y] = pt(a, r + 13);
    nums += `<text class="gonio__num" x="${x}" y="${(+y + (a % 180 === 0 ? -9 : 0)).toFixed(2)}" text-anchor="middle" dominant-baseline="central">${a}</text>`;
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

function criarGonio (el, opts) {
  const o = Object.assign({}, el.dataset.gonioNumeros === 'false' ? Object.assign({}, GONIO_GRANDE, { numeros: false }) : GONIO_GRANDE, opts);
  el.innerHTML = gonioSVG(o);
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
})();

/* ---------- 3. Cabeçalho, página atual, rolagem ---------- */
(function header () {
  const hdr = $('#hdr'), fab = $('#fab'), rodape = $('.rodape');
  /* A barra de agendar (#fab) some enquanto outro botão "Agendar avaliação"
     da página está na tela: nunca dois iguais ao mesmo tempo. */
  const ctasVisiveis = new Set();
  if (fab && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) ctasVisiveis.add(e.target); else ctasVisiveis.delete(e.target); });
      syncFab();
    });
    const observar = () => $$('main .btn[data-agendar]').forEach(b => io.observe(b));
    observar();
    /* o resultado do questionário cria um botão novo */
    new MutationObserver(() => { ctasVisiveis.forEach(b => { if (!b.isConnected) ctasVisiveis.delete(b); }); observar(); })
      .observe($('main') || document.body, { childList: true, subtree: true });
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
    if (fab) fab.classList.toggle('show', scrollY > 700 && !ctasVisiveis.size && !(rodape && rodape.getBoundingClientRect().top < innerHeight));
  }
  function onScroll () {
    tick = false;
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    if (hdr) {
      hdr.classList.toggle('stuck', y > 12);
      hdr.classList.toggle('hide', !auto && y > 420 && y > last && !document.body.classList.contains('menu-open'));
    }
    syncFab();
    dial.set(max > 0 ? (y / max) * 180 : 0);
    last = y;
  }
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  onScroll();
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
    let anim = null, fechando = false;
    s.addEventListener('click', e => {
      if (RM || !d.animate) return;
      e.preventDefault();
      const ini = d.offsetHeight;
      if (anim) anim.cancel();
      fechando = d.open && !fechando;
      if (!fechando) d.open = true;
      const fim = fechando ? s.offsetHeight : d.offsetHeight;
      anim = d.animate({ height: [ini + 'px', fim + 'px'] }, { duration: 260, easing: 'cubic-bezier(.2,.7,.1,1)' });
      anim.onfinish = () => { anim = null; if (fechando) { d.open = false; fechando = false; } };
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
   aria-expanded) + .sinal__verso (inert enquanto fechado, .sinal__voltar).
   Uma ficha aberta por lista; Esc fecha; o foco vai para o verso e volta. */
(function fichasQueViram () {
  $$('.sinal').forEach(ficha => {
    const virar = $('.sinal__virar', ficha), voltar = $('.sinal__voltar', ficha);
    if (!virar || !voltar) return;
    function vira (aberta, foco) {
      const frente = $('.sinal__frente', ficha), verso = $('.sinal__verso', ficha);
      ficha.classList.toggle('virado', aberta);
      virar.setAttribute('aria-expanded', String(aberta));
      verso.inert = !aberta; frente.inert = aberta;
      if (foco) (aberta ? $('a, .sinal__voltar', verso) : virar).focus({ preventScroll: true });
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
   uma lista que vira carrossel no celular. O item ao centro marca o seu ponto;
   tocar num ponto centraliza o item. */
(function pontos () {
  $$('.pontos').forEach(el => {
    const lista = el.previousElementSibling;
    if (!lista) return;
    const itens = Array.from(lista.children);
    el.innerHTML = itens.map((x, i) => `<button type="button" tabindex="-1" data-i="${i}"></button>`).join('');
    const bs = $$('button', el);
    const marca = i => bs.forEach((b, k) => b.classList.toggle('on', k === i));
    bs.forEach(b => b.addEventListener('click', () => {
      const f = itens[+b.dataset.i], fr = f.getBoundingClientRect(), lr = lista.getBoundingClientRect();
      lista.scrollBy({ left: (fr.left + fr.width / 2) - (lr.left + lista.clientWidth / 2), behavior: RM || paused ? 'auto' : 'smooth' });
    }));
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) marca(itens.indexOf(e.target)); }), { root: lista, threshold: .6 });
      itens.forEach(f => io.observe(f));
    }
    marca(0);
  });
})();

/* Onde atende (três locais): marca o dia de hoje na agenda (#semana) e escreve a
   frase "Hoje" (#semanaAgora); o nome de cada local (.local__filtro) apaga na
   agenda os turnos dos outros locais e escolhe o local do mapa; o mapa do Google
   só carrega quando a pessoa toca em "Mostrar o mapa aqui" (#mapaBtn).
   Dados de cada local no próprio HTML: data-local, data-mapa (busca) e data-nome. */
(function ondeAtende () {
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
        return `<b>${onde}</b>, das ${hora}`;
      });
      agora.innerHTML = hoje.dataset.agora || ('Hoje: ' + turnos.join('; ') + '.');
      agora.hidden = false;
    }
  }

  const btn = $('#mapaBtn'), quadro = $('#mapa');
  const locais = $$('.local[data-local]');
  let escolhido = locais[0];
  const mostrarMapa = () => {
    const busca = escolhido ? escolhido.dataset.mapa : 'Clínica Fares, Rua Antônio Agú, 630, Osasco SP';
    const nome = escolhido ? escolhido.dataset.nome : 'Clínica Fares';
    const f = document.createElement('iframe');
    f.src = 'https://www.google.com/maps?q=' + encodeURIComponent(busca) + '&output=embed';
    f.title = 'Mapa: ' + nome;
    f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade';
    quadro.textContent = ''; quadro.append(f);
    quadro.dataset.carregado = '';
  };
  if (btn && quadro) btn.addEventListener('click', mostrarMapa);

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
      escolhido = ligar ? local : locais[0];
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
        if (e.shiftKey && i <= 0) { e.preventDefault(); f.at(-1).focus(); }
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
