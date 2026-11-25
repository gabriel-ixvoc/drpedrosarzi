/* ==========================================================================
   /ortopedia/: mapa do corpo (Fig. 2)
   A lista de regiões vira abas (role=tablist; setas, Home e End pelo site.js);
   as marcas da figura e os pontos de toque escolhem a mesma região. Abre uma
   região pela URL: /ortopedia/?regiao=<slug>#mapa-corpo
   Sem JS: a lista e os pontos ficam ocultos (CSS) e as sete fichas aparecem
   uma embaixo da outra.
   ========================================================================== */
(function () {
  const { $, $$ } = window.PS;
  const sec = $('#mapa-corpo');
  if (!sec) return;

  const lista = $('.corpo__indice', sec);
  const abas = $$('.corpo__aba', sec);
  const fichas = $$('.regiao', sec);
  const pontos = $$('.corpo__ponto', sec);
  const desenhos = $$('[data-regiao]', $('.corpo__svg', sec));
  if (!lista || !abas.length || abas.length !== fichas.length) return;

  const slugs = abas.map(a => a.dataset.regiao);
  const RM = () => window.PS.RM || window.PS.motion.paused;

  lista.setAttribute('role', 'tablist');
  abas.forEach((aba, i) => {
    aba.setAttribute('role', 'tab');
    const f = fichas[i];
    f.setAttribute('role', 'tabpanel');
    f.setAttribute('aria-labelledby', aba.id);
    f.tabIndex = 0;
  });

  let atual = -1;
  function escolher (i, origem) {
    if (i < 0 || i >= abas.length) return;
    const mudou = i !== atual;
    atual = i;
    const slug = slugs[i];
    abas.forEach((a, k) => { const on = k === i; a.setAttribute('aria-selected', String(on)); a.tabIndex = on ? 0 : -1; a.classList.toggle('on', on); });
    fichas.forEach((f, k) => { const on = k === i; f.hidden = !on; f.classList.toggle('on', on && mudou && origem !== 'inicio'); });
    pontos.forEach(p => p.classList.toggle('on', p.dataset.regiao === slug));
    desenhos.forEach(d => d.classList.toggle('on', d.dataset.regiao === slug));
    /* escolha feita pela pessoa: a marca da região solta uma onda (CSS; parada com movimento reduzido) */
    if (mudou && origem !== 'inicio') {
      const m = $('.corpo__marca[data-regiao="' + slug + '"]', sec);
      if (m) { m.classList.remove('pulso'); void m.getBoundingClientRect(); m.classList.add('pulso'); }
    }
    /* toque numa marca da figura no celular ou no tablet: se a ficha ficou fora da tela,
       rola até o nome dela (sem esconder o cabeçalho de propósito) */
    if (origem === 'ponto' && matchMedia('(max-width:1099px)').matches) {
      const nome = $('.regiao__nome', fichas[i]);
      const r = nome.getBoundingClientRect();
      if (r.top > innerHeight - 120 || r.bottom < 0) nome.scrollIntoView({ behavior: RM() ? 'auto' : 'smooth', block: 'center' });
    }
  }

  abas.forEach((aba, i) => aba.addEventListener('click', () => escolher(i, 'aba')));
  /* passar o cursor numa aba acende a região na figura (como nos pontos), sem trocar a ficha */
  const quase = slug => desenhos.forEach(d => d.classList.toggle('quase', d.dataset.regiao === slug));
  abas.forEach(aba => {
    aba.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') quase(aba.dataset.regiao); });
    aba.addEventListener('pointerleave', () => quase(null));
  });
  pontos.forEach(p => {
    p.addEventListener('click', () => escolher(slugs.indexOf(p.dataset.regiao), 'ponto'));
    /* passar o cursor acende a região na figura, sem trocar a ficha */
    p.addEventListener('pointerenter', () => desenhos.forEach(d => d.classList.toggle('quase', d.dataset.regiao === p.dataset.regiao)));
    p.addEventListener('pointerleave', () => desenhos.forEach(d => d.classList.remove('quase')));
  });

  /* rótulos e regiões desenhados também escolhem (só ponteiro; o teclado usa a lista) */
  $$('.corpo__rot, .corpo__zona', sec).forEach(el => el.addEventListener('click', () => escolher(slugs.indexOf(el.dataset.regiao), 'ponto')));

  /* região inicial: ?regiao=<slug> ou a mão e o punho, o foco do Dr. Pedro */
  let ini = slugs.indexOf('punho-e-mao');
  try {
    const q = new URLSearchParams(location.search).get('regiao');
    if (q && slugs.includes(q)) ini = slugs.indexOf(q);
  } catch (e) { /* URL sem parâmetros */ }
  escolher(ini < 0 ? 0 : ini, 'inicio');
  sec.classList.add('corpo--pronto');
})();

/* ==========================================================================
   Movimento da página (assets/movimento.js, docs/site.md "Movimento (GSAP)")
   Momento-assinatura: a Fig. 2 (data-mov="mapa") se desenha uma vez, em traço
   de gravura: o eixo desce, o contorno corre inteiro de uma vez, o chão assenta, as
   regiões acendem e as sete marcas acendem de cima para baixo junto com os
   nomes (1,4 s no total no computador). Depois, a régua de "Opções de
   tratamento" (menos → mais invasivo) preenche com a rolagem (scrub; no
   celular, a sutura entre os grupos se fecha a partir do eixo).
   Sem GSAP, com movimento reduzido ou com "Pausar animações": tudo no estado
   final, parado. O movimento.js é carregado depois deste arquivo: por isso a
   montagem espera o DOMContentLoaded (todos os scripts defer já rodaram).
   ========================================================================== */
document.addEventListener('DOMContentLoaded', function () {
  const M = window.PSMov;
  if (!M || !window.PS) return;
  const { $, $$ } = window.PS;
  const pausado = () => document.documentElement.classList.contains('motion-paused');
  const FAIXAS = {
    celular: '(max-width: 599px)',
    tablet: '(min-width: 600px) and (max-width: 1099px)',
    computador: '(min-width: 1100px)',
    reduzido: '(prefers-reduced-motion: reduce)'
  };

  M.pronto.then(r => {
    if (!r) return;
    const { gsap, ScrollTrigger, mm } = r;
    const T = M.tokens;

    /* ---------- Fig. 2: o mapa do corpo se desenha ---------- */
    const placa = $('.corpo__placa[data-mov="mapa"]');
    const svg = placa && $('.corpo__svg', placa);
    if (svg) {
      const feito = () => { placa.classList.add('mov-feito'); placa.setAttribute('data-mov-feito', ''); };
      /* marcas em ordem de altura no corpo (ombro, coluna, cotovelo, quadril, punho, joelho, pé) */
      const yDe = g => { const m = /translate\(\s*[-\d.]+[\s,]+([-\d.]+)/.exec(g.getAttribute('transform') || ''); return m ? +m[1] : 0; };
      const marcas = $$('.corpo__marca', svg).sort((a, b) => yDe(a) - yDe(b));
      const rotDe = slug => $('.corpo__rot[data-regiao="' + slug + '"]', svg);

      mm.add(FAIXAS, ctx => {
        const c = ctx.conditions;
        if (c.reduzido || placa.hasAttribute('data-mov-feito')) return;
        if (placa.getBoundingClientRect().bottom < 0) { feito(); return; }   /* abriu abaixo dela */
        const k = c.celular ? T.fator.celular : c.tablet ? T.fator.tablet : 1;
        const tl = gsap.timeline({ paused: true, defaults: { ease: T.ease }, onComplete: feito });

        /* sequência curta (1,4 s no computador; x0,88 no tablet, x0,75 no celular): o mapa já chega
           com os nomes antes de a pessoa rolar adiante. Traço de 0,6 s, marcas e rótulos juntos, a 60 ms um do outro */
        const D = T.dur.curta * k;
        /* o eixo desce da cabeça ao chão enquanto o contorno corre */
        tl.fromTo($('.corpo__eixo', svg), { opacity: 1, scaleY: 0, transformOrigin: '50% 0%' },
          { scaleY: 1, duration: D, ease: T.easeTraco, clearProps: 'transform' }, 0);
        const contorno = $$('.corpo__contorno > *', svg);
        tl.add(M.desenhar(contorno, { duracao: D, escalonar: 0 }), 0);   /* cabeça e as duas metades juntas */
        /* o papel dentro do contorno só tinge depois do traço (antes, a silhueta apareceria sem linha) */
        tl.fromTo(contorno, { fillOpacity: 0 }, { fillOpacity: 1, duration: D, clearProps: 'fillOpacity' }, .4 * k);
        tl.fromTo($('.corpo__chao', svg), { opacity: 0, scaleX: .3, transformOrigin: '50% 50%' },
          { opacity: 1, scaleX: 1, duration: D, clearProps: 'transform' }, .3 * k);
        /* regiões: só a luz (a do punho tem rotate no atributo transform, que o respiro do PSMov.hachura apagaria) */
        tl.fromTo($$('.corpo__zona', svg), { opacity: 0 }, { opacity: 1, duration: D, stagger: .03 }, .35 * k);

        /* as marcas acendem de cima para baixo, cada uma com o seu nome ao mesmo tempo; o fio corre até o nome */
        const t0 = .44 * k, passo = .06, Dm = .5 * k;
        marcas.forEach((g, i) => {
          const t = t0 + i * passo;
          const dentro = $('.corpo__marca-in', g), onda = $('.onda', g), miolo = $('.miolo', g);
          tl.fromTo(dentro, { opacity: 0, scale: .4, transformOrigin: '50% 50%' },
            { opacity: 1, scale: 1, duration: Dm, clearProps: 'transform' }, t);
          tl.fromTo(onda, { opacity: .7, scale: 1, transformOrigin: '50% 50%' },
            { opacity: 0, scale: 2.6, duration: Dm, ease: T.easeTraco, clearProps: 'opacity,transform' }, t);
          /* o miolo pisca ao acender; o da região escolhida fica aceso (CSS .on) */
          if (!g.classList.contains('on')) tl.fromTo(miolo, { opacity: 1 }, { opacity: 0, duration: Dm * .8, clearProps: 'opacity' }, t + .1 * k);
          const rot = rotDe(g.dataset.regiao);
          if (rot) {
            tl.add(M.desenhar($('line', rot), { duracao: Dm }), t);
            tl.fromTo($('text', rot), { opacity: 0 }, { opacity: 1, duration: Dm }, t);
          }
        });

        ScrollTrigger.create({
          trigger: placa, start: c.celular ? 'top 78%' : 'top 70%', once: true,
          onEnter: () => { if (pausado()) tl.progress(1); else tl.play(); }
        });
        const parar = () => { if (pausado() && tl.isActive()) tl.progress(1); };
        document.addEventListener('motionchange', parar);
        return () => document.removeEventListener('motionchange', parar);
      });
    }

    /* ---------- Opções de tratamento: a régua preenche com a rolagem ---------- */
    const trat = $('#tratamento');
    const grade = trat && $('.trat__grade', trat);
    const prog = grade && $('.trat__progresso', grade);
    const grupos = grade ? $$('.trat__grupo', grade) : [];
    if (prog && grupos.length) {
      const ALC = 'trat__grupo--alcancado';
      const parado = () => trat.classList.toggle('trat--parado', pausado());
      document.addEventListener('motionchange', parado);
      parado();

      mm.add(FAIXAS, ctx => {
        const c = ctx.conditions;
        if (c.reduzido) return;
        trat.classList.add('trat--vivo');
        let limpar = () => {};
        /* tablet e computador: a régua se tinge da esquerda para a direita (clip-path, sem deformar as marcas) */
        const regua = c.celular ? null : gsap.fromTo(prog, { clipPath: 'inset(0 100% 0 0)' }, {
          clipPath: 'inset(0 0% 0 0)', ease: 'none',
          scrollTrigger: { trigger: grade, start: 'top 85%', end: c.tablet ? 'bottom 75%' : 'top 35%', scrub: .6 }
        });
        if (regua) {
          /* computador: os três grupos na mesma linha; o marco acende quando a régua passa por ele.
             Tablet (grupos em duas linhas): em ordem, no começo, perto da metade e perto do fim da régua */
          let limiares = [];
          const n = grupos.length;
          const medir = () => {
            const L = grade.clientWidth || 1;
            limiares = grupos.map((g, i) => c.computador ? g.offsetLeft / L : (n > 1 ? i / (n - 1) * .85 : 0));
          };
          medir();
          ScrollTrigger.addEventListener('refresh', medir);
          regua.eventCallback('onUpdate', () => {
            const p = regua.progress();
            grupos.forEach((g, i) => g.classList.toggle(ALC, p > 0 && p >= limiares[i] - .002));
          });
          limpar = () => ScrollTrigger.removeEventListener('refresh', medir);
        } else {
          /* celular (sem régua): a sutura acima do grupo se fecha do eixo para fora quando ele chega */
          const sts = grupos.map(g => ScrollTrigger.create({
            trigger: g, start: 'top 82%',
            onEnter: () => g.classList.add(ALC), onLeaveBack: () => g.classList.remove(ALC)
          }));
          limpar = () => sts.forEach(s => s.kill());
        }
        return () => {
          limpar();
          trat.classList.remove('trat--vivo');
          grupos.forEach(g => g.classList.remove(ALC));
        };
      });
    }
  });
});
