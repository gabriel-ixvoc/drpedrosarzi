/* ==========================================================================
   Pedro Sarzi · molde das páginas de condição (/condicoes/<slug>/), versão enxuta (25/11/2026)
   [data-copiar]: copia as perguntas para a consulta e escreve o status em #copiarStatus (aria-live).
   O molde anterior (abas com figura, ângulo do punho, vídeos, momento-assinatura) está em
   tmp/arquivo-morto/antes-condicoes-enxutas-20261125/assets/condicao.js.
   ========================================================================== */
(function () {
'use strict';
const PS = window.PS || {};
const $ = PS.$ || ((s, c) => (c || document).querySelector(s));
const $$ = PS.$$ || ((s, c) => Array.from((c || document).querySelectorAll(s)));

/* ---------- Copiar as perguntas para a consulta ---------- */
$$('[data-copiar]').forEach(btn => {
  const lista = $(btn.dataset.copiar);
  const status = document.getElementById('copiarStatus') || (btn.closest('section') && $('[role="status"]', btn.closest('section')));
  if (!lista) return;
  const rotulo = btn.textContent;
  let timer = 0;
  const tema = lista.dataset.condicao ? ` (${lista.dataset.condicao})` : '';
  const texto = () => `Perguntas para a consulta com o Dr. Pedro Sarzi${tema}:\n` +
    $$(':scope > li', lista).map((li, i) => `${i + 1}. ${li.textContent.replace(/\s+/g, ' ').trim()}`).join('\n');
  function reserva (t) {
    const ta = document.createElement('textarea');
    ta.value = t; ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
    document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    return ok;
  }
  function avisar (ok) {
    if (status) {
      status.textContent = '';
      setTimeout(() => {
        status.textContent = ok ? 'Perguntas copiadas. Cole no bloco de notas do celular e leve à consulta.' :'Não foi possível copiar aqui. Selecione a lista e copie.';
      }, 60);
    }
    if (ok) { btn.textContent = 'Perguntas copiadas'; clearTimeout(timer); timer = setTimeout(() => { btn.textContent = rotulo; }, 2600); }
  }
  btn.addEventListener('click', () => {
    const t = texto();
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(() => avisar(true), () => avisar(reserva(t)));
    else avisar(reserva(t));
  });
});

})();
