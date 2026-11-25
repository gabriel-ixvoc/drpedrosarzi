/* ==========================================================================
   Pedro Sarzi · /infiltracoes/
   1. Placa da capa (Fig. 1): a linha da legenda acende a região da mão, e a
      região apontada no desenho acende o nome na legenda.
   2. Comparador das medicações (Fig. 2): abas, painéis e a régua do tempo
      (as unidades cobertas pela faixa ficam acesas).
      Setas, Home e End vêm do site.js ([role=tablist]); aqui só a troca.
   3. Copiar as perguntas para a consulta.
   4. Movimento (assets/movimento.js, GSAP), o momento-assinatura da página:
      Fig. 1 (data-mov="placa"): o contorno da mão se desenha e cada região
      acende em ordem (hachura, linha de chamada, número). Fig. 2: ao trocar
      de aba, a faixa recolhe até o novo início e volta a medir até o fim; na
      primeira vez que a régua aparece, ela mede sozinha.
   Sem GSAP (CDN fora do ar, movimento reduzido): a régua desliza em 420 ms
   pelo CSS e a Fig. 1 fica pronta. "Pausar animações" termina tudo na hora.
   ========================================================================== */
(function () {
'use strict';
const { $, $$ } = window.PS || { $: (s, r = document) => r.querySelector(s), $$: (s, r = document) => [...r.querySelectorAll(s)] };
/* ponte entre a parte 2 e a parte 4: a parte 4 troca medir() pela animação */
const med = { regua: null, medir: null };
const placa = { fig: null, chamada: null };

/* ---------- 1. Placa da capa ---------- */
(function () {
  const fig = $('#ifPlaca');
  if (!fig) return;
  placa.fig = fig;
  const regioes = $$('.if-reg', fig);
  const itens = $$('.if-placa__legenda li', fig);
  let atual = null;
  const acende = n => {
    if (n === atual) return;
    atual = n;
    regioes.forEach(r => r.classList.toggle('on', r.dataset.regiao === n));
    itens.forEach(li => li.classList.toggle('on', li.dataset.regiao === n));
    if (n && placa.chamada) placa.chamada(n);
  };
  /* o desenho também responde: o mouse ou o dedo numa região acende o nome na legenda */
  regioes.forEach(r => {
    r.addEventListener('pointerenter', () => acende(r.dataset.regiao));
    r.addEventListener('pointerleave', () => acende(null));
  });
  itens.forEach(li => {
    const n = li.dataset.regiao;
    li.addEventListener('mouseenter', () => acende(n));
    li.addEventListener('mouseleave', () => acende(null));
    li.addEventListener('focusin', () => acende(n));
    li.addEventListener('focusout', () => acende(null));
  });
})();

/* ---------- 2. Comparador das medicações ---------- */
(function () {
  const box = $('#med');
  if (!box) return;
  const abas = $$('[role="tab"]', box);
  const paineis = abas.map(a => document.getElementById(a.getAttribute('aria-controls')));
  const regua = $('#medRegua');
  const marcas = regua ? $$('.regua__marcas li', regua.parentNode) : [];
  const POS = [0, 33.333, 66.666, 100];
  /* unidades cobertas pela faixa ficam acesas (a faixa se apaga no fim: folga de 10) */
  const unidades = (ini, fim) => marcas.forEach((m, k) => m.classList.toggle('on', POS[k] >= ini - 4 && POS[k] <= fim + 10));
  med.regua = regua;
  med.medir = (ini, fim) => { regua.style.setProperty('--ini', ini); regua.style.setProperty('--fim', fim); };
  function escolhe (i) {
    abas.forEach((a, k) => {
      const sel = k === i;
      a.setAttribute('aria-selected', String(sel));
      a.tabIndex = sel ? 0 : -1;
      /* os painéis ficam empilhados na mesma célula (altura da prancha não pula ao trocar);
         o escondido sai da leitura e do Tab por visibility:hidden, no CSS */
      paineis[k].classList.toggle('on', sel);
    });
    const p = paineis[i];
    if (regua && p) {
      const ini = +p.dataset.ini, fim = +p.dataset.fim;
      unidades(ini, fim);
      med.medir(ini, fim);
    }
  }
  abas.forEach((a, i) => a.addEventListener('click', () => {
    if (a.getAttribute('aria-selected') === 'true') return;
    escolhe(i);
  }));
  box.classList.add('med--pronto');
  escolhe(Math.max(0, abas.findIndex(a => a.getAttribute('aria-selected') === 'true')));
})();

/* ---------- 3. Copiar as perguntas ---------- */
(function copiar () {
  const btn = $('#copiarPerguntas');
  const status = $('#copiarStatus');
  if (!btn || !status) return;
  const lista = $(btn.dataset.copiar);
  if (!lista) return;
  const rotulo = btn.textContent;
  let timer;
  const texto = () => 'Perguntas para a consulta com o Dr. Pedro Sarzi:\n' +
    $$('li', lista).map((li, i) => `${i + 1}. ${li.textContent.trim()}`).join('\n');
  function reserva (t) {
    const ta = document.createElement('textarea');
    ta.value = t; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
    document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  }
  function avisa (ok) {
    status.textContent = ok
      ? 'Perguntas copiadas. Cole na mensagem ao agendar ou nas suas anotações.'
      : 'Não foi possível copiar aqui. Selecione a lista e copie.';
    if (ok) { btn.textContent = 'Perguntas copiadas'; clearTimeout(timer); timer = setTimeout(() => { btn.textContent = rotulo; }, 2600); }
  }
  btn.addEventListener('click', () => {
    const t = texto();
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(t).then(() => avisa(true), () => avisa(reserva(t)));
    } else avisa(reserva(t));
  });
})();

/* ---------- 4. Movimento (GSAP pelo assets/movimento.js) ----------
   Este arquivo roda antes do movimento.js (os dois com defer); no DOMContentLoaded o PSMov já existe.
   data-mov="placa" na Fig. 1 só pede o GSAP ao módulo (e o estado pronto, .mov-feito, quando ele falha);
   a coreografia é desta página, com os tokens e helpers do PSMov. */
document.addEventListener('DOMContentLoaded', () => {
  const M = window.PSMov;
  if (!M) return;
  const raiz = document.documentElement;
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const parado = () => RM.matches || raiz.classList.contains('motion-paused');
  M.pronto.then(r => {
    if (!r) return;
    const { gsap, ScrollTrigger, mm } = r;
    const T = M.tokens;
    const k = () => T.fator[M.faixa] || 1;
    const rodando = new Set();
    const tocar = tl => {
      rodando.add(tl);
      tl.eventCallback('onComplete', () => { rodando.delete(tl); if (tl.data) tl.data(); });
      if (parado()) tl.progress(1);
      return tl;
    };

    /* ---- Fig. 1: o contorno se desenha e as regiões acendem uma a uma ---- */
    const fig = placa.fig;
    const pronta = () => !!fig && fig.classList.contains('mov-feito');
    const marcar = () => { fig.classList.add('mov-feito'); fig.setAttribute('data-mov-feito', ''); };
    function abrirPlaca () {
      const kk = k();
      const tl = gsap.timeline({ paused: true, data: marcar });
      const contorno = $('.if-placa__contorno', fig);
      tl.add(M.desenhar(contorno, { duracao: T.dur.longa * kk }), .1);
      /* o papel da mão (preenchimento de 4,5%) vem atrás do traço, não antes */
      tl.fromTo(contorno, { fillOpacity: 0 }, { fillOpacity: 1, duration: T.dur.longa * kk, ease: 'power1.in', clearProps: 'fillOpacity' }, .3);
      $$('.if-reg', fig).forEach((g, i) => {
        const zona = $('.if-reg__zona', g), guia = $('.if-reg__guia', g);
        const disco = $('.if-reg__disco', g), n = $('.if-reg__n', g);
        const t0 = (.72 + i * .2) * kk;
        const centro = disco.getAttribute('cx') + ' ' + disco.getAttribute('cy');
        tl.fromTo(zona, { opacity: 0, scale: .9, transformOrigin: '50% 50%' },
          { opacity: 1, scale: 1, duration: T.dur.curta * kk, ease: T.ease, clearProps: 'transform' }, t0);
        tl.fromTo(guia, { opacity: 1, strokeDasharray: 1, strokeDashoffset: 1 },
          { strokeDashoffset: 0, autoRound: false, duration: .36 * kk, ease: T.easeTraco, clearProps: 'strokeDasharray,strokeDashoffset' }, t0 + .22 * kk);
        tl.fromTo([disco, n], { opacity: 0, scale: .6, svgOrigin: centro },
          { opacity: 1, scale: 1, svgOrigin: centro, duration: .42 * kk, ease: T.ease, clearProps: 'transform' }, t0 + .5 * kk);
      });
      return tl;
    }
    if (fig) mm.add({
      reduzido: '(prefers-reduced-motion: reduce)',
      celular: '(max-width: 599px)', tablet: '(min-width: 600px) and (max-width: 1099px)', computador: '(min-width: 1100px)'
    }, ctx => {
      if (ctx.conditions.reduzido) { marcar(); return; }
      if (pronta()) return;
      if (fig.getBoundingClientRect().bottom < 0) { marcar(); return; }   /* abriu abaixo da placa: fica pronta */
      const tl = abrirPlaca();
      ScrollTrigger.create({ trigger: fig, start: 'top 82%', once: true, onEnter: () => tocar(tl).play() });
      return () => rodando.delete(tl);   /* mudou de faixa antes de terminar: o GSAP desfaz e recomeça na faixa nova */
    });
    /* ao apontar uma região (legenda ou desenho), a linha de chamada se refaz da região até o número */
    placa.chamada = n => {
      if (!pronta() || parado()) return;
      const guia = $('.if-reg[data-regiao="' + n + '"] .if-reg__guia', fig);
      if (guia) gsap.fromTo(guia, { strokeDasharray: 1, strokeDashoffset: 1 },
        { strokeDashoffset: 0, autoRound: false, duration: T.troca, ease: T.easeTroca, overwrite: true, clearProps: 'strokeDasharray,strokeDashoffset' });
    };

    /* ---- Fig. 2: a régua mede de novo a cada troca de aba ---- */
    const regua = med.regua;
    if (regua) {
      regua.classList.add('regua__trilho--mov');   /* o GSAP conduz: a transição em CSS sai */
      const ponto = $('.regua__ponto', regua);
      let tlR = null, intro = null;
      const val = nome => parseFloat(gsap.getProperty(regua, nome)) || 0;
      const medir = (ini, fim, doInicio) => {
        if (intro) { intro.kill(); intro = null; }
        if (tlR) { tlR.kill(); rodando.delete(tlR); }
        if (parado()) { gsap.set(regua, { '--ini': ini, '--fim': fim }); return; }
        const kk = k();
        tlR = gsap.timeline();
        if (!doInicio) {
          /* recolhe: a faixa encolhe junto com o ponto, que corre para o novo início */
          tlR.to(regua, { '--ini': ini, '--fim': ini, duration: .3 * kk, ease: 'power2.inOut' });
          /* o ponto marca a chegada com um respiro curto */
          tlR.fromTo(ponto, { scale: 1 }, { scale: 1.4, duration: .12 * kk, ease: 'power2.out', yoyo: true, repeat: 1, clearProps: 'transform' }, '>-.06');
        }
        /* mede: a faixa corre do início até o fim */
        tlR.to(regua, { '--fim': fim, duration: .6 * kk, ease: T.ease }, doInicio ? 0 : .26 * kk);
        tocar(tlR);
      };
      med.medir = (ini, fim) => medir(ini, fim, false);
      /* primeira vez na tela: a régua mede sozinha (só se ainda estiver abaixo da dobra) */
      if (regua.getBoundingClientRect().top > innerHeight && !parado()) {
        const ini = val('--ini'), fim = val('--fim');
        gsap.set(regua, { '--fim': ini });
        intro = ScrollTrigger.create({ trigger: regua, start: 'top 88%', once: true,
          onEnter: () => { intro = null; medir(ini, fim, true); } });
        /* pausou ou reduziu antes de chegar lá: a régua fica medida, parada */
        const encerrar = () => { if (intro && parado()) { intro.kill(); intro = null; gsap.set(regua, { '--fim': fim }); } };
        document.addEventListener('motionchange', encerrar);
        if (RM.addEventListener) RM.addEventListener('change', encerrar);
      }
    }

    const fechar = () => { if (parado()) rodando.forEach(tl => tl.progress(1)); };
    document.addEventListener('motionchange', fechar);
    if (RM.addEventListener) RM.addEventListener('change', fechar);
  });
});
})();
