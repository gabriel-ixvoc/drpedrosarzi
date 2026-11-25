/* ==========================================================================
   Pedro Sarzi · hub das condições (/condicoes/)
   A Fig. 1 da capa é a mão 3D (assets/mao-3d/mao-3d.min.js, módulo próprio, monta sozinha em [data-mao3d];
   docs/condicoes.md, "Mão 3D"): este arquivo não mexe nela.
   1. Passagem para a condição: ao abrir uma ficha de "Pelo que você sente" ou um link da capa ("Outras
      condições", o link da ficha da mão 3D e, sem WebGL, a lista dela), um véu carvão cobre a página
      (280 ms) antes de abrir a condição, que começa na capa carvão.
   2. [data-filtro-sinais] "Pelo que você sente": um sinal por vez (aria-pressed); tocar
      de novo no ativo volta a "Todas"; as fichas fora do sinal ficam hidden; o status
      diz quantas sobraram (e sobe até a borda de baixo da tela se estiver fora dela); o foco
      fica no botão. Sem JS: todas as fichas, sem filtro. Sem rolagem de lado em nenhuma tela.
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
  const SEL = '#hubCartoes a.hub-cartao, .hub-m3d__mais a, .hub-m3d a.m3d-ficha__link, .hub-m3d a.m3d-item';
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

/* ---------- 1c. "Outras condições": sem "·" pendurado ----------
   O separador fica no vão antes de cada item (CSS, posição absoluta, fora do fluxo); o primeiro item de
   cada linha ganha .hub-m3d__ini e o dele some. Esconder não muda a largura, então a quebra não muda. */
$$('.hub-m3d__mais-lista').forEach(ul => {
  const itens = $$(':scope > li', ul);
  const marca = () => itens.forEach((li, i) => li.classList.toggle('hub-m3d__ini', i > 0 && li.offsetTop > itens[i - 1].offsetTop + 2));
  marca();
  if ('ResizeObserver' in window) new ResizeObserver(marca).observe(ul);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(marca);
});

/* ---------- 2. Filtro pelo que você sente ---------- */
const filtro = $('[data-filtro-sinais]');
const lista = $('#hubCartoes');
if (filtro && lista) {
  const botoes = $$('button[data-sinal]', filtro);
  const fichas = $$(':scope > li', lista);
  const status = $('#hubStatus');
  const total = fichas.length;
  const nomeDe = b => {
    const n = $('.hub-sinal__nome, .hub-todas__nome', b);
    return (n ? n.textContent : b.textContent).replace(/­/g, '').trim();
  };
  const escolher = sinal => {
    botoes.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.sinal === sinal)));
    let n = 0;
    fichas.forEach(li => {
      const fica = sinal === 'todas' || (li.dataset.sinais || '').split(/\s+/).includes(sinal);
      const estava = !li.hidden;
      li.hidden = !fica;
      li.classList.toggle('hub-entra', fica && !estava);
      if (fica) n++;
    });
    if (status) {
      const b = botoes.find(x => x.dataset.sinal === sinal);
      status.textContent = sinal === 'todas'
        ? `Todas as ${total} condições.`
        : `${nomeDe(b)}: ${n} ${n === 1 ? 'condição' : 'condições'}.`;
    }
  };
  /* se o status ficou abaixo da tela (tela baixa), ele sobe até a borda de baixo: o resultado do toque
     fica à vista. Sem animação com movimento reduzido ou "Pausar animações". */
  const mostrarStatus = () => {
    if (!status) return;
    const r = status.getBoundingClientRect();
    if (r.bottom <= innerHeight - 8) return;
    const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('motion-paused');
    status.scrollIntoView({ block: 'nearest', behavior: calmo ? 'auto' : 'smooth' });
  };
  botoes.forEach(b => b.addEventListener('click', () => {
    const ativo = b.getAttribute('aria-pressed') === 'true';
    escolher(ativo && b.dataset.sinal !== 'todas' ? 'todas' : b.dataset.sinal);
    mostrarStatus();
  }));
  fichas.forEach(li => li.addEventListener('animationend', () => li.classList.remove('hub-entra')));
}
})();
