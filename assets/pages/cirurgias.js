/* ==========================================================================
   Cirurgias (/cirurgias/) · interações da página
   Índice das cirurgias em abas: uma ficha por vez, setas/Home/End,
   endereço com a ficha aberta (#tunel-do-carpo) e âncoras (de outras
   páginas ou desta) que abrem a ficha certa.
   Sem JS: índice de âncoras e as oito fichas em sequência.
   ========================================================================== */
(function () {
  const { $, $$ } = window.PS || { $: (s, c = document) => c.querySelector(s), $$: (s, c = document) => [...c.querySelectorAll(s)] };
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const parado = () => RM || document.documentElement.classList.contains('motion-paused');

  const lista = $('#cirIndice');
  if (!lista) return;
  const abas = $$('.cir__item', lista);
  const fichas = abas.map(a => document.getElementById(a.getAttribute('href').slice(1)));
  let atual = -1;

  lista.setAttribute('role', 'tablist');
  lista.setAttribute('aria-orientation', 'vertical');
  abas.forEach((a, i) => {
    a.parentElement.setAttribute('role', 'presentation');
    a.setAttribute('role', 'tab');
    a.id = 'aba-' + fichas[i].id;
    a.setAttribute('aria-controls', fichas[i].id);
    fichas[i].setAttribute('role', 'tabpanel');
    fichas[i].setAttribute('aria-labelledby', a.id);
    fichas[i].tabIndex = -1;
  });

  function escolhe (i, { foco = false, endereco = true, rolar = false } = {}) {
    if (i < 0 || i >= abas.length) return;
    const mudou = atual >= 0 && i !== atual; /* na abertura, sem animação */
    atual = i;
    abas.forEach((a, k) => {
      const sel = k === i;
      a.setAttribute('aria-selected', String(sel));
      a.tabIndex = sel ? 0 : -1;
      fichas[k].hidden = !sel;
    });
    if (mudou && !parado()) {
      const f = fichas[i];
      f.classList.remove('entra'); void f.offsetWidth; f.classList.add('entra');
    }
    if (foco) abas[i].focus();
    if (endereco && history.replaceState) history.replaceState(null, '', '#' + fichas[i].id);
    if (rolar) {
      /* abaixo de 1100 px o índice fica acima da ficha: leva a ficha à tela se ela estiver fora */
      const r = fichas[i].getBoundingClientRect();
      if (r.top > innerHeight * .7 || r.top < 0) fichas[i].scrollIntoView({ block: 'start', behavior: parado() ? 'auto' : 'smooth' });
    }
  }

  abas.forEach((a, i) => {
    a.addEventListener('click', e => {
      e.preventDefault();
      escolhe(i, { rolar: !matchMedia('(min-width:1100px)').matches });
    });
    /* teclado tratado aqui (e não no site.js), para a aba não andar duas vezes */
    a.addEventListener('keydown', e => {
      let k = i;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') k = (i + 1) % abas.length;
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') k = (i - 1 + abas.length) % abas.length;
      else if (e.key === 'Home') k = 0;
      else if (e.key === 'End') k = abas.length - 1;
      else return;
      e.preventDefault(); e.stopPropagation();
      escolhe(k, { foco: true });
    });
  });

  /* Âncoras da página que apontam para uma ficha: abre a ficha antes de o site.js rolar até ela
     (fase de captura, antes da delegação). */
  const porId = id => fichas.findIndex(f => f.id === id);
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || lista.contains(a)) return;
    const i = porId(a.getAttribute('href').slice(1));
    if (i >= 0) escolhe(i, { endereco: false });
  }, true);
  addEventListener('hashchange', () => {
    const i = porId(decodeURIComponent(location.hash.slice(1)));
    if (i >= 0 && i !== atual) { escolhe(i, { endereco: false }); fichas[i].scrollIntoView({ block: 'start' }); }
  });

  let inicio = 0;
  try { const i = porId(decodeURIComponent(location.hash.slice(1))); if (i >= 0) inicio = i; } catch (e) { /* hash inválido */ }
  escolhe(inicio, { endereco: false });
})();
