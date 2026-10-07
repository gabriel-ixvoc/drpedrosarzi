/* ==========================================================================
   Placas de laboratório (PRP): explorador do sangue e player de etapas.
   Carregado só pela página /prp/, depois do site.js.
   Desenho de gravura: traço fino, hachura, pontilhado. Diagramas
   esquemáticos, não imagens diagnósticas. Sem dependências.
   Montagem: #tubeOuter (PRP) ou .prp-tsr-grid > div:last-child (home);
   player em .process-illus-inner com os .process-step[data-step] da página
   (título e texto de cada etapa vêm do h3 e do p de cada passo).
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
        <p class="lab-note">Fig. 1. Desenho esquemático. As proporções variam conforme o preparo.</p>
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

  /* ---------- Player de etapas (Fig. 2) ---------- */
  function processExperience() {
    const root = $('.process-illus-inner'); if (!root) return;
    /* Braço na dobra do cotovelo, cortado pelas bordas (máscara de esmaecimento). */
    const BRACO = 'M0 170C80 160 170 166 240 184C300 199 380 206 490 204L490 272C380 276 300 286 240 300C180 314 90 322 0 322Z';
    const TUBO_COLETA = 'M364 216C412 192 436 112 492 92S562 70 582 93';
    const scenes = [
      () => stage('collect', `
        <defs>
          <linearGradient id="collect-fade" gradientUnits="userSpaceOnUse" x1="0" x2="490"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".16" stop-color="#fff"/><stop offset=".84" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
          <mask id="collect-m" maskUnits="userSpaceOnUse" x="0" y="0" width="640" height="430"><rect width="640" height="430" fill="url(#collect-fade)"/></mask>
          <clipPath id="collect-braco"><path d="${BRACO}"/></clipPath>
        </defs>
        <g mask="url(#collect-m)">
          <path d="${BRACO}" class="corpo"/>
          <rect x="0" y="282" width="490" height="44" fill="url(#collect-h)" clip-path="url(#collect-braco)"/>
          <path d="M0 252C90 250 170 246 250 244C330 242 410 236 490 236" class="veia"/>
          <path d="M0 252C90 250 170 246 250 244C330 242 410 236 490 236" class="ln-s"/>
          <path d="M236 204C247 228 249 256 241 284" class="ln-s"/>
          <path d="M0 170C80 160 170 166 240 184C300 199 380 206 490 204M490 272C380 276 300 286 240 300C180 314 90 322 0 322" class="ln"/>
          <path d="M112 162L127 163L131 321L116 322Z" class="corpo ln-m"/>
        </g>
        <path d="M300 242L342 222" class="ln-m"/>
        <path d="M336 220L360 209L366 224L342 235Z" class="corpo ln"/>
        <path d="${TUBO_COLETA}" class="tubo-ext"/>
        <path d="${TUBO_COLETA}" class="tubo-sangue"/>
        <path d="${TUBO_COLETA}" class="fluxo draw-flow"/>
        <g transform="translate(470 70) scale(.42)">${vial('collect', { mixed: true })}</g>
        <circle cx="300" cy="242" r="12" class="ln-s"/>
        <path d="M300 230V156H60" class="guia"/>${rot(60, 126, 'Coleta venosa', 'uma amostra da veia do braço')}
        <path d="M582 262V284" class="guia"/>${rot(572, 308, 'Tubo de coleta', 'estéril', 'text-anchor="middle"')}
      `, 'Coleta de uma amostra de sangue da veia do braço, na dobra do cotovelo, com tubo de coleta estéril'),
      () => stage('spin', `
        <path d="M120 212L135 302Q320 395 505 302L520 212Z" class="corpo"/>
        <path d="M137 267Q320 351 503 267V302Q320 388 137 302Z" fill="url(#spin-h)"/>
        <path d="M120 212L135 302Q320 395 505 302L520 212" class="ln"/>
        <ellipse cx="320" cy="214" rx="201" ry="105" class="corpo ln"/>
        <ellipse cx="320" cy="214" rx="179" ry="87" class="fundo ln-s"/>
        <g transform="translate(0 107) scale(1 .5)"><g class="rotor">
          <circle cx="320" cy="214" r="141" class="ln-s"/>
          ${Array.from({ length: 8 }, (_, i) => `<g transform="rotate(${i * 45} 320 214)"><rect x="306" y="80" width="28" height="79" rx="10" class="corpo"/><rect x="310" y="86" width="20" height="30" class="sangue"/><rect x="310" y="116" width="20" height="4" class="interface"/><rect x="310" y="120" width="20" height="33" class="plasma"/><rect x="306" y="80" width="28" height="79" rx="10" class="ln"/></g>`).join('')}
          <circle cx="320" cy="214" r="44" class="corpo ln"/><circle cx="320" cy="214" r="19" class="ln-s"/>
        </g></g>
        <ellipse cx="320" cy="214" rx="191" ry="97" class="gira draw-flow"/>
        <path d="M126 196H86V146" class="guia"/>${rot(40, 108, 'Centrifugação', 'separa pelo peso de cada parte')}
        <path d="M478 168L520 128" class="guia"/>${rot(470, 92, 'Tubos equilibrados', 'um diante do outro')}
      `, 'Centrífuga com tubos equilibrados, em rotação, separando o sangue em camadas'),
      () => stage('extract', `
        <g transform="translate(30 95) scale(.7)">${vial('extract', { cap: false })}</g>
        <g transform="translate(310 10) rotate(21)">
          <path d="M0 135V268" class="ln-m"/>
          <rect x="-7" y="122" width="14" height="19" rx="2" class="corpo ln"/>
          <rect x="-21" y="41" width="42" height="86" rx="4" class="corpo"/>
          <rect class="fluid-fill plasma" x="-16" y="52" width="32" height="71" rx="2"/>
          <rect x="-21" y="41" width="42" height="86" rx="4" class="ln-m"/>
          ${Array.from({ length: 6 }, (_, i) => `<path d="M11 ${53 + i * 11}H19" class="ln-s"/>`).join('')}
          <g class="plunger"><rect x="-16" y="45" width="32" height="5" class="corpo ln"/><rect x="-4" y="6" width="8" height="40" class="corpo ln-s"/><rect x="-25" y="1" width="50" height="7" rx="2" class="corpo ln"/></g>
          <rect x="-31" y="36" width="62" height="6" rx="2" class="corpo ln-m"/>
        </g>
        <path d="M150 266H204" class="guia"/>${rot(28, 236, 'Camada de plasma', 'com mais plaquetas')}
        <path d="M300 82H455V146" class="guia"/>${rot(432, 172, 'PRP', 'plasma rico em plaquetas')}
      `, 'Seringa estéril retirando a camada de plasma com mais plaquetas do tubo centrifugado'),
      () => stage('apply', `
        <defs><linearGradient id="apply-fade" gradientUnits="userSpaceOnUse" x1="83" x2="557"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".16" stop-color="#fff"/><stop offset=".84" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><mask id="apply-m" maskUnits="userSpaceOnUse" x="0" y="0" width="640" height="430"><rect width="640" height="430" fill="url(#apply-fade)"/></mask></defs>
        <g mask="url(#apply-m)">
        <path d="M83 301C131 264 168 258 214 263C267 269 304 254 342 263C389 274 439 276 547 262L557 324C455 343 416 337 351 322C288 304 266 327 221 326C164 325 143 320 83 343Z" class="corpo ln-s"/>
        <path d="M92 302C159 283 190 281 225 288C251 294 265 282 275 282Q300 284 291 299Q281 312 260 308C209 312 176 300 93 322Z" fill="url(#apply-h)"/>
        <path d="M92 302C159 283 190 281 225 288C251 294 265 282 275 282Q300 284 291 299Q281 312 260 308C209 312 176 300 93 322Z" class="ln-m"/>
        <path d="M339 285Q315 284 316 298Q322 313 345 307C408 320 466 326 549 307L547 284C457 302 399 286 339 285Z" fill="url(#apply-h)"/>
        <path d="M339 285Q315 284 316 298Q322 313 345 307C408 320 466 326 549 307L547 284C457 302 399 286 339 285Z" class="ln-m"/>
        <path d="M285 282Q303 294 286 308M324 282Q307 294 325 309" class="ln-s"/>
        <path d="M112 270C211 239 252 256 305 255S431 271 518 250" class="tendao"/>
        <path d="M112 270C211 239 252 256 305 255S431 271 518 250" class="ln"/>
        </g>
        <path d="M374 192L281 312L443 325Z" class="feixe beam"/>
        <g transform="translate(363 157) rotate(15)"><path d="M24 0V-30Q24 -64 67 -62" class="ln-s"/><rect width="48" height="44" rx="6" class="corpo ln"/><rect x="3" y="34" width="42" height="12" rx="3" class="corpo ln-m"/></g>
        <g transform="translate(218 122) rotate(-35)"><path d="M0 79V169" class="ln-m"/><rect x="-18" width="36" height="77" rx="4" class="corpo"/><rect x="-13" y="12" width="26" height="59" class="plasma"/><rect x="-18" width="36" height="77" rx="4" class="ln-m"/><rect x="-5" y="-28" width="10" height="31" class="corpo ln-s"/><path d="M-24 -29H24M-25 2H25" class="ln-m"/></g>
        <circle cx="315" cy="258" r="20" class="alvo"/><circle cx="315" cy="258" r="2.5" class="ponto-guia"/>
        ${rot(40, 58, 'Aplicação', 'no ponto definido na avaliação')}
        <path d="M430 160H468" class="guia"/>${rot(476, 156, 'Guiada por imagem', 'quando necessário')}
        <text x="320" y="392" class="sub" text-anchor="middle">Exemplo no cotovelo, em corte simplificado.</text>
      `, 'Aplicação do preparo no cotovelo, em corte simplificado, guiada por exame de imagem quando necessário')
    ];
    /* Texto de cada etapa: um só lugar, o h3 e o p de cada .process-step. */
    const steps = $$('.process-step');
    const copy = steps.map(s => [$('h3', s).textContent.trim(), $('p', s).textContent.trim()]);
    root.classList.add('lab-card', 'lab-placa', 'sup-escura');
    root.innerHTML = `<div class="lab-topline"><span class="lab-fig">Fig. 2. Do sangue ao preparo</span><span class="lab-status" id="processStatus">01 / 04</span></div><div id="processScene"></div><div class="lab-caption" aria-live="polite"><p class="lab-caption__titulo" id="processTitle"></p><p id="processDescription"></p></div><div class="lab-bottom"><div class="lab-controls"><button type="button" class="lab-button" id="processPlay" aria-pressed="false">Reproduzir<span> etapas</span></button><div class="lab-progress" role="group" aria-label="Escolha uma etapa">${copy.map((c, i) => `<button type="button" data-scene="${i}" aria-label="Etapa ${i + 1}: ${c[0]}"></button>`).join('')}</div><button type="button" class="lab-button" id="processNext">Próxima<span> etapa</span></button></div><p class="lab-note">Desenho esquemático. O preparo e a técnica variam conforme o caso.</p></div>`;
    let active = 0, playing = false, timer = null, visible = true;
    steps.forEach((s, i) => { s.setAttribute('role', 'button'); s.tabIndex = 0; s.setAttribute('aria-controls', 'processScene'); s.addEventListener('click', () => select(i, true)); s.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); s.click(); } }); });
    /* Avanço automático só depois de "Reproduzir". O controle global "Pausar animações"
       também para o player; com movimento reduzido, "Reproduzir" avança as etapas sem
       religar as animações do site (as cenas ficam paradas). */
    function schedule() { clearTimeout(timer); if (playing && visible && !document.hidden) timer = setTimeout(() => { select((active + 1) % 4); schedule(); }, 6500); }
    function playState() { $('#processPlay').innerHTML = playing ? 'Pausar<span> etapas</span>' : 'Reproduzir<span> etapas</span>'; $('#processPlay').setAttribute('aria-pressed', String(playing)); root.classList.toggle('is-playing', playing); schedule(); }
    function select(i, manual = false) {
      active = i; if (manual) { playing = false; playState(); }
      steps.forEach((s, j) => { s.classList.toggle('active', i === j); s.setAttribute('aria-pressed', String(i === j)); });
      $('#processScene').innerHTML = scenes[i]();
      $('#processStatus').textContent = `0${i + 1} / 04`;
      $('#processTitle').textContent = copy[i][0]; $('#processDescription').textContent = copy[i][1];
      $$('[data-scene]', root).forEach((b, j) => { if (i === j) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
      $('#processNext').innerHTML = i === 3 ? 'Recomeçar' : 'Próxima<span> etapa</span>';
      if (manual && matchMedia('(max-width:900px)').matches) root.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
    }
    $$('[data-scene]', root).forEach(b => b.addEventListener('click', () => select(+b.dataset.scene, true)));
    $('#processNext').addEventListener('click', () => select((active + 1) % 4, true));
    $('#processPlay').addEventListener('click', () => { playing = !playing; if (playing && PS.motion.paused && !PS.RM) PS.motion.set(false); playState(); });
    document.addEventListener('motionchange', () => { if (PS.motion.paused) playing = false; playState(); });
    document.addEventListener('visibilitychange', schedule);
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; schedule(); }, { threshold: .1 }).observe(root);
    select(0);
  }

  tubeExperience();
  processExperience();
})();
