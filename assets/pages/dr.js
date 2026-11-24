/* ==========================================================================
   O médico (/dr/) · componentes da página
   Carregado depois de site.js (window.PS). Fio da trajetória (#fio) e vão das áreas (#areas).
   Ganchos em docs/site.md.
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

/* ---------- 2. Como ele atende ----------
   Desde 24/11/2026 é um tríptico estático (só CSS, em dr.css seção 3): sem JS. */

/* ---------- 3. Áreas: a mão pequena do verso só onde há vão ----------
   .sinal__vao ocupa o espaço que sobra entre o texto e os links (flex 1 1 0:
   nunca aumenta a ficha). O desenho de dentro tem a mesma altura em todas as
   fichas (--vao-h: o menor vão, até 180 px). Se o menor vão tiver menos de
   90 px, a mão sai de todas (.sinal__vao--curto): nada de rabisco espremido. */
(function vao () {
  const lista = $('#areas .sinais'), vaos = $$('#areas .sinal__vao');
  if (!lista || !vaos.length || !('ResizeObserver' in window)) return;
  const ro = new ResizeObserver(() => {
    const menor = Math.min(...vaos.map(v => v.getBoundingClientRect().height));
    const curto = menor < 90;
    vaos.forEach(v => v.classList.toggle('sinal__vao--curto', curto));
    lista.style.setProperty('--vao-h', curto ? '0px' : Math.min(menor, 180).toFixed(0) + 'px');
  });
  vaos.forEach(v => ro.observe(v));
})();

})();
