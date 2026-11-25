/* ==========================================================================
   Pedro Sarzi · /infiltracoes/
   Seletor das articulações (#art, "Onde se faz"): a aba mostra o painel dela (.on).
   Setas, Home e End vêm do site.js ([role=tablist]); aqui só a troca.
   O endereço com #joelho, #ombro, #quadril, #tornozelo ou #mao-e-punho abre a articulação.
   ========================================================================== */
(function () {
'use strict';
const box = document.getElementById('art');
if (!box) return;
const abas = [...box.querySelectorAll('[role="tab"]')];
const paineis = abas.map(a => document.getElementById(a.getAttribute('aria-controls')));

function escolhe (i) {
  abas.forEach((a, k) => {
    const sel = k === i;
    a.setAttribute('aria-selected', String(sel));
    a.tabIndex = sel ? 0 : -1;
    paineis[k].classList.toggle('on', sel);
  });
}
abas.forEach((a, i) => a.addEventListener('click', () => {
  if (a.getAttribute('aria-selected') !== 'true') escolhe(i);
}));

/* #articulacao no endereço: escolhe a aba e leva a seção à tela */
function peloEndereco () {
  const i = paineis.findIndex(p => p && '#' + p.id === location.hash);
  if (i < 0) return;
  escolhe(i);
  box.scrollIntoView({ block: 'start' });
}
box.classList.add('art--pronto');
escolhe(Math.max(0, abas.findIndex(a => a.getAttribute('aria-selected') === 'true')));
peloEndereco();
addEventListener('hashchange', peloEndereco);
})();
