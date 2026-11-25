/* ==========================================================================
   Placa de laboratório (PRP): explorador do sangue (Fig. 1 da capa).
   Carregado só pela página /prp/, depois do site.js.
   Desenho de gravura: traço fino, hachura, pontilhado. Diagramas
   esquemáticos, não imagens diagnósticas. Sem dependências.
   Montagem: #tubeOuter. O player de etapas em desenho saiu em 25/11/2026.
   ========================================================================== */
(() => {
  'use strict';
  const PS = window.PS;
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];

  /* Hachuras da gravura: clara (champanhe) e escura (sombra sobre cor). */
  const defs = id => `<defs>
      <pattern id="${id}-h" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><path d="M0 0V6" class="hach"/></pattern>
      <pattern id="${id}-hs" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><path d="M0 0V5" class="hach-escura"/></pattern>
    </defs>`;
  const rot = (x, y, t, sub, extra = '') => `<text x="${x}" y="${y}" class="rot" ${extra}>${t}</text>${sub ? `<text x="${x}" y="${y + 19}" class="sub" ${extra}>${sub}</text>` : ''}`;
  /* Pseudoaleatório estável (o desenho é o mesmo a cada render). */
  const rnd = (i, s = 1) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
  /* Pontilhado: mais denso embaixo, como as plaquetas perto da camada intermediária. */
  const pontos = (x, y, w, h, n, s = 1) => Array.from({ length: n }, (_, i) =>
    `<circle cx="${(x + rnd(i, s) * w).toFixed(1)}" cy="${(y + Math.sqrt(rnd(i, s + 7)) * h).toFixed(1)}" r="${(0.9 + rnd(i, s + 3) * 0.9).toFixed(2)}" class="ponto"/>`).join('');
  /* Plaquetas: pequenos discos, no detalhe ampliado em gravura. */
  const discos = (cx, cy, r, n) => Array.from({ length: n }, (_, i) => {
    const a = rnd(i, 4) * Math.PI * 2, d = Math.sqrt(rnd(i, 9)) * (r - 7);
    return `<ellipse cx="${(cx + Math.cos(a) * d).toFixed(1)}" cy="${(cy + Math.sin(a) * d).toFixed(1)}" rx="3.2" ry="1.9" transform="rotate(${Math.round(rnd(i, 2) * 180)} ${(cx + Math.cos(a) * d).toFixed(1)} ${(cy + Math.sin(a) * d).toFixed(1)})" class="disco"/>`;
  }).join('');

  const TUBO = 'M213 82H323V396Q323 436 268 436Q213 436 213 396Z';
  function vial(id, { cap = true, mixed = false } = {}) {
    return `<defs><clipPath id="${id}-clip"><path d="M218 100H318V394Q318 429 268 429Q218 429 218 394Z"/></clipPath></defs>
      <path d="${TUBO}" class="corpo"/>
      <g clip-path="url(#${id}-clip)">
        <g class="separated-fluid" opacity="${mixed ? 0 : 1}">
          <rect x="218" y="146" width="100" height="180" class="plasma"/>
          <rect x="294" y="146" width="24" height="180" fill="url(#${id}-hs)"/>
          ${pontos(222, 236, 92, 88, 70, id.length)}
          <rect x="218" y="326" width="100" height="8" class="interface"/>
          <rect x="218" y="334" width="100" height="102" class="sangue"/>
          <rect x="294" y="334" width="24" height="102" fill="url(#${id}-hs)"/>
        </g>
        <g class="mixed-fluid" opacity="${mixed ? 1 : 0}">
          <rect x="218" y="146" width="100" height="290" class="sangue"/>
          <rect x="294" y="146" width="24" height="290" fill="url(#${id}-hs)"/>
        </g>
      </g>
      <path d="M218 146Q268 152 318 146" class="ln-m"/>
      <path d="${TUBO}" class="ln"/>
      ${Array.from({ length: 9 }, (_, i) => `<path d="M302 ${173 + i * 23}h${i % 2 ? 7 : 12}" class="ln-s"/>`).join('')}
      ${cap
        ? `<rect x="206" y="52" width="124" height="34" rx="3" class="corpo"/>${Array.from({ length: 14 }, (_, i) => `<path d="M${214 + i * 8} 56V82" class="ln-s"/>`).join('')}<rect x="206" y="52" width="124" height="34" rx="3" class="ln"/>`
        : `<ellipse cx="268" cy="84" rx="55" ry="6" class="corpo ln"/>`}`;
  }
  const stage = (id, content, label, view = '0 0 640 430') =>
    `<svg class="lab-art" viewBox="${view}" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${defs(id)}${content}</svg>`;

  /* ---------- Explorador do sangue (Fig. 1) ---------- */
  function tubeExperience() {
    const root = $('#tubeOuter') || $('.prp-tsr-grid > div:last-child'); if (!root) return;
    root.classList.add('prp-tube-outer');
    root.innerHTML = `<div class="lab-card lab-placa sup-escura" id="prpExplorer">
      <div id="tubeView">${stage('hero-prp', `
        <g class="float-slow">${vial('hero-prp')}
          <rect id="fractionFocus" x="208" y="141" width="120" height="190" class="foco"/></g>
        <g class="rotulo" data-rotulo="0"><path d="M327 200H354" class="guia"/>${rot(362, 205, 'Plasma', 'parte líquida do sangue')}</g>
        <g class="rotulo" data-rotulo="3"><path d="M327 330H354" class="guia"/>${rot(362, 335, 'Camada intermediária', 'glóbulos brancos e plaquetas')}</g>
        <g class="rotulo" data-rotulo="1"><path d="M327 392H354" class="guia"/>${rot(362, 397, 'Hemácias', 'glóbulos vermelhos')}</g>
        <g class="rotulo" data-rotulo="2">
          <circle cx="118" cy="212" r="42" class="corpo ln"/>${discos(118, 212, 42, 16)}
          <path d="M152 236L236 300" class="guia"/><circle cx="238" cy="302" r="2.5" class="ponto-guia"/>
          ${rot(118, 284, 'Plaquetas', 'fragmentos de células', 'text-anchor="middle"')}
        </g>
      `, 'Figura esquemática de um tubo de sangue depois da centrifugação: plasma em cima, uma camada fina intermediária e hemácias embaixo', '28 36 568 412')}</div>
      <div class="lab-bottom">
        <div class="lab-tabs" role="group" aria-label="Partes do sangue"><button type="button" data-fraction="0" aria-pressed="true">Plasma</button><button type="button" data-fraction="1" aria-pressed="false">Hemácias</button><button type="button" data-fraction="2" aria-pressed="false">Plaquetas</button></div>
        <p class="lab-description" id="fractionText" aria-live="polite"></p>
        <label class="lab-range" for="separation"><span>Simule a centrifugação <output id="separationValue" for="separation">100%</output></span><input id="separation" type="range" min="0" max="100" value="100"><small><span>Sangue coletado</span><span>Depois da centrifugação</span></small></label>
        <p class="lab-note">Fig. 1. Ilustração esquemática, fora de escala. As&nbsp;proporções variam conforme o&nbsp;preparo.</p>
      </div></div>`;
    const descriptions = [
      'A parte líquida e amarelada do sangue. É dela, junto com a camada intermediária, que se prepara o PRP.',
      'Os glóbulos vermelhos são mais pesados, ficam no fundo do tubo e são separados do preparo.',
      'Fragmentos de células que participam da coagulação e da reparação dos tecidos. Ficam mais concentradas na parte de baixo do plasma.'
    ];
    /* Moldura tracejada de cada parte: [y, altura] no desenho do tubo. */
    const FOCO = [[141, 190], [330, 104], [236, 92]];
    const buttons = $$('[data-fraction]', root), range = $('#separation', root), focus = $('#fractionFocus', root);
    const select = i => {
      buttons.forEach((b, j) => b.setAttribute('aria-pressed', String(i === j)));
      $('#fractionText', root).textContent = descriptions[i];
      $$('[data-rotulo]', root).forEach(g => g.classList.toggle('is-on', +g.dataset.rotulo === i));
      focus.setAttribute('y', FOCO[i][0]); focus.setAttribute('height', FOCO[i][1]);
    };
    buttons.forEach((b, i) => b.addEventListener('click', () => select(i))); select(0);
    const update = v => {
      const k = v / 100;
      $('.mixed-fluid', root).setAttribute('opacity', 1 - k);
      $('.separated-fluid', root).setAttribute('opacity', k);
      $('#separationValue', root).textContent = v + '%';
      range.setAttribute('aria-valuetext', k === 0 ? 'Sangue coletado' : k === 1 ? 'Depois da centrifugação' : `${v}% da centrifugação`);
    };
    /* Abertura: na primeira vez que aparece, o sangue se separa uma vez (1,8 s).
       Qualquer toque no controle encerra a demonstração. */
    let intro = true;
    range.addEventListener('input', e => { intro = false; update(+e.target.value); });
    update(100);
    const play = () => {
      if (!intro || PS.motion.paused || PS.RM) return;
      range.value = 0; update(0);
      setTimeout(() => {
        if (!intro) return;
        PS.animate(1800, k => { if (!intro) return; const v = Math.round(PS.easeOut(k) * 100); range.value = v; update(v); }, () => { intro = false; });
      }, 450);
    };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); play(); } }, { threshold: .45 });
      io.observe($('#tubeView', root));
    }
  }

  tubeExperience();
})();
