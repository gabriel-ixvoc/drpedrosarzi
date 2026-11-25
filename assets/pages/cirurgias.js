/* ==========================================================================
   Cirurgias (/cirurgias/) · interações da página
   1. Índice das cirurgias em abas: uma ficha por vez, setas/Home/End,
      endereço com a ficha aberta (#tunel-do-carpo) e âncoras da página
      (legenda da Fig. 1) que abrem a ficha certa.
   2. Fig. 1: o número da legenda acende o ponto na mão (e vice-versa).
   3. O caminho da cirurgia: régua de sete marcos com painel a partir de
      600 px; abaixo disso, a lista com sutura fica como está.
   4. Movimento (assets/movimento.js): um só momento, a abertura da Fig. 1 na capa
      (a mão se desenha e as oito marcas acendem em sequência). Fichas e caminho só trocam.
   Sem JS: índice de âncoras, as oito fichas em sequência e a lista do caminho.
   ========================================================================== */
(function () {
  const { $, $$ } = window.PS || { $: (s, c = document) => c.querySelector(s), $$: (s, c = document) => [...c.querySelectorAll(s)] };
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const parado = () => RM || document.documentElement.classList.contains('motion-paused');

  /* ---------- 1. Índice das cirurgias ---------- */
  const lista = $('#cirIndice');
  if (lista) {
    const abas = $$('.cir__item', lista);
    const fichas = abas.map(a => document.getElementById(a.getAttribute('href').slice(1)));
    const marcas = $$('.cir-marca');
    const legenda = $$('.cir-capa__legenda a');
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
      marcas.forEach((m, k) => m.classList.toggle('is-on', k === i));
      legenda.forEach((l, k) => l.classList.toggle('is-on', k === i));
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

    /* Âncoras da página que apontam para uma ficha (legenda da Fig. 1, links externos com #):
       abre a ficha antes de o site.js rolar até ela (fase de captura, antes da delegação). */
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

    /* Fig. 1: passar pela legenda acende o ponto na mão */
    legenda.forEach((l, k) => {
      const liga = on => marcas[k] && marcas[k].classList.toggle('is-on', on || k === atual);
      l.addEventListener('mouseenter', () => liga(true));
      l.addEventListener('mouseleave', () => liga(false));
      l.addEventListener('focus', () => liga(true));
      l.addEventListener('blur', () => liga(false));
    });

    let inicio = 0;
    try { const i = porId(decodeURIComponent(location.hash.slice(1))); if (i >= 0) inicio = i; } catch (e) { /* hash inválido */ }
    escolhe(inicio, { endereco: false });
    /* na abertura, nenhum ponto da capa fica aceso (só depois de escolher) */
    if (!location.hash) { marcas.forEach(m => m.classList.remove('is-on')); legenda.forEach(l => l.classList.remove('is-on')); }
  }

  /* ---------- 3. O caminho da cirurgia ---------- */
  const ol = $('#caminhoLista');
  if (ol) {
    const marcos = $$('.caminho__marco', ol);
    const corpos = $$('.caminho__corpo', ol);
    const nav = $('.caminho__nav');
    const setas = $$('.caminho__seta', nav);
    const status = $('.caminho__status', nav);
    const mq = matchMedia('(min-width:600px)');
    let atual = 0, abas = false;

    marcos.forEach((b, i) => {
      b.id = 'etapa-aba-' + (i + 1);
      corpos[i].id = 'etapa-cir-' + (i + 1);
    });

    function escolhe (i, foco, anima = true) {
      atual = Math.max(0, Math.min(marcos.length - 1, i));
      marcos.forEach((b, k) => {
        const sel = k === atual;
        b.setAttribute('aria-selected', String(sel));
        b.tabIndex = sel ? 0 : -1;
        b.classList.toggle('feito', k < atual);
        /* fora do painel, a etapa fica invisível mas ocupa a célula: o painel tem a altura da mais longa */
        corpos[k].classList.toggle('is-fora', !sel);
        corpos[k].inert = !sel;
        if (sel) corpos[k].removeAttribute('aria-hidden'); else corpos[k].setAttribute('aria-hidden', 'true');
      });
      ol.style.setProperty('--prog', String(atual / (marcos.length - 1)));
      if (anima && !parado()) { const c = corpos[atual]; c.classList.remove('entra'); void c.offsetWidth; c.classList.add('entra'); }
      setas[0].disabled = atual === 0;
      setas[1].disabled = atual === marcos.length - 1;
      status.textContent = `Etapa ${atual + 1} de ${marcos.length}`;
      if (foco) marcos[atual].focus();
    }

    function modo () {
      abas = mq.matches;
      ol.classList.toggle('is-abas', abas);
      nav.hidden = !abas;
      if (abas) {
        ol.setAttribute('role', 'tablist');
        ol.setAttribute('aria-label', 'Etapas do caminho da cirurgia');
        marcos.forEach((b, i) => {
          b.hidden = false;
          b.parentElement.setAttribute('role', 'presentation');
          b.setAttribute('role', 'tab');
          b.setAttribute('aria-controls', corpos[i].id);
          corpos[i].setAttribute('role', 'tabpanel');
          corpos[i].setAttribute('aria-labelledby', b.id);
        });
        escolhe(atual, false, false);
      } else {
        ol.removeAttribute('role'); ol.removeAttribute('aria-label');
        ol.style.removeProperty('--prog');
        marcos.forEach((b, i) => {
          b.hidden = true;
          b.parentElement.removeAttribute('role');
          ['role', 'aria-controls', 'aria-selected'].forEach(n => b.removeAttribute(n));
          ['role', 'aria-labelledby'].forEach(n => corpos[i].removeAttribute(n));
          corpos[i].classList.remove('entra', 'is-fora');
          corpos[i].inert = false;
          corpos[i].removeAttribute('aria-hidden');
        });
      }
    }

    marcos.forEach((b, i) => {
      b.addEventListener('click', () => escolhe(i));
      b.addEventListener('keydown', e => {
        let k = i;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') k = Math.min(i + 1, marcos.length - 1);
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') k = Math.max(i - 1, 0);
        else if (e.key === 'Home') k = 0;
        else if (e.key === 'End') k = marcos.length - 1;
        else return;
        e.preventDefault(); e.stopPropagation();
        escolhe(k, true);
      });
    });
    setas.forEach(s => s.addEventListener('click', () => {
      escolhe(atual + Number(s.dataset.dir));
      /* a seta que chegou ao fim fica desabilitada: o foco passa para a outra */
      if (s.disabled) setas.find(o => o !== s).focus();
    }));

    modo();
    mq.addEventListener('change', modo);
  }

  /* ---------- 4. Movimento (assets/movimento.js, docs/site.md "Movimento (GSAP)") ----------
     Momento-assinatura da página, o único: a abertura da Fig. 1 (data-mov="abertura"), no ritmo do hub
     das condições. O contorno da mão se desenha (1,2 s) e, perto do fim do traço, as oito marcas acendem
     em sequência (50 ms entre uma e outra), cada uma junto com a linha dela na legenda; a legenda da
     figura vem por último. Uma vez, ao entrar na tela (abaixo de 900 px a placa fica abaixo da dobra);
     se a página abriu abaixo dela, fica pronta sem tocar. Durações pelos tokens do PSMov (celular x .75,
     tablet x .88). Sem GSAP, com movimento reduzido ou "Pausar animações": a capa fica pronta, parada. */
  function movimento ({ gsap, ScrollTrigger, mm }) {
    const M = window.PSMov, T = M.tokens;
    const fig = $('.cir-capa__figura[data-mov]');
    if (!fig) return;
    const feito = () => { fig.classList.add('mov-feito'); fig.setAttribute('data-mov-feito', ''); };
    if (parado()) { feito(); return; }
    mm.add({ celular: '(max-width:599px)', tablet: '(min-width:600px) and (max-width:1099px)', computador: '(min-width:1100px)' }, ctx => {
      if (fig.hasAttribute('data-mov-feito')) return;
      if (fig.getBoundingClientRect().bottom < 0) { feito(); return; }
      const c = ctx.conditions;
      const f = c.celular ? T.fator.celular : c.tablet ? T.fator.tablet : 1;
      const traco = $('.cir-capa__mao > use', fig);
      const marcas = $$('.cir-marca', fig);
      const linhas = $$('.cir-capa__legenda > li', fig);
      const cap = $(':scope > .legenda', fig);
      const passo = .05;
      const tl = gsap.timeline({ paused: true, onComplete: () => {
        feito();
        gsap.set([...marcas, ...linhas, cap].filter(Boolean), { clearProps: 'opacity,transform' });
      } });
      const fimTraco = .12 + T.dur.longa * f;
      if (traco) tl.add(M.desenhar(traco, { duracao: T.dur.longa * f }), .12);
      const tMarcas = fimTraco - .35;
      marcas.forEach((m, i) => {
        const no = $('.cir-marca__no', m);
        const o = no ? no.getAttribute('cx') + ' ' + no.getAttribute('cy') : '0 0';
        tl.fromTo(m, { opacity: 0, scale: .6, svgOrigin: o },
          { opacity: 1, scale: 1, svgOrigin: o, duration: T.dur.curta * f, ease: T.ease }, tMarcas + i * passo);
        if (linhas[i]) tl.fromTo(linhas[i], { opacity: 0, y: 6 },
          { opacity: 1, y: 0, duration: T.dur.curta * f, ease: T.ease }, tMarcas + i * passo);
      });
      if (cap) tl.fromTo(cap, { opacity: 0 }, { opacity: 1, duration: T.dur.curta * f, ease: T.ease }, tMarcas + marcas.length * passo);
      ScrollTrigger.create({
        trigger: fig, start: fig.getAttribute('data-mov-inicio') || T.inicio, once: true,
        onEnter: () => { if (parado()) tl.progress(1); else tl.play(); }
      });
      /* "Pausar animações": o desenho em curso termina e fica parado */
      const parar = () => { if (parado() && !fig.hasAttribute('data-mov-feito')) tl.progress(1); };
      document.addEventListener('motionchange', parar);
      return () => document.removeEventListener('motionchange', parar);
    });
  }
  /* o movimento.js vem depois deste arquivo (defer): espera os dois rodarem */
  document.addEventListener('DOMContentLoaded', () => {
    if (window.PSMov) window.PSMov.pronto.then(r => { if (r) movimento(r); });
  });
})();
