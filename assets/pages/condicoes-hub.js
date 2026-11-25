/* ==========================================================================
   Pedro Sarzi · hub das condições (/condicoes/)
   A Fig. 1 da capa é a mão 3D (assets/mao-3d/mao-3d.min.js, módulo próprio, monta sozinha em [data-mao3d];
   docs/condicoes.md, "Mão 3D"): este arquivo não mexe nela.
   1. Passagem para a condição: ao abrir um dos dez cartões ou um link da capa (o link da ficha da mão 3D
      e, sem WebGL, a lista dela), um véu carvão cobre a página
      (280 ms) antes de abrir a condição, que começa na capa carvão.
   O carrossel dos cartões no celular usa os .pontos do site.js (seção 10).
   ========================================================================== */
(function () {
'use strict';
const PS = window.PS || {};
const $ = PS.$ || ((s, c) => (c || document).querySelector(s));
const $$ = PS.$$ || ((s, c) => Array.from((c || document).querySelectorAll(s)));

/* ---------- 0. Abertura da capa: tocou uma vez, sai ---------- */
$$('.hub-capa').forEach(capa => setTimeout(() => capa.classList.add('hub-capa--aberta'), 2200));

const raiz = document.documentElement;
const calmo = () => matchMedia('(prefers-reduced-motion: reduce)').matches || raiz.classList.contains('motion-paused');

/* ---------- 1. Passagem para a condição ----------
   Ctrl, Shift, botão do meio, movimento reduzido ou "Pausar animações": navegação normal, sem véu.
   Voltar pelo histórico tira o véu. Os links são lidos no clique (delegação): a mão 3D troca os links
   da lista por botões quando monta e mostra o link da ficha só depois da escolha. */
(function () {
  const SEL = '#hubCartoes a.hub-cartao, .hub-m3d a.m3d-ficha__link, .hub-m3d a.m3d-item';
  let veu = null, indo = false;
  const ir = a => { location.href = a.href; };
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest(SEL);
    if (!a) return;
    if (indo) { e.preventDefault(); return; }
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || calmo()) return;
    if (a.target && a.target !== '_self') return;
    e.preventDefault();
    indo = true;
    if (!veu) { veu = document.createElement('div'); veu.className = 'hub-veu'; veu.setAttribute('aria-hidden', 'true'); document.body.appendChild(veu); }
    void veu.offsetWidth;
    veu.classList.add('on');
    setTimeout(() => ir(a), 300);
  });
  addEventListener('pageshow', e => {
    if (!indo && !e.persisted) return;
    indo = false;
    if (veu) veu.classList.toggle('on', false);
  });
})();

/* ---------- 1b. Mão 3D: escolher na lista com o palco fora da tela ----------
   No celular e no tablet a lista fica abaixo do palco: ao escolher uma condição (botão da lista depois que
   a mão monta) com o palco inteiro fora da tela, a página sobe até ele, para a região acesa aparecer; a
   ficha fica logo abaixo. Sem animação com movimento reduzido ou "Pausar animações". */
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('.hub-m3d button.m3d-item');
  if (!b) return;
  const q = $('.hub-m3d .m3d-quadro');
  if (!q) return;
  const r = q.getBoundingClientRect();
  if (r.bottom > 0 && r.top < innerHeight) return;
  q.scrollIntoView({ block: 'start', behavior: calmo() ? 'auto' : 'smooth' });
});

})();
