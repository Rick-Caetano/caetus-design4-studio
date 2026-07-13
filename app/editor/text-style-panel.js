// Painel flutuante de estilo de texto: aparece sobre o canvas quando um texto (fixo ou
// livre) está selecionado — app/canvas/selection.js emite 'selection:changed' ({ key })
// toda vez que a seleção muda. Só emite 'text:style' no bus — nunca toca o canvas, mesmo
// padrão do resto de app/editor/ — e é o mesmo evento que app/editor/controls.js
// (emitCategoryStyle) já usa para o chip de Categoria. `getText`/`updateTextStyle`
// (app/canvas/text.js) e a aplicação de style (app/canvas/renderer.js
// applyTextStyleToNode) já existiam prontos; este arquivo só acrescenta a UI genérica
// que faltava (ver docs/ARCHITECTURE.md, seção "Textos dinâmicos" > "Fora de escopo
// desta sprint").
//
// Não tem botão de fechar: a visibilidade é 100% derivada da seleção (mesma fonte única
// da verdade do resto do motor) — clicar fora ou Esc já deseleciona via
// app/canvas/selection.js, e o painel some junto. Um botão de fechar só-visual criaria
// um segundo estado (painel escondido x texto ainda selecionado) sem necessidade.

import bus from '../events/bus.js';
import { getText } from '../canvas/text.js';
import themes from '../../design-system/themes/index.js';
import { renderBrandSwatches } from './brand-swatches.js';

let currentKey = null;

function isFocused(el) {
  return document.activeElement === el;
}

function isBold(fontWeight) {
  return fontWeight === '700' || fontWeight === 'bold' || Number(fontWeight) >= 700;
}

// getComputedStyle().color pode vir em qualquer notação que o CSS aceitar hoje
// (design-system/tokens.css usa oklch() nos tokens — ver docs/ARCHITECTURE.md) — nunca
// garantidamente 'rgb(...)'. <input type="color"> só aceita '#rrggbb', então resolvemos
// a cor de verdade pintando 1px num canvas (o navegador rasteriza qualquer notação em
// bytes RGB concretos) em vez de tentar interpretar a string à mão.
let hexCanvasCtx = null;
function cssColorToHex(cssColor) {
  if (!hexCanvasCtx) {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    hexCanvasCtx = canvas.getContext('2d');
  }
  hexCanvasCtx.fillStyle = cssColor;
  hexCanvasCtx.fillRect(0, 0, 1, 1);
  const [r, g, b] = hexCanvasCtx.getImageData(0, 0, 1, 1).data;
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

// Cada texto (fixo ou livre) já tem uma cor/tamanho/peso REAIS na tela, vindos do CSS do
// layout (design-system/components.css), mesmo quando state.texts[id].style não tem
// nenhum override ainda (grupos vazios são o padrão, ver design-system/config.js). Sem
// isto, o painel mostraria um valor inventado (ex.: sempre "24px") desconectado do que
// está de fato renderizado — e o menor toque no slider faria o texto saltar pro valor
// inventado em vez de partir de onde já estava.
function computedFallback(key) {
  const node = document.querySelector(`[data-editable="${key}"]`);
  const fallback = { color: '#ffffff', fontSize: 24, fontWeight: '' };
  if (!node) return fallback;
  const computed = getComputedStyle(node);
  return {
    color: cssColorToHex(computed.color) || fallback.color,
    fontSize: Math.round(parseFloat(computed.fontSize)) || fallback.fontSize,
    fontWeight: isBold(computed.fontWeight) ? '700' : '',
  };
}

function syncFromState() {
  const panel = document.getElementById('text-style-panel');
  if (!panel) return;

  const text = currentKey ? getText(currentKey) : null;
  panel.classList.toggle('hidden', !text);
  if (!text) return;

  const { typography = {}, background = {}, border = {} } = text.style || {};
  const fallback = computedFallback(currentKey);

  document.getElementById('text-style-panel-label').innerText = text.label;

  const colorInput = document.getElementById('text-style-color');
  if (!isFocused(colorInput)) colorInput.value = typography.customColor || typography.color || fallback.color;

  const bgColorInput = document.getElementById('text-style-bg-color');
  if (!isFocused(bgColorInput)) bgColorInput.value = background.customColor || background.color || '#000000';

  const hasBg = background.colorToken || background.customColor || background.color;
  document.getElementById('text-style-radius-wrap').classList.toggle('hidden', !hasBg);
  const radiusInput = document.getElementById('text-style-bg-radius');
  if (!isFocused(radiusInput)) radiusInput.value = border.radius || 0;

  const sizeInput = document.getElementById('text-style-font-size');
  const sizeVal = typography.fontSize || fallback.fontSize;
  if (!isFocused(sizeInput)) sizeInput.value = sizeVal;
  document.getElementById('text-style-font-size-val').innerText = sizeVal + 'px';

  document.getElementById('text-style-bold').classList.toggle('active', isBold(typography.fontWeight || fallback.fontWeight));

  document.querySelectorAll('[data-text-align]').forEach((btn) => {
    btn.classList.toggle('active', (typography.textAlign || 'left') === btn.dataset.textAlign);
  });

  // Swatches: destaca o token ativo em cada linha (cor do texto, cor de fundo).
  refreshSwatches(text);
}

function emitStyle(style) {
  if (!currentKey) return;
  bus.emit('text:style', { id: currentKey, style });
}

function refreshSwatches(text) {
  const typoRow = document.querySelector('#text-style-panel [data-swatch-target="typography"]');
  const bgRow   = document.querySelector('#text-style-panel [data-swatch-target="background"]');
  const typo = text.style?.typography || {};
  const bg   = text.style?.background || {};
  renderBrandSwatches(typoRow, {
    activeToken: typo.colorToken || null,
    onPick: (token) => emitStyle({ typography: { colorToken: token, customColor: '' } }),
  });
  renderBrandSwatches(bgRow, {
    activeToken: bg.colorToken || null,
    includeNone: true,
    onPick: (token) => emitStyle({ background: { colorToken: token, customColor: '' } }),
  });
}

export function initTextStylePanel() {
  bus.on('selection:changed', ({ key }) => {
    currentKey = key;
    syncFromState();
  });
  // Mantém os valores em dia durante undo/redo e arraste (state:changed dispara a cada
  // setState) — mesmo padrão de guarda de foco de app/editor/texts-panel.js
  // (isFocused/updateItemInPlace), pra não atropelar o usuário digitando/arrastando.
  bus.on('state:changed', syncFromState);
  // Se os temas terminarem de carregar depois da 1ª pintura, os swatches ainda estão
  // vazios — reemitir syncFromState pinta-os assim que a lista de tokens existir.
  themes.ready.then(syncFromState);

  document.getElementById('text-style-color').addEventListener('input', (e) => {
    // Cor manual "vence" o token — escrevemos ambos para que o renderer use custom,
    // mas mantemos colorToken null explícito para deixar claro que o usuário optou por
    // uma cor fora da paleta.
    emitStyle({ typography: { customColor: e.target.value, colorToken: null } });
  });

  document.getElementById('text-style-bg-color').addEventListener('input', (e) => {
    emitStyle({ background: { customColor: e.target.value, colorToken: null } });
  });
  document.getElementById('text-style-bg-clear').addEventListener('click', () => {
    emitStyle({ background: { customColor: '', colorToken: null, color: '' } });
  });

  document.getElementById('text-style-bg-radius').addEventListener('input', (e) => {
    emitStyle({ border: { radius: e.target.value } });
  });

  document.getElementById('text-style-font-size').addEventListener('input', (e) => {
    document.getElementById('text-style-font-size-val').innerText = e.target.value + 'px';
    emitStyle({ typography: { fontSize: e.target.value } });
  });

  document.getElementById('text-style-bold').addEventListener('click', () => {
    const text = currentKey ? getText(currentKey) : null;
    if (!text) return;
    const currentWeight = text.style.typography.fontWeight || computedFallback(currentKey).fontWeight;
    // Sempre grava um peso explícito (nunca '' pra "desligar") — alguns papéis (título)
    // já nascem bold pelo CSS do layout (design-system/components.css), então limpar o
    // override só voltaria pro mesmo 700 de sempre em vez de desmarcar de verdade.
    emitStyle({ typography: { fontWeight: isBold(currentWeight) ? '400' : '700' } });
  });

  document.querySelectorAll('[data-text-align]').forEach((btn) => {
    btn.addEventListener('click', () => emitStyle({ typography: { textAlign: btn.dataset.textAlign } }));
  });
}
