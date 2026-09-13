/* Diagrams are schematic, not diagnostic images. No dependencies or network calls. */
(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const assetRoot = new URL('.', document.currentScript.src);
  let paused = reduced.matches;
  const motion = document.createElement('button');
  motion.className = 'motion-control';
  motion.type = 'button';
  function syncMotion() {
    document.documentElement.classList.toggle('motion-paused', paused);
    const label=paused?'Retomar animações':'Pausar animações';
    motion.innerHTML=`<span aria-hidden="true">${paused?'▷':'Ⅱ'}</span><span class="motion-label">${label}</span>`;
    motion.setAttribute('aria-label',label);motion.title=label;
    motion.setAttribute('aria-pressed', String(paused));
    document.dispatchEvent(new Event('motionchange'));
  }
  motion.addEventListener('click', () => { paused = !paused; syncMotion(); });
  reduced.addEventListener('change', () => { paused = reduced.matches; syncMotion(); });
  const menuButton=$('#burger');
  if(menuButton)menuButton.before(motion);else document.body.append(motion);
  syncMotion();

  function defs(id) {
    return `<defs>
      <linearGradient id="${id}-gold" x1="0" x2="1"><stop stop-color="#6c4d19"/><stop offset=".2" stop-color="#d3a945"/><stop offset=".47" stop-color="#fae5a2"/><stop offset=".7" stop-color="#b48a37"/><stop offset="1" stop-color="#74541e"/></linearGradient>
      <linearGradient id="${id}-glass" x1="0" x2="1"><stop stop-color="#b4d2d3" stop-opacity=".24"/><stop offset=".12" stop-color="#e2f5f5" stop-opacity=".05"/><stop offset=".42" stop-color="#86a6b7" stop-opacity=".025"/><stop offset=".8" stop-color="#b9d3d9" stop-opacity=".07"/><stop offset=".94" stop-color="#dbecec" stop-opacity=".3"/><stop offset="1" stop-color="#668398" stop-opacity=".08"/></linearGradient>
      <linearGradient id="${id}-metal" x1="0" x2="1"><stop stop-color="#252c30"/><stop offset=".26" stop-color="#889a9c"/><stop offset=".46" stop-color="#d1d4c9"/><stop offset=".66" stop-color="#616e73"/><stop offset="1" stop-color="#252d34"/></linearGradient>
      <linearGradient id="${id}-blood" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#b84a3e"/><stop offset=".35" stop-color="#872926"/><stop offset="1" stop-color="#370f17"/></linearGradient>
      <linearGradient id="${id}-skin" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#d3b28a"/><stop offset=".2" stop-color="#a68464"/><stop offset=".6" stop-color="#67513e"/><stop offset="1" stop-color="#312921"/></linearGradient>
      <linearGradient id="${id}-bone" x1="0" x2="1"><stop stop-color="#667476"/><stop offset=".25" stop-color="#c4cebc"/><stop offset=".55" stop-color="#f0eed6"/><stop offset=".8" stop-color="#bbc4b5"/><stop offset="1" stop-color="#617075"/></linearGradient>
      <radialGradient id="${id}-aura"><stop stop-color="#dab766" stop-opacity=".23"/><stop offset="1" stop-color="#dab766" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}-cell"><stop stop-color="#e8b0a0"/><stop offset=".35" stop-color="#722123"/><stop offset=".65" stop-color="#b64c43"/><stop offset="1" stop-color="#6c242d"/></radialGradient>
      <filter id="${id}-glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="3"/></filter>
      <pattern id="${id}-knurl" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M1 0V5" stroke="#080d0f" stroke-opacity=".35"/></pattern>
    </defs>`;
  }
  const text = (x,y,t,cl='caption',extra='') => `<text x="${x}" y="${y}" class="${cl}" ${extra}>${t}</text>`;
  function platelets(x,y,w,h,n=22) {
    return Array.from({length:n},(_,i)=>`<g class="particle" style="--delay:-${(i*.37).toFixed(2)}s"><circle cx="${x+(i*43.7)%w}" cy="${y+(i*29.3)%h}" r="${1.1+i%3*.55}" fill="#ffdf8e" opacity="${.3+i%4*.16}"/><circle cx="${x+(i*43.7)%w}" cy="${y+(i*29.3)%h}" r=".6" fill="#fff2cb"/></g>`).join('');
  }
  function cells(id,x,y,w,h,n=16) {
    return Array.from({length:n},(_,i)=>`<ellipse cx="${x+(i*29.1)%w}" cy="${y+(i*19.4)%h}" rx="${4+i%3}" ry="${2.5+i%2}" fill="url(#${id}-cell)" opacity=".65" transform="rotate(${i*31} ${x+(i*29.1)%w} ${y+(i*19.4)%h})"/>`).join('');
  }
  function vial(id, {cap=true,mixed=false}={}) {
    return `<defs><clipPath id="${id}-clip"><path d="M218 100H318V394Q318 429 268 429Q218 429 218 394Z"/></clipPath></defs>
      <ellipse cx="268" cy="445" rx="75" ry="11" fill="#000" opacity=".4"/>
      <path d="M213 82H323V396Q323 436 268 436Q213 436 213 396Z" fill="#121c21" stroke="#7c939c66" stroke-width="1.5"/>
      <g clip-path="url(#${id}-clip)">
        <g class="separated-fluid" ${mixed?'opacity="0"':''}>
          <path d="M218 144Q268 152 318 144V334H218Z" fill="url(#${id}-gold)" opacity=".93"/>
          <ellipse cx="268" cy="145" rx="50" ry="6" fill="#fae4a7" opacity=".8"/>
          ${platelets(227,163,79,144)}
          <rect x="218" y="326" width="100" height="10" fill="#f1d89a"/>
          <rect x="218" y="336" width="100" height="96" fill="url(#${id}-blood)"/>
          ${cells(id,226,350,80,72)}
        </g>
        <g class="mixed-fluid" opacity="${mixed?1:0}"><rect x="218" y="145" width="100" height="291" fill="url(#${id}-blood)"/>${cells(id,227,162,82,249,28)}</g>
      </g>
      <path d="M213 82H323V396Q323 436 268 436Q213 436 213 396Z" fill="url(#${id}-glass)"/>
      <path d="M220 106V390Q220 418 241 421" stroke="#e7f1e7" stroke-opacity=".34" stroke-width="3" stroke-linecap="round" fill="none"/>
      <path d="M316 110V390" stroke="#d1e7ed" stroke-opacity=".2" stroke-width="1.5"/>
      ${Array.from({length:9},(_,i)=>`<path d="M299 ${173+i*23}h${i%2?9:13}" stroke="#fff4d4" stroke-opacity=".45"/>`).join('')}
      ${cap?`<rect x="208" y="58" width="120" height="43" rx="9" fill="url(#${id}-metal)" stroke="#a5b3ae55"/><rect x="208" y="61" width="120" height="36" rx="8" fill="url(#${id}-knurl)"/><ellipse cx="268" cy="59" rx="55" ry="6" fill="#a8ad9e"/><rect x="217" y="93" width="102" height="6" rx="3" fill="#ddc481" opacity=".65"/>`:`<ellipse cx="268" cy="85" rx="54" ry="7" fill="#132026" stroke="#9cbdc199"/><ellipse cx="268" cy="85" rx="46" ry="4" fill="#090e10"/>`}
    `;
  }
  function stage(id, content, label, view='0 0 640 430') {
    return `<svg class="lab-art" viewBox="${view}" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${defs(id)}<ellipse cx="320" cy="235" rx="255" ry="180" fill="url(#${id}-aura)"/>${content}</svg>`;
  }

  function tubeExperience() {
    const root=$('#tubeOuter') || $('.prp-tsr-grid > div:last-child'); if(!root) return;
    root.classList.add('prp-tube-outer');
    root.innerHTML=`<div class="lab-card" id="prpExplorer">
      <div class="lab-topline"><span>O que existe no seu sangue</span><span class="lab-status">Explore</span></div>
      <div id="tubeView">${stage('hero-prp',`
        <ellipse cx="268" cy="283" rx="174" ry="162" fill="none" stroke="#bfa46414"/><ellipse cx="268" cy="283" rx="195" ry="182" fill="none" stroke="#bfa4640a"/>
        <g class="float-slow">${vial('hero-prp')}<rect id="fractionFocus" x="212" y="143" width="112" height="184" rx="5" fill="none" stroke="#f2d38b" stroke-opacity=".65" stroke-width="1"/></g>
        <path class="leader flow" d="M320 204H360L376 187H407"/>${text(378,170,'Plasma')}${text(378,203,'Fração líquida')}
        <path class="leader flow" d="M319 329H380"/>${text(379,320,'Interface')}${text(379,344,'Entre as frações')}
        <path class="leader" d="M318 389H363L376 401"/>${text(379,401,'Hemácias')}${text(379,421,'Glóbulos vermelhos')}
        <circle cx="117" cy="209" r="40" fill="#10181c" stroke="#c9ae6566"/>
        <circle cx="117" cy="209" r="33" fill="url(#hero-prp-aura)"/>
        ${platelets(97,188,42,42,13)}<path d="M155 195L213 171" class="leader flow"/>
        ${text(117,269,'Plaquetas','caption','text-anchor="middle"')}${text(117,286,'Fragmentos celulares','micro','text-anchor="middle"')}
      `,'Representação esquemática das frações do sangue após centrifugação','0 0 560 478')}</div>
      <div class="lab-micro-view" id="microView" hidden><div class="lab-micro-orb"><img src="${new URL('platelets.webp',assetRoot)}" width="960" height="720" alt="Ilustração conceitual ampliada de plaquetas em plasma" loading="lazy"></div><span class="lab-micro-label">Um olhar mais próximo sobre as plaquetas</span></div>
      <div class="lab-bottom"><div class="lab-tabs" aria-label="Explore o sangue"><button type="button" data-fraction="0" aria-pressed="true">Plasma</button><button type="button" data-fraction="1" aria-pressed="false">Hemácias</button><button type="button" data-fraction="2" aria-pressed="false">Ampliar plaquetas ↗</button></div>
      <p class="lab-description" id="fractionText" aria-live="polite"></p>
      <label class="lab-range" for="separation"><span>Simule a separação <output id="separationValue">100%</output></span><input id="separation" type="range" min="0" max="100" value="100" aria-label="Progresso ilustrativo da separação do sangue"><small><span>Sangue coletado</span><span>Frações separadas</span></small></label>
      <p class="lab-note">Ilustração esquemática. Proporções e preparo variam conforme o protocolo.</p></div></div>`;
    const descriptions=[
      '<strong>Plasma.</strong> A fração líquida permite preparar o concentrado de plaquetas utilizado no PRP.',
      '<strong>Hemácias.</strong> Os glóbulos vermelhos se concentram na parte inferior durante a centrifugação.',
      '<strong>Plaquetas em detalhe.</strong> Ilustração conceitual ampliada dos fragmentos celulares envolvidos na resposta de reparação.'
    ];
    const buttons=$$('[data-fraction]',root);
    const select=i=>{
      buttons.forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));
      $('#fractionText').innerHTML=descriptions[i];
      $('#microView').hidden=i!==2;$('#tubeView').hidden=i===2;
      $('.lab-range',root).hidden=i===2;
      const focus=$('#fractionFocus');focus.setAttribute('y',i===1?'337':'143');focus.setAttribute('height',i===1?'88':'184');focus.setAttribute('stroke',i===1?'#e6a08c':'#f2d38b');
    };
    buttons.forEach((b,i)=>b.addEventListener('click',()=>select(i)));select(0);
    $('#separation').addEventListener('input',e=>{
      const k=Number(e.target.value)/100;
      $('.mixed-fluid',root).setAttribute('opacity',1-k);
      $('.separated-fluid',root).setAttribute('opacity',k);
      $('#separationValue').textContent=e.target.value+'%';
      e.target.setAttribute('aria-valuetext',k===0?'Sangue coletado':k===1?'Frações separadas':`${e.target.value}% da demonstração`);
    });
  }

  function processExperience() {
    const root=$('.process-illus-inner');if(!root)return;
    const scenes=[
      ()=>stage('collect',`
        <ellipse cx="288" cy="347" rx="237" ry="16" fill="#0005"/>
        <path d="M35 208C87 187 145 203 181 213C230 225 264 193 302 196L356 213C375 219 384 238 374 248L330 246C350 258 349 270 335 272L313 267C328 282 319 291 303 286L270 269C247 267 227 281 183 284L39 299Z" fill="url(#collect-skin)" stroke="#cead7d55" stroke-width="1.5"/>
        <path d="M48 255C110 244 126 258 161 247S216 235 256 244" stroke="#567d8859" stroke-width="5" fill="none"/>
        <path d="M47 255C110 244 126 258 161 247S216 235 256 244" stroke="#7c31314d" stroke-width="2" fill="none"/>
        <path d="M267 231L302 233M273 246L312 251M273 257L301 265" stroke="#3b2c254d" fill="none"/>
        <path d="M94 202L103 292M102 203L111 292" stroke="#c4cbbb" stroke-width="5" opacity=".65"/>
        <path d="M95 217L110 214L113 231L99 233Z" fill="url(#collect-metal)"/>
        <path d="M191 244L229 229" stroke="#e1e6dc" stroke-width="2"/>
        <path d="M220 221L244 212L250 228L226 237Z" fill="#668996" stroke="#b9e0e055"/>
        <path d="M246 218C291 198 294 153 332 153S404 180 452 172" fill="none" stroke="#7a959a55" stroke-width="9"/>
        <path d="M246 218C291 198 294 153 332 153S404 180 452 172" fill="none" stroke="#ad4d40" stroke-width="3"/>
        <path class="draw-flow" d="M246 218C291 198 294 153 332 153S404 180 452 172" fill="none" stroke="#e9a183" stroke-width="2"/>
        <g transform="translate(354 56) scale(.47)">${vial('collect',{mixed:true})}</g>
        <path d="M452 172L478 122" stroke="#bad0cf" stroke-width="2"/>
        <circle class="signal" cx="192" cy="244" r="15" fill="none" stroke="#dfc68288"/>
        <path class="leader" d="M191 222V132H98"/>${text(58,112,'Coleta venosa')}${text(58,129,'Pequena amostra de sangue','micro')}
        <path class="leader" d="M505 224H552V253"/>${text(405,302,'Tubo de coleta')}${text(405,321,'Sistema fechado','micro')}
      `,'Coleta de uma amostra de sangue por um sistema fechado'),
      ()=>stage('spin',`
        <ellipse cx="320" cy="343" rx="210" ry="24" fill="#0006"/>
        <path d="M120 212L135 302Q320 395 505 302L520 212Z" fill="url(#spin-metal)" stroke="#a4b2b33d"/>
        <path d="M137 267Q320 351 503 267V302Q320 388 137 302Z" fill="#162027" opacity=".85"/>
        <ellipse cx="320" cy="214" rx="201" ry="105" fill="#222e34" stroke="#9dafad88" stroke-width="2"/>
        <ellipse cx="320" cy="214" rx="179" ry="87" fill="#080f14" stroke="#a6b6b733"/>
        <g transform="translate(0 107) scale(1 .5)"><g class="rotor">
        <circle cx="320" cy="214" r="141" fill="#1b282e" stroke="#596e7344"/>
        ${Array.from({length:8},(_,i)=>`<g transform="rotate(${i*45} 320 214)"><rect x="306" y="80" width="28" height="79" rx="10" fill="url(#spin-glass)" stroke="#bccbc55d"/><rect x="310" y="106" width="20" height="43" rx="6" fill="url(#spin-blood)"/><rect x="307" y="80" width="26" height="17" rx="4" fill="url(#spin-gold)"/></g>`).join('')}
        <circle cx="320" cy="214" r="44" fill="url(#spin-metal)"/><circle cx="320" cy="214" r="19" fill="#25343d" stroke="#b7beae88"/>
        </g></g>
        <ellipse cx="320" cy="214" rx="190" ry="97" fill="none" stroke="#c7ab6570" stroke-dasharray="20 12" class="draw-flow"/>
        <rect x="275" y="314" width="91" height="34" rx="7" fill="#0b171e" stroke="#77888455"/>
        ${text(320,336,'EM ROTAÇÃO','micro','text-anchor="middle" style="fill:#b7d3c6"')}
        <path class="leader" d="M126 194H83V139"/>${text(54,110,'Centrifugação')}${text(54,128,'Separação por densidade','micro')}
        <path class="leader" d="M468 175L524 127"/>${text(410,81,'Amostras equilibradas')}${text(410,100,'no rotor da centrífuga','micro')}
      `,'Centrífuga com tubos equilibrados em rotação para separar as frações do sangue'),
      ()=>stage('extract',`
        <g transform="translate(30 95) scale(.7)">${vial('extract',{cap:false})}</g>
        <g transform="translate(310 10) rotate(21)">
          <path d="M0 135V268" stroke="#c1d5d5" stroke-width="2"/><path d="M0 133V268" stroke="#e6c474" stroke-width=".7"/>
          <rect x="-7" y="122" width="14" height="19" rx="2" fill="url(#extract-metal)"/>
          <rect x="-21" y="41" width="42" height="86" rx="5" fill="url(#extract-glass)" stroke="#aec8c5aa"/>
          <rect class="fluid-fill" x="-16" y="52" width="32" height="71" rx="3" fill="url(#extract-gold)" opacity=".86"/>
          ${Array.from({length:6},(_,i)=>`<path d="M11 ${53+i*11}H19" stroke="#d8e4d08c"/>`).join('')}
          <g class="plunger"><rect x="-16" y="45" width="32" height="5" fill="#364548"/><rect x="-4" y="6" width="8" height="40" fill="url(#extract-metal)"/><rect x="-25" y="1" width="50" height="7" rx="3" fill="url(#extract-metal)"/></g>
          <path d="M-31 39H31" stroke="#b3c5c0" stroke-width="5" stroke-linecap="round"/>
        </g>
        <path d="M220 258L266 140" class="leader draw-flow" stroke-width="2"/>
        <circle class="signal" cx="220" cy="258" r="23" fill="none" stroke="#ebcc7a66"/>
        ${text(67,79,'Fração selecionada')}${text(67,98,'Preparo do concentrado','micro')}
        <path class="leader" d="M311 81H455V144"/>${text(411,168,'PRP')}${text(411,190,'Plasma rico','micro')}${text(411,207,'em plaquetas','micro')}
        <circle cx="458" cy="282" r="50" fill="url(#extract-aura)" stroke="#cdb47440"/>${platelets(424,247,62,62,22)}
        ${text(320,405,'O preparo depende do protocolo utilizado.','micro','text-anchor="middle"')}
      `,'Seleção da fração plasmática para preparo do concentrado de plaquetas'),
      ()=>stage('apply',`
        <path d="M83 301C131 264 168 258 214 263C267 269 304 254 342 263C389 274 439 276 547 262L557 324C455 343 416 337 351 322C288 304 266 327 221 326C164 325 143 320 83 343Z" fill="url(#apply-skin)" opacity=".45" stroke="#e2c9a377"/>
        <path d="M92 302C159 283 190 281 225 288C251 294 265 282 275 282Q300 284 291 299Q281 312 260 308C209 312 176 300 93 322Z" fill="url(#apply-bone)" stroke="#d1ddd066"/>
        <path d="M339 285Q315 284 316 298Q322 313 345 307C408 320 466 326 549 307L547 284C457 302 399 286 339 285Z" fill="url(#apply-bone)" stroke="#d1ddd066"/>
        <path d="M285 282Q303 294 286 308M324 282Q307 294 325 309" stroke="#80b2bf" stroke-width="4" fill="none" opacity=".6"/>
        <path d="M112 270C211 239 252 256 305 255S431 271 518 250" fill="none" stroke="#cfb87f" stroke-width="7" opacity=".6"/>
        <path d="M112 270C211 239 252 256 305 255S431 271 518 250" fill="none" stroke="#e7d9b2" stroke-width="1"/>
        <path class="beam" d="M374 192L281 312L443 325Z" fill="#7eb7b82c" stroke="#9bcac938"/>
        <g transform="translate(363 157) rotate(15)"><rect width="48" height="44" rx="9" fill="url(#apply-metal)"/><rect x="3" y="34" width="42" height="12" rx="4" fill="#91a9a2"/><path d="M24 0V-30Q24 -64 67 -62" fill="none" stroke="#869b9d" stroke-width="5"/></g>
        <g transform="translate(218 122) rotate(-35)"><rect x="-18" width="36" height="77" rx="5" fill="url(#apply-glass)" stroke="#c2d3c2aa"/><rect x="-13" y="12" width="26" height="59" fill="url(#apply-gold)"/><path d="M0 79V169" stroke="#d1dddd" stroke-width="2"/><rect x="-5" y="-28" width="10" height="31" fill="url(#apply-metal)"/><path d="M-24 -29H24M-25 2H25" stroke="#c5cfc3" stroke-width="5" stroke-linecap="round"/></g>
        <circle cx="315" cy="260" r="42" fill="url(#apply-aura)"/><circle cx="315" cy="260" r="25" fill="none" stroke="#e4c67688" class="signal"/>
        ${platelets(299,247,38,29,12)}
        <path class="leader" d="M224 146H121V105"/>${text(66,72,'Aplicação localizada')}${text(66,91,'No alvo definido na avaliação','micro')}
        ${text(414,157,'Guia de imagem')}${text(414,176,'Quando indicado','micro')}
        ${text(320,385,'Representação em corte · estruturas simplificadas','micro','text-anchor="middle"')}
      `,'Aplicação localizada de PRP, com guia de imagem quando indicado')
    ];
    const copy=[['01 / COLETA','Tudo começa com uma amostra.','Uma coleta venosa fornece o sangue usado no preparo do PRP.'],['02 / CENTRIFUGAÇÃO','Cada componente em seu lugar.','A rotação separa as frações do sangue de acordo com sua densidade.'],['03 / PREPARO','Um concentrado do seu próprio sangue.','A fração selecionada é preparada conforme o protocolo do procedimento.'],['04 / APLICAÇÃO','Precisão no local indicado.','O concentrado é aplicado na região definida na avaliação médica.']];
    root.classList.add('lab-card');
    root.innerHTML=`<div class="lab-topline"><span>Do sangue ao cuidado</span><span class="lab-status" id="processStatus">01 / 04</span></div><div id="processScene"></div><div class="lab-caption" aria-live="polite"><span class="eyebrow" id="processEyebrow"></span><h4 id="processTitle"></h4><p id="processDescription"></p></div><div class="lab-bottom"><div class="lab-controls"><button type="button" class="lab-button" id="processPlay" aria-pressed="false">▷ Reproduzir etapas</button><div class="lab-progress" aria-label="Escolha uma etapa">${copy.map((c,i)=>`<button type="button" data-scene="${i}" aria-label="Etapa ${i+1}: ${c[0].split(' / ')[1]}"></button>`).join('')}</div><button type="button" class="lab-button" id="processNext">Próxima →</button></div><p class="lab-note">Demonstração ilustrativa. Tempos e técnicas variam em cada caso.</p></div>`;
    const steps=$$('.process-step');let active=0,playing=false,timer=null,visible=true;
    steps.forEach((s,i)=>{s.setAttribute('role','button');s.tabIndex=0;s.setAttribute('aria-controls','processScene');s.addEventListener('click',()=>select(i,true));s.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();s.click();}});});
    function schedule(){clearTimeout(timer);if(playing&&!paused&&visible&&!document.hidden)timer=setTimeout(()=>{select((active+1)%4);schedule();},6500);}
    function playState(){ $('#processPlay').textContent=playing?'Ⅱ Pausar etapas':'▷ Reproduzir etapas';$('#processPlay').setAttribute('aria-pressed',String(playing));schedule(); }
    function select(i,manual=false){
      active=i;if(manual){playing=false;playState();}
      steps.forEach((s,j)=>{s.classList.toggle('active',i===j);s.setAttribute('aria-pressed',String(i===j));});
      $('#processScene').innerHTML=scenes[i]();
      $('#processStatus').textContent=`0${i+1} / 04`;
      $('#processEyebrow').textContent=copy[i][0];$('#processTitle').textContent=copy[i][1];$('#processDescription').textContent=copy[i][2];
      $$('[data-scene]',root).forEach((b,j)=>{if(i===j)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
      $('#processNext').textContent=i===3?'Recomeçar ↺':'Próxima →';
      if(manual&&matchMedia('(max-width:900px)').matches)root.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'center'});
    }
    $$('[data-scene]',root).forEach(b=>b.addEventListener('click',()=>select(+b.dataset.scene,true)));
    $('#processNext').addEventListener('click',()=>select((active+1)%4,true));
    $('#processPlay').addEventListener('click',()=>{if(paused){paused=false;syncMotion();}playing=!playing;playState();});
    document.addEventListener('motionchange',schedule);document.addEventListener('visibilitychange',schedule);
    if('IntersectionObserver'in window)new IntersectionObserver(([e])=>{visible=e.isIntersecting;schedule();},{threshold:.1}).observe(root);
    select(0);
  }

  function handExperience(){
    const box=$('#handbox'),svg=$('#handSvg');if(!box||!svg)return;
    const col=box.parentElement,card=document.createElement('div');card.className='lab-card lab-hand';
    box.before(card);card.innerHTML='<div class="lab-topline"><span>Anatomia em camadas</span><span class="lab-status">Toque para explorar</span></div>';card.append(box);
    const controls=document.createElement('div');controls.className='lab-tabs';controls.setAttribute('aria-label','Camada anatômica');controls.innerHTML='<button type="button" data-layer="scan" aria-pressed="true">Explorar</button><button type="button" data-layer="bones" aria-pressed="false">Ossos</button><button type="button" data-layer="nerves" aria-pressed="false">Nervos</button>';card.append(controls);
    const info=document.createElement('div');info.className='hand-info';info.setAttribute('aria-live','polite');col.append(info);
    const descriptions=[['Túnel do carpo','Explore o nervo mediano e sua passagem pelo punho.',0],['Dedo em gatilho','Veja a região por onde deslizam os tendões que dobram o dedo.',1],['Tendões do polegar','Explore a lateral do punho, associada à tendinite de De Quervain.',2],['Articulações dos dedos','Observe as pequenas articulações responsáveis pela mobilidade dos dedos.',2]];
    const boneLayer=$('#boneLayer'),nerves=$('#nerves'),bones=$('#bones');let layer='scan';
    // Keep a readable anatomical base; the scanner highlights a local region above it.
    const base=bones.cloneNode(true);base.removeAttribute('id');$('defs',base)?.remove();base.setAttribute('opacity','.32');boneLayer.before(base);
    const ns='http://www.w3.org/2000/svg';const tendon=document.createElementNS(ns,'g');tendon.setAttribute('fill','none');tendon.setAttribute('stroke','#d1b578');tendon.setAttribute('stroke-width','1.5');tendon.setAttribute('opacity','.3');
    tendon.innerHTML='<path d="M178 442C180 378 153 309 141 159"/><path d="M191 442C196 357 186 267 184 130"/><path d="M207 442C221 358 223 270 226 147"/><path d="M166 442C168 380 118 333 84 287"/>';base.after(tendon);
    const stops=$$('#skinGrad stop');['#4f493b','#292c29','#141b1e'].forEach((c,i)=>stops[i]?.setAttribute('stop-color',c));
    // One continuous silhouette gives the palm and finger webs a natural contour.
    $('#handGeo').innerHTML='<path d="M153 452L153 410C142 396 137 374 130 355L62 286C50 272 58 254 73 256C79 256 85 261 91 268L127 309C134 316 139 310 137 299L126 124C125 105 151 102 153 122L164 257C165 267 174 265 174 255L170 103C169 84 195 82 198 102L202 252C202 265 211 265 212 252L212 118C212 99 237 97 240 118L235 266C235 277 245 279 247 268L250 161C251 144 273 145 275 162L265 303C265 350 254 393 238 411L236 452Z" stroke="none"/>';
    const folds=document.createElementNS(ns,'g');folds.setAttribute('fill','none');folds.setAttribute('stroke','#e5d5af');folds.setAttribute('stroke-width','.65');folds.setAttribute('opacity','.22');
    folds.innerHTML='<path d="M136 190Q143 193 151 191M138 196Q145 199 153 197M134 149Q141 152 148 150M177 182Q185 185 194 182M177 189Q185 192 194 189M176 139Q184 142 193 139M216 196Q223 199 232 196M216 202Q223 205 232 202M217 151Q225 154 234 151M250 212Q258 215 267 212M254 179Q261 183 270 180M86 292Q92 287 99 285M151 400Q190 408 232 400M154 410Q189 416 233 410"/>';
    boneLayer.before(folds);
    const glow=$('#edgeLight feMorphology');if(glow)glow.setAttribute('radius','.45');
    const blur=$('#edgeLight feGaussianBlur');if(blur)blur.setAttribute('stdDeviation','2');
    $('#scanC').setAttribute('r','83');$('#scanRing').setAttribute('r','79');
    function aim(x,y){$('#scanC').setAttribute('cx',x);$('#scanC').setAttribute('cy',y);$('#scanRing').setAttribute('cx',x);$('#scanRing').setAttribute('cy',y);}
    function choose(i){
      const hot=$(`.hs[data-i="${i}"]`,box);aim(hot.dataset.x,hot.dataset.y);
      $$('.hs,#handLegend button').forEach(b=>{b.classList.toggle('on',+b.dataset.i===i);b.setAttribute('aria-pressed',String(+b.dataset.i===i));});
      const d=descriptions[i];info.innerHTML=`<b>${d[0]}</b><p>${d[1]}</p><a href="#tratamentos">Conhecer o tratamento →</a>`;
      $('a',info).addEventListener('click',()=>window.__setTab?.(d[2]));
    }
    $$('.hs,#handLegend button').forEach(b=>b.addEventListener('click',()=>choose(+b.dataset.i)));
    $$('[data-layer]',card).forEach(b=>b.addEventListener('click',()=>{
      layer=b.dataset.layer;$$('[data-layer]',card).forEach(t=>t.setAttribute('aria-pressed',String(t===b)));
      if(layer==='scan')boneLayer.setAttribute('mask','url(#scanMask)');else boneLayer.removeAttribute('mask');
      bones.style.opacity=layer==='nerves'?'.15':'1';nerves.style.opacity=layer==='bones'?'0':'1';$('#scanRing').style.opacity=layer==='scan'?'1':'0';
    }));
    let pending=0;
    box.addEventListener('pointermove',e=>{
      if(e.pointerType==='touch'||layer!=='scan'||paused)return;
      cancelAnimationFrame(pending);pending=requestAnimationFrame(()=>{
        const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const matrix=svg.getScreenCTM();if(!matrix)return;
        const local=p.matrixTransform(matrix.inverse());aim(local.x,local.y);
      });
    },{passive:true});
    function position(){const m=svg.getScreenCTM();if(!m)return;const bounds=box.getBoundingClientRect();$$('.hs',box).forEach(b=>{const p=svg.createSVGPoint();p.x=+b.dataset.x;p.y=+b.dataset.y;const xy=p.matrixTransform(m);b.style.left=(xy.x-bounds.left)+'px';b.style.top=(xy.y-bounds.top)+'px';});}
    if('ResizeObserver'in window)new ResizeObserver(position).observe(box);position();
    $('.hand-hint',box).textContent='Selecione uma camada ou um ponto da mão';
    choose(0);
    const xr=$('#xray');if(xr){const scan=document.createElement('div');scan.className='xr-sweep';xr.append(scan);const label=document.createElement('div');label.className='xr-caption';xr.append(label);const update=()=>{const b=$('.xr-item.on');label.textContent=b?b.innerText.replace(/^\d\s*/, ''):'';};$$('.xr-item').forEach(b=>b.addEventListener('click',update));update();}
  }

  function accessibility(){
    const drawer=$('#drawer'),burger=$('#burger');
    if(drawer&&burger){
      burger.setAttribute('aria-controls','drawer');drawer.setAttribute('aria-label','Menu principal');
      const sync=()=>{const open=document.body.classList.contains('menu-open');drawer.inert=!open;drawer.setAttribute('aria-hidden',String(!open));burger.setAttribute('aria-label',open?'Fechar menu':'Abrir menu');const main=$('main');if(main)main.inert=open;};sync();
      new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
      document.addEventListener('keydown',e=>{if(!document.body.classList.contains('menu-open'))return;
        if(e.key==='Escape'){burger.focus();return;}
        if(e.key==='Tab'){const focusable=[burger,...$$('a,button',drawer)];const i=focusable.indexOf(document.activeElement);if(e.shiftKey&&i<=0){e.preventDefault();focusable.at(-1).focus();}else if(!e.shiftKey&&(i===focusable.length-1||i<0)){e.preventDefault();burger.focus();}}
      });
      matchMedia('(min-width:1001px)').addEventListener('change',e=>{if(e.matches&&document.body.classList.contains('menu-open'))burger.click();});
    }
    $$('.faq-item').forEach((item,i)=>{const b=$('.faq-q',item),a=$('.faq-a',item);if(!b||!a)return;a.id=`faq-answer-${i}`;b.setAttribute('aria-controls',a.id);const sync=()=>{const open=item.classList.contains('open');b.setAttribute('aria-expanded',String(open));a.inert=!open;a.setAttribute('aria-hidden',String(!open));};new MutationObserver(sync).observe(item,{attributes:true,attributeFilter:['class']});sync();});
    $$('.ind-card-new').forEach(card=>{card.setAttribute('role','button');card.tabIndex=0;const sync=()=>card.setAttribute('aria-expanded',String(card.classList.contains('open')));sync();card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();card.click();}});new MutationObserver(sync).observe(card,{attributes:true,attributeFilter:['class']});});
    $$('[role="tablist"]').forEach((list,group)=>{
      const tabs=$$('[role="tab"]',list);const panels=list.id==='xrList'?[$('#xrPanel')]:list.id==='tabNav'?$$('.pane'):[];
      function sync(){tabs.forEach((tab,i)=>{tab.id||=`tab-${group}-${i}`;const selected=tab.getAttribute('aria-selected')==='true';tab.tabIndex=selected?0:-1;const panel=panels.length===1?panels[0]:panels[i];if(panel){panel.id||=`panel-${group}-${i}`;tab.setAttribute('aria-controls',panel.id);if(selected)panel.setAttribute('aria-labelledby',tab.id);}});}
      tabs.forEach(tab=>tab.addEventListener('click',sync));
      list.addEventListener('keydown',e=>{let i=tabs.indexOf(document.activeElement);if(i<0)return;if(['ArrowRight','ArrowDown'].includes(e.key))i=(i+1)%tabs.length;else if(['ArrowLeft','ArrowUp'].includes(e.key))i=(i-1+tabs.length)%tabs.length;else if(e.key==='Home')i=0;else if(e.key==='End')i=tabs.length-1;else return;e.preventDefault();tabs[i].click();tabs[i].focus();});sync();
    });
    $$('a').filter(a=>!a.textContent.trim()&&!a.getAttribute('aria-label')&&a.href.includes('instagram')).forEach(a=>a.setAttribute('aria-label','Instagram do Dr. Pedro Sarzi'));
    const fab=$('#fab');if(fab)fab.setAttribute('aria-label','Chamar o Dr. Pedro Sarzi no Instagram');
  }
  tubeExperience();processExperience();handExperience();accessibility();
  // Pause invisible illustrations, including when the entire browser tab is hidden.
  const cards=$$('.lab-card,.xray');
  if('IntersectionObserver'in window){const io=new IntersectionObserver(entries=>entries.forEach(e=>e.target.classList.toggle('lab-offscreen',!e.isIntersecting)),{rootMargin:'100px'});cards.forEach(c=>io.observe(c));}
  document.addEventListener('visibilitychange',()=>document.documentElement.classList.toggle('lab-offscreen',document.hidden));
})();
