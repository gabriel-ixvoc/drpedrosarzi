/* ==========================================================================
   PRP (/prp/) · perguntas frequentes
   Carregado depois de site.js (window.PS) e de pages/lab.js (Fig. 1 e Fig. 2).
   ========================================================================== */
(function () {
'use strict';
const { $, $$ } = window.PS;

/* Uma resposta aberta por vez (.faq-item.open). A primeira já vem aberta no HTML
   (assim a página não muda de altura depois da carga e /prp/#onde para no lugar);
   aqui só se sincroniza o ARIA. A altura anima pelo CSS (grid-template-rows, 260 ms). */
const items = $$('.faq-item');
if (!items.length) return;
const RM = matchMedia('(prefers-reduced-motion: reduce)');
const hdr = $('#hdr');

/* A pergunta tocada não sai do lugar: quando a de cima fecha, a página rola junto,
   quadro a quadro, durante a transição (medindo o desvio a cada quadro). No fim, se o
   cabeçalho voltou por cima dela ou se a resposta passou do pé da tela, ajusta. */
let segue = 0;
function manter(btn, item, topo) {
  cancelAnimationFrame(segue);
  const corrige = () => { const d = btn.getBoundingClientRect().top - topo; if (Math.abs(d) >= 1) scrollBy({ top: d, behavior: 'instant' }); };
  const fim = () => {
    const r = btn.getBoundingClientRect(), h = hdr ? Math.max(0, hdr.getBoundingClientRect().bottom) : 0;
    if (r.top < h + 8) scrollBy({ top: r.top - h - 16, behavior: 'instant' });
    else if (item.classList.contains('open')) {
      const a = $('.faq-a', item).getBoundingClientRect(), pe = innerHeight - (document.documentElement.classList.contains('fab-visivel') ? 72 : 16);
      if (a.bottom > pe) scrollBy({ top: Math.min(a.bottom - pe, r.top - h - 16), behavior: RM.matches ? 'instant' : 'smooth' });
    }
  };
  if (RM.matches) { corrige(); fim(); return; }
  const t0 = performance.now();
  const passo = now => { corrige(); if (now - t0 < 320) segue = requestAnimationFrame(passo); else fim(); };
  segue = requestAnimationFrame(passo);
}

$$('.faq-q').forEach(btn => btn.addEventListener('click', () => {
  const item = btn.closest('.faq-item'), wasOpen = item.classList.contains('open');
  const topo = btn.getBoundingClientRect().top; /* medido antes de a de cima fechar */
  $$('.faq-item.open').forEach(i => i.classList.remove('open'));
  if (!wasOpen) item.classList.add('open');
  if (!wasOpen) manter(btn, item, topo);
}));
if (!$('.faq-item.open')) items[0].classList.add('open');
items.forEach((item, i) => {
  const b = $('.faq-q', item), a = $('.faq-a', item);
  if (!b || !a) return;
  a.id = `faq-answer-${i}`; b.setAttribute('aria-controls', a.id);
  const sync = () => { const open = item.classList.contains('open'); b.setAttribute('aria-expanded', String(open)); a.inert = !open; a.setAttribute('aria-hidden', String(!open)); };
  new MutationObserver(sync).observe(item, { attributes: true, attributeFilter: ['class'] });
  sync();
});

})();
