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
  /* Altura do quadro preso com a legenda (--palco-h): o dr.css centra o quadro na altura da tela.
     Na mesma medida, os rótulos da Fig. 1 (#placaExplica): em tela baixa ou estreita o desenho sai
     menor que 1:1, e a letra (13 a 16,5 unidades) e a linha-guia crescem para o rótulo ficar com
     12,5 px na tela. Sem JS, ficam nas 13 unidades de sempre. */
  const palco = $('.relato__palco', raiz), placa = $('.relato__cenas .relato__placa', raiz);
  function mede () {
    raiz.style.setProperty('--palco-h', palco.offsetHeight + 'px');
    if (!placa || !placa.viewBox) return;
    const b = placa.getBoundingClientRect(), vb = placa.viewBox.baseVal;
    if (!b.width || !vb.width) return;
    const k = Math.min(b.width / vb.width, b.height / vb.height), pequeno = k < .76;
    placa.style.setProperty('--fig-rot-grande', pequeno ? 'none' : 'inline');
    placa.style.setProperty('--fig-rot-pequeno', pequeno ? 'inline' : 'none');
    placa.style.setProperty('--fig-rotulo-grande', clamp(12.5 / k, 13, 16.5).toFixed(1) + 'px');
    placa.style.setProperty('--fig-guia-grande', clamp(.9 / k, .7, 1.2).toFixed(2) + 'px');
    placa.style.setProperty('--fig-rotulo', clamp(12.5 / k, 19, 32).toFixed(1) + 'px');
    placa.style.setProperty('--fig-guia', clamp(.9 / k, 1.4, 2.4).toFixed(2) + 'px');
  }
  if (palco && 'ResizeObserver' in window) new ResizeObserver(mede).observe(palco);
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) set(passos.indexOf(e.target)); }), { rootMargin: '-48% 0px -48% 0px' });
  passos.forEach(p => io.observe(p));
})();

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
