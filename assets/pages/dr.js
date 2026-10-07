/* ==========================================================================
   O médico (/dr/) · componentes da página
   Carregado depois de site.js (window.PS). Fio da trajetória (#fio) e
   relato do atendimento (#relato). Ganchos em docs/site.md.
   ========================================================================== */
(function () {
'use strict';
const { $, $$, clamp } = window.PS;
const PS = window.PS;
const parado = () => PS.RM || PS.motion.paused;

/* ---------- 1. Fio da trajetória ----------
   O fio vai do centro do primeiro nó ao do último (--fio-ini, --fio-alt).
   --fio (0 a 1) é o trecho costurado: acompanha uma linha a 58% da altura
   da tela; cada etapa acende (.on) quando o seu nó passa dessa linha.
   Movimento reduzido ou pausado: fio inteiro e todas as etapas acesas. */
(function fio () {
  const lista = $('#fio');
  if (!lista) return;
  const marcos = $$('.fio__marco', lista), nos = marcos.map(m => $('.fio__no', m));
  let ini = 0, alt = 0, tick = false;
  function mede () {
    const r = lista.getBoundingClientRect();
    const centro = n => { const b = n.getBoundingClientRect(); return b.top + b.height / 2 - r.top; };
    ini = centro(nos[0]); alt = centro(nos[nos.length - 1]) - ini;
    lista.style.setProperty('--fio-ini', ini.toFixed(1) + 'px');
    lista.style.setProperty('--fio-alt', alt.toFixed(1) + 'px');
  }
  function pinta () {
    tick = false;
    if (parado()) { lista.style.setProperty('--fio', 1); marcos.forEach(m => m.classList.add('on')); return; }
    const r = lista.getBoundingClientRect(), linha = innerHeight * .58;
    lista.style.setProperty('--fio', (alt > 0 ? clamp((linha - (r.top + ini)) / alt, 0, 1) : 1).toFixed(4));
    nos.forEach((n, i) => { const b = n.getBoundingClientRect(); marcos[i].classList.toggle('on', b.top + b.height / 2 <= linha + 1); });
  }
  lista.classList.add('fio--vivo');
  mede(); pinta();
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(pinta); } }, { passive: true });
  addEventListener('resize', () => { mede(); pinta(); }, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(() => { mede(); pinta(); }).observe(lista);
  document.addEventListener('motionchange', pinta);
})();

/* ---------- 2. Relato: três momentos da consulta ----------
   O passo que cruza o meio da tela fica aceso e troca a cena do quadro
   parado (.relato__cena[data-i]) e a legenda (#relatoLegenda). */
(function relato () {
  const raiz = $('#relato');
  if (!raiz) return;
  const passos = $$('.relato__passo', raiz), cenas = $$('.relato__cena', raiz), legenda = $('#relatoLegenda');
  let atual = 0;
  function set (i) {
    if (i < 0 || i === atual) return;
    atual = i;
    passos.forEach((p, k) => p.classList.toggle('on', k === i));
    cenas.forEach(c => c.classList.toggle('on', +c.dataset.i === i));
    if (legenda) legenda.textContent = passos[i].dataset.legenda || '';
  }
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) set(passos.indexOf(e.target)); }), { rootMargin: '-48% 0px -48% 0px' });
  passos.forEach(p => io.observe(p));
})();

})();
