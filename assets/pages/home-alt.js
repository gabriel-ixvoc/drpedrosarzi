/* Home (versão 2): etapas da consulta (navegação fixa sincronizada com a etapa visível). */
(() => {
  const section = document.querySelector('#steps');
  if (!section) return;
  const steps = [...section.querySelectorAll('[data-consulta-etapa]')];
  const buttons = [...section.querySelectorAll('[data-consulta-ir]')];
  const activate = (index) => {
    steps.forEach((step, i) => step.classList.toggle('is-active', i === index));
    buttons.forEach((button, i) => {
      if (i === index) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
  };
  buttons.forEach((button) => button.addEventListener('click', () => {
    const step = steps[Number(button.dataset.consultaIr)];
    if (step) step.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  }));
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      const active = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (active) activate(steps.indexOf(active.target));
    }, { rootMargin: '-35% 0px -35% 0px', threshold: [0, .25, .5, .75] });
    steps.forEach((step) => observer.observe(step));
  }
  activate(0);
})();
