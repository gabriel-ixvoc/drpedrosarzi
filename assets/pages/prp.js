/* ==========================================================================
   PRP (/prp/) · perguntas frequentes
   Carregado depois de site.js (window.PS) e de pages/lab.js (Fig. 1 e Fig. 2).
   ========================================================================== */
(function () {
'use strict';
const { $, $$ } = window.PS;

/* Uma resposta aberta por vez (.faq-item.open); a primeira começa aberta.
   A altura anima pelo CSS (grid-template-rows). */
const items = $$('.faq-item');
if (!items.length) return;
$$('.faq-q').forEach(btn => btn.addEventListener('click', () => {
  const item = btn.closest('.faq-item'), wasOpen = item.classList.contains('open');
  $$('.faq-item.open').forEach(i => i.classList.remove('open'));
  if (!wasOpen) item.classList.add('open');
}));
items[0].classList.add('open');
items.forEach((item, i) => {
  const b = $('.faq-q', item), a = $('.faq-a', item);
  if (!b || !a) return;
  a.id = `faq-answer-${i}`; b.setAttribute('aria-controls', a.id);
  const sync = () => { const open = item.classList.contains('open'); b.setAttribute('aria-expanded', String(open)); a.inert = !open; a.setAttribute('aria-hidden', String(!open)); };
  new MutationObserver(sync).observe(item, { attributes: true, attributeFilter: ['class'] });
  sync();
});

})();
