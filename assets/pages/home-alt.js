/* Home: etapas da consulta (#steps). A navegação [data-consulta-ir] acompanha o
   passo [data-consulta-etapa] que ocupa mais o meio da tela. O clique numa etapa
   marca essa etapa na hora e trava o observador até a rolagem terminar
   (scrollend, ou 160 ms sem rolar; 800 ms se nada rolar), para a marca não
   pular para o passo vizinho no caminho. */
(() => {
  const section = document.querySelector('#steps');
  if (!section) return;
  const steps = [...section.querySelectorAll('[data-consulta-etapa]')];
  const buttons = [...section.querySelectorAll('[data-consulta-ir]')];
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const parado = () => RM.matches || document.documentElement.classList.contains('motion-paused');
  let atual = -1;
  const activate = (index) => {
    if (index === atual || index < 0) return;
    atual = index;
    steps.forEach((step, i) => step.classList.toggle('is-active', i === index));
    buttons.forEach((button, i) => {
      if (i === index) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
  };

  /* proporção visível de cada passo dentro da faixa do meio da tela */
  const ratios = new Map();
  let travado = false, timer = null;
  const escolhe = () => {
    if (travado) return;
    let melhor = -1, maior = 0;
    steps.forEach((step, i) => { const r = ratios.get(step) || 0; if (r > maior) { maior = r; melhor = i; } });
    if (melhor >= 0) activate(melhor);
  };
  const solta = () => {
    clearTimeout(timer);
    removeEventListener('scroll', aoRolar);
    removeEventListener('scrollend', solta);
    travado = false;
    escolhe();
  };
  function aoRolar () { clearTimeout(timer); timer = setTimeout(solta, 160); }

  buttons.forEach((button) => button.addEventListener('click', () => {
    const i = Number(button.dataset.consultaIr), step = steps[i];
    if (!step) return;
    activate(i);
    travado = true;
    clearTimeout(timer);
    removeEventListener('scroll', aoRolar);
    removeEventListener('scrollend', solta);
    addEventListener('scroll', aoRolar, { passive: true });
    if ('onscrollend' in window) addEventListener('scrollend', solta, { once: true });
    timer = setTimeout(solta, 800);
    step.scrollIntoView({ behavior: parado() ? 'auto' : 'smooth', block: 'center' });
  }));

  if ('IntersectionObserver' in window) {
    const limiares = Array.from({ length: 21 }, (_, k) => k / 20);
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => ratios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0));
      escolhe();
    }, { rootMargin: '-35% 0px -35% 0px', threshold: limiares });
    steps.forEach((step) => observer.observe(step));
  }
  activate(0);
})();
