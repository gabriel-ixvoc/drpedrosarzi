/* ==========================================================================
   /ortopedia/: mapa do corpo (#mapa-corpo)
   A arte orto-corpo leva um ponto por região (.corpo__ponto, em % da imagem);
   a lista .corpo__indice é a lista de abas (role=tablist no HTML; setas, Home e
   End pelo site.js) e cada .regiao é o painel da aba. Ponto e aba escolhem a
   mesma região; passar o mouse num ponto ou numa aba acende o ponto (.quase).
   Abre uma região pela URL: /ortopedia/?regiao=<slug>#mapa-corpo
   Sem JS: a lista e os pontos ficam ocultos (CSS) e as sete fichas aparecem
   uma embaixo da outra. Sem GSAP: o único movimento é o realce do ponto (CSS).
   ========================================================================== */
(function () {
  const { $, $$ } = window.PS;
  const sec = $('#mapa-corpo');
  if (!sec) return;

  const abas = $$('.corpo__aba', sec);
  const fichas = $$('.regiao', sec);
  const pontos = $$('.corpo__ponto', sec);
  if (!abas.length || abas.length !== fichas.length) return;

  const slugs = abas.map(a => a.dataset.regiao);
  const RM = () => window.PS.RM || (window.PS.motion && window.PS.motion.paused);

  fichas.forEach((f, i) => {
    f.setAttribute('role', 'tabpanel');
    f.setAttribute('aria-labelledby', abas[i].id);
    f.tabIndex = 0;
  });

  let atual = -1;
  function escolher (i, origem) {
    if (i < 0 || i >= abas.length) return;
    const mudou = i !== atual;
    atual = i;
    const slug = slugs[i];
    abas.forEach((a, k) => { const on = k === i; a.setAttribute('aria-selected', String(on)); a.tabIndex = on ? 0 : -1; });
    fichas.forEach((f, k) => { const on = k === i; f.hidden = !on; f.classList.toggle('on', on && mudou && origem !== 'inicio'); });
    pontos.forEach(p => p.classList.toggle('on', p.dataset.regiao === slug));
    /* toque num ponto no celular ou no tablet: se a ficha ficou fora da tela, rola até ela */
    if (origem === 'ponto' && matchMedia('(max-width:1099px)').matches) {
      const r = fichas[i].getBoundingClientRect();
      if (r.top > innerHeight - 160 || r.bottom < 0) fichas[i].scrollIntoView({ behavior: RM() ? 'auto' : 'smooth', block: 'nearest' });
    }
  }

  const quase = slug => pontos.forEach(p => p.classList.toggle('quase', p.dataset.regiao === slug));
  abas.forEach((aba, i) => {
    aba.addEventListener('click', () => escolher(i, 'aba'));
    aba.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') quase(aba.dataset.regiao); });
    aba.addEventListener('pointerleave', () => quase(null));
    aba.addEventListener('focus', () => quase(aba.dataset.regiao));
    aba.addEventListener('blur', () => quase(null));
  });
  pontos.forEach(p => {
    p.addEventListener('click', () => escolher(slugs.indexOf(p.dataset.regiao), 'ponto'));
    p.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') quase(p.dataset.regiao); });
    p.addEventListener('pointerleave', () => quase(null));
  });

  /* região inicial: ?regiao=<slug> ou a mão e o punho, o foco do Dr. Pedro */
  let ini = slugs.indexOf('punho-e-mao');
  try {
    const q = new URLSearchParams(location.search).get('regiao');
    if (q && slugs.includes(q)) ini = slugs.indexOf(q);
  } catch (e) { /* URL sem parâmetros */ }
  escolher(ini < 0 ? 0 : ini, 'inicio');
  sec.classList.add('corpo--pronto');
})();
