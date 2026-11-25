/* =====================================================================
   Movimento (GSAP): camada compartilhada do site, "luxo contido".
   Documentação e ganchos: docs/site.md, seção "Movimento (GSAP)".

   Como usar numa página:
   1. <script src="<raiz>/assets/movimento.js" defer></script> depois do JS da página
      (e, no <head>, <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>).
   2. Marque os blocos com data-mov (ganchos abaixo). Sem nenhum [data-mov] na página, este arquivo
      não carrega nada.

   Ganchos
   - data-mov="gravura"  um desenho em traço que se faz ao entrar na tela, uma vez:
       [data-mov-traco]      traço desenhado (path, line, polyline, use de um path; use pathLength="1"
                             no path de origem ou data-mov-traco="<comprimento>")
       [data-mov-hachura]    região que acende em hachura depois do traço
       [data-mov-depois]     o que aparece por último (lupa, pontos), na ordem do HTML;
                             data-mov-origem="x y" (unidades do SVG) é o centro de onde abre
       data-mov-inicio="top 80%"  quando começa (padrão do token inicio)
   - data-mov="cena"  cena presa só no computador (a partir de 1100 x 700 px): o palco fica parado
     e o texto passa ao lado; cada passo acende ao cruzar o meio da tela.
       [data-mov-palco]      o que fica preso (figura, vídeo)
       [data-mov-passo]      blocos de texto que passam (data-mov-rotulo="…" vai para o contador)
       [data-mov-contador]   "1 de 3" e o rótulo do passo (decorativo: aria-hidden)
       [data-mov-progresso]  filete que cresce com a rolagem (scrub)
     Classes que o CSS da página usa: .mov-cena--ativa no bloco (layout lado a lado),
     .mov-passo--agora no passo da vez.
   - html.mov: posta já na primeira execução, quando o movimento vai acontecer; o CSS esconde o estado
     inicial só com ela, e .mov-feito marca o bloco pronto. Sem GSAP (CDN fora do ar ou lento), a classe
     sai em 4 s e a página fica no estado final (ou com a animação em CSS que a página já tinha).

   Movimento reduzido: não carrega o GSAP e nada se esconde. "Pausar animações" (site.js, evento
   motionchange): o que está tocando termina na hora e a cena deixa todos os passos acesos.
   API para os JS de página: window.PSMov (tokens, pronto, gravura, desenhar, hachura, cena, contador).
   ===================================================================== */
(function () {
'use strict';
const raiz = document.documentElement;
const RM = matchMedia('(prefers-reduced-motion: reduce)');
const pausado = () => raiz.classList.contains('motion-paused') || !!(window.PS && PS.motion && PS.motion.paused);

/* ---------- Tokens de movimento da marca ---------- */
/* Curva do site (--ease: cubic-bezier(.2,.7,.1,1)) como função, sem o plugin CustomEase. */
function bezier (x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = t => ((ax * t + bx) * t + cx) * t, dX = t => (3 * ax * t + 2 * bx) * t + cx;
  const Y = t => ((ay * t + by) * t + cy) * t;
  return p => {
    if (p <= 0) return 0; if (p >= 1) return 1;
    let t = p;
    for (let i = 0; i < 6; i++) { const d = dX(t); if (Math.abs(d) < 1e-6) break; t -= (X(t) - p) / d; }
    t = Math.min(1, Math.max(0, t));
    return Y(t);
  };
}
const TOKENS = {
  dur: { curta: .6, media: .9, longa: 1.2 },   /* segundos: nada abaixo de .6 nem acima de 1.2 */
  troca: .24,                                  /* trocas de estado (contador, passo): 240 ms */
  ease: bezier(.2, .7, .1, 1),                 /* a mesma curva do --ease; entradas e traços */
  easeTraco: 'power2.out',                     /* o traço corre sem disparar no começo */
  easeTroca: 'power2.out',
  escalonar: .08,                              /* intervalo entre itens; total sempre abaixo de .5 s */
  inicio: 'top 80%',
  /* proporção das durações por faixa: celular mais curto, tablet no meio */
  fator: { celular: .75, tablet: .88, computador: 1 },
  cena: { largura: 1100, altura: 700 },
  cdn: 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/',
  espera: 4000                                 /* ms até desistir do CDN */
};
const ARQUIVOS = [
  ['gsap.min.js', 'sha384-HOvlOYPIs/zjoIkWUGXkVmXsjr8GuZLV+Q+rcPwmJOVZVpvTSXQChiN4t9Euv9Vc'],
  ['ScrollTrigger.min.js', 'sha384-P8VzCVnT9NBUkMrpcIZrJbA7EBjJvh/fJS6PmP+4nLIM284DtsImIv8D0fFjIkeh']
];

const blocos = Array.from(document.querySelectorAll('[data-mov]'));
const tipo = el => (el.getAttribute('data-mov') || '').split(/\s+/);
const feito = el => { el.classList.add('mov-feito'); el.setAttribute('data-mov-feito', ''); };
const jaFeito = el => el.hasAttribute('data-mov-feito');

let gsap = null, ScrollTrigger = null, faixa = 'computador';
const rodando = new Set();   /* linhas do tempo que tocam sozinhas: terminam na hora com "Pausar animações" */
const cenas = new Set();     /* funções que deixam a cena parada (todos os passos acesos) */

/* ---------- Helpers (precisam do GSAP; use dentro de PSMov.pronto.then) ---------- */
function comprimento (el) {
  const fixo = parseFloat(el.getAttribute('data-mov-traco'));
  if (fixo > 0) return fixo;
  let alvo = el;
  if (el.tagName.toLowerCase() === 'use') {
    const ref = el.getAttribute('href') || el.getAttribute('xlink:href') || '';
    alvo = ref.charAt(0) === '#' ? document.getElementById(ref.slice(1)) : null;
    if (!alvo) return 1;
  }
  const pl = parseFloat(alvo.getAttribute('pathLength'));
  if (pl > 0) return pl;
  try { return alvo.getTotalLength(); } catch (e) { return 1; }
}
const k = () => TOKENS.fator[faixa] || 1;

/* Traço de gravura: o desenho corre do início ao fim; no fim o traço volta a ser contínuo.
   autoRound: false porque o GSAP arredonda px e, com pathLength=1, o traço pularia de 1 para 0.
   A opacidade 1 fica no estilo (o CSS esconde o estado inicial até o bloco ganhar .mov-feito). */
function desenhar (alvos, o = {}) {
  const els = gsap.utils.toArray(alvos);
  const tl = gsap.timeline();
  els.forEach((el, i) => {
    const L = comprimento(el);
    tl.fromTo(el, { opacity: 1, strokeDasharray: L, strokeDashoffset: L },
      { strokeDashoffset: 0, autoRound: false, duration: o.duracao || TOKENS.dur.longa * k(), ease: o.ease || TOKENS.easeTraco,
        clearProps: 'strokeDasharray,strokeDashoffset' }, i * (o.escalonar ?? TOKENS.escalonar));
  });
  return tl;
}
/* Região em hachura que acende: luz e um respiro de 4% a partir do centro. */
function hachura (alvos, o = {}) {
  return gsap.fromTo(alvos, { opacity: 0, scale: .96, transformOrigin: '50% 50%' },
    { opacity: 1, scale: 1, duration: o.duracao || TOKENS.dur.curta * k(), ease: o.ease || TOKENS.ease,
      stagger: o.escalonar ?? TOKENS.escalonar, clearProps: 'transform' });
}
/* O que aparece por último (lupa, pontos): abre do centro dado em data-mov-origem. */
function aparecer (els, o = {}) {
  const tl = gsap.timeline();
  gsap.utils.toArray(els).forEach((el, i) => {
    const origem = el.getAttribute('data-mov-origem');
    const de = { opacity: 0 }, para = { opacity: 1, duration: TOKENS.dur.curta * k(), ease: TOKENS.ease, clearProps: 'transform' };
    if (origem) { de.scale = .9; de.svgOrigin = origem; para.scale = 1; para.svgOrigin = origem; }
    tl.fromTo(el, de, para, i * (o.escalonar ?? .14));
  });
  return tl;
}

/* data-mov="gravura": traço, depois hachura, depois o resto; uma vez, ao entrar na tela. */
function gravura (el) {
  if (jaFeito(el)) return null;
  const r = el.getBoundingClientRect();
  if (r.bottom < 0) { feito(el); return null; }   /* a página abriu abaixo dele: fica pronto, sem tocar */
  const tracos = el.querySelectorAll('[data-mov-traco]');
  const zonas = el.querySelectorAll('[data-mov-hachura]');
  const depois = el.querySelectorAll('[data-mov-depois]');
  const tl = gsap.timeline({ paused: true, onComplete: () => { feito(el); rodando.delete(tl); } });
  if (tracos.length) tl.add(desenhar(tracos), .12);
  const fimTraco = tracos.length ? .12 + TOKENS.dur.longa * k() : 0;
  if (zonas.length) tl.add(hachura(zonas), Math.max(0, fimTraco - .25));
  if (depois.length) tl.add(aparecer(depois), Math.max(0, fimTraco - .05));
  ScrollTrigger.create({
    trigger: el, start: el.getAttribute('data-mov-inicio') || TOKENS.inicio, once: true,
    onEnter: () => { rodando.add(tl); if (pausado()) tl.progress(1); else tl.play(); }
  });
  return tl;
}

/* Contador de etapas: "1 de 3" e o rótulo do passo, trocados em 240 ms. */
function contador (el, total) {
  if (!el) return { ir () {} };
  el.innerHTML = '<span class="mov-contador__n"></span> <span class="mov-contador__de">de ' + total +
    '</span><span class="mov-contador__rotulo"></span>';
  const n = el.querySelector('.mov-contador__n'), rot = el.querySelector('.mov-contador__rotulo');
  let atual = -1;
  return {
    ir (i, rotulo) {
      if (i === atual) return;
      const primeira = atual < 0; atual = i;
      const trocar = () => { n.textContent = String(i + 1); rot.textContent = rotulo || ''; };
      if (primeira || pausado()) { trocar(); return; }
      gsap.timeline()
        .to([n, rot], { opacity: 0, y: -4, duration: TOKENS.troca / 2, ease: 'power2.in' })
        .add(trocar)
        .fromTo([n, rot], { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: TOKENS.troca, ease: TOKENS.easeTroca, clearProps: 'opacity,transform' });
    }
  };
}

/* data-mov="cena": palco preso, texto passando ao lado, passo da vez aceso, filete com scrub. */
function cena (el) {
  const palco = el.querySelector('[data-mov-palco]');
  const passos = Array.from(el.querySelectorAll('[data-mov-passo]'));
  if (!palco || passos.length < 2) return null;
  el.classList.add('mov-cena--ativa');
  const cont = contador(el.querySelector('[data-mov-contador]'), passos.length);
  const prog = el.querySelector('[data-mov-progresso]');
  let parada = false;
  const acender = i => {
    passos.forEach((p, j) => p.classList.toggle('mov-passo--agora', parada || j === i));
    cont.ir(i, passos[i].getAttribute('data-mov-rotulo'));
  };
  /* "Pausar animações": todos os passos acesos (nada muda sozinho); ao voltar, só o passo da vez */
  const parar = () => { parada = pausado(); acender(Math.max(0, passos.findIndex(p => p.classList.contains('mov-passo--atual')))); };
  acender(0);
  passos.forEach((p, i) => ScrollTrigger.create({
    trigger: p, start: 'top 62%', end: 'bottom 38%',
    onToggle: s => { if (s.isActive) { passos.forEach(q => q.classList.remove('mov-passo--atual')); p.classList.add('mov-passo--atual'); acender(i); } }
  }));
  const ultimo = passos[passos.length - 1];
  const faixaPresa = {
    trigger: palco, start: 'center center', endTrigger: ultimo, end: 'center center',
    invalidateOnRefresh: true
  };
  /* pinSpacing: o espaçador cresce o tanto que o palco fica preso, e o que vem depois não fica embaixo dele */
  ScrollTrigger.create(Object.assign({ pin: palco, pinSpacing: true, anticipatePin: 1 }, faixaPresa));
  if (prog) gsap.fromTo(prog, { scaleY: 0, transformOrigin: '50% 0%' },
    { scaleY: 1, ease: 'none', scrollTrigger: Object.assign({ scrub: .6 }, faixaPresa) });
  cenas.add(parar);
  parar();
  return () => {
    cenas.delete(parar);
    el.classList.remove('mov-cena--ativa');
    passos.forEach(p => p.classList.remove('mov-passo--agora', 'mov-passo--atual'));
  };
}

/* ---------- Montagem ---------- */
let resolver;
const pronto = new Promise(r => { resolver = r; });
window.PSMov = {
  tokens: TOKENS, pronto,
  get ativo () { return !!gsap; },
  get faixa () { return faixa; },
  gravura: el => gsap && gravura(el), desenhar: (a, o) => gsap && desenhar(a, o),
  hachura: (a, o) => gsap && hachura(a, o), cena: el => gsap && cena(el),
  contador: (el, n) => gsap ? contador(el, n) : { ir () {} }
};

if (!blocos.length || RM.matches) { resolver(null); return; }
raiz.classList.add('mov');

function montar () {
  gsap = window.gsap; ScrollTrigger = window.ScrollTrigger;
  if (!gsap || !ScrollTrigger) throw new Error('GSAP ausente');
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ duration: TOKENS.dur.media, ease: TOKENS.ease });
  const mm = gsap.matchMedia();
  mm.add({
    celular: '(max-width: 599px)',
    tablet: '(min-width: 600px) and (max-width: 1099px)',
    computador: '(min-width: 1100px)',
    alto: `(min-height: ${TOKENS.cena.altura}px)`,
    reduzido: '(prefers-reduced-motion: reduce)'
  }, ctx => {
    const c = ctx.conditions;
    if (c.reduzido) { blocos.forEach(feito); raiz.classList.remove('mov'); return; }
    faixa = c.celular ? 'celular' : c.tablet ? 'tablet' : 'computador';
    const limpezas = [];
    blocos.forEach(el => {
      const t = tipo(el);
      if (t.includes('gravura')) gravura(el);
      if (t.includes('cena') && c.computador && c.alto) { const f = cena(el); if (f) limpezas.push(f); }
    });
    /* mudou de faixa: o GSAP desfaz o que esta rodada criou; o que já terminou (.mov-feito) não repete */
    return () => { rodando.clear(); limpezas.forEach(f => f()); };
  });
  document.addEventListener('motionchange', () => {
    if (pausado()) rodando.forEach(tl => tl.progress(1));
    cenas.forEach(f => f());
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  resolver({ gsap, ScrollTrigger, mm });
}

/* Carrega o GSAP do CDN, em ordem, sem bloquear a página; com falha ou demora, fica tudo no estado final. */
let desistiu = false;
const desistir = () => {
  if (gsap || desistiu) return;
  desistiu = true;
  raiz.classList.remove('mov'); raiz.classList.add('mov-sem');
  blocos.forEach(feito); resolver(null);
};
const relogio = setTimeout(desistir, TOKENS.espera);
(function carregar (i) {
  if (desistiu) return;
  if (i === ARQUIVOS.length) {
    clearTimeout(relogio);
    try { montar(); } catch (e) { desistir(); }
    return;
  }
  const s = document.createElement('script');
  s.src = TOKENS.cdn + ARQUIVOS[i][0];
  s.integrity = ARQUIVOS[i][1];
  s.crossOrigin = 'anonymous';
  s.async = true;
  s.onload = () => carregar(i + 1);
  s.onerror = () => { clearTimeout(relogio); desistir(); };
  document.head.appendChild(s);
})(0);
})();
