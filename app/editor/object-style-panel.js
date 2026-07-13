// Painel flutuante de estilo de objeto (SVG recolorable). Emite `object:style` no bus.
import bus from '../events/bus.js';
import { getState } from '../canvas/state.js';
import { renderBrandSwatches } from './brand-swatches.js';
import themes from '../../design-system/themes/index.js';

let currentKey = null;

function getObject(id) {
  return getState().objects.find((o) => o.id === id) || null;
}

function emitStyle(patch) {
  if (!currentKey) return;
  bus.emit('object:style', { id: currentKey, style: patch });
}

function sync() {
  const panel = document.getElementById('object-style-panel');
  if (!panel) return;
  const obj = currentKey ? getObject(currentKey) : null;
  if (!obj) { panel.classList.add('hidden'); return; }
  panel.classList.remove('hidden');
  document.getElementById('object-style-panel-label').innerText = obj.category || 'Objeto';

  const canRecolor = obj.recolorable;
  document.getElementById('object-style-fill-wrap').classList.toggle('hidden', !(canRecolor && obj.supportsFill));
  document.getElementById('object-style-stroke-wrap').classList.toggle('hidden', !(canRecolor && obj.supportsStroke));
  document.getElementById('object-style-nosupport').classList.toggle('hidden', canRecolor && (obj.supportsFill || obj.supportsStroke));

  renderBrandSwatches(panel.querySelector('[data-swatch-target="fill"]'), {
    activeToken: obj.fillToken, includeNone: true,
    onPick: (t) => emitStyle({ fillToken: t, fillCustom: null }),
  });
  renderBrandSwatches(panel.querySelector('[data-swatch-target="stroke"]'), {
    activeToken: obj.strokeToken, includeNone: true,
    onPick: (t) => emitStyle({ strokeToken: t, strokeCustom: null }),
  });

  const fillIn = document.getElementById('object-style-fill-custom');
  if (document.activeElement !== fillIn) fillIn.value = obj.fillCustom || '#000000';
  const strokeIn = document.getElementById('object-style-stroke-custom');
  if (document.activeElement !== strokeIn) strokeIn.value = obj.strokeCustom || '#000000';
}

export function initObjectStylePanel() {
  bus.on('selection:changed', ({ key }) => {
    currentKey = (key && getObject(key)) ? key : null;
    sync();
  });
  bus.on('state:changed', sync);
  themes.ready.then(sync);

  document.getElementById('object-style-fill-custom').addEventListener('input', (e) =>
    emitStyle({ fillCustom: e.target.value, fillToken: null }));
  document.getElementById('object-style-fill-clear').addEventListener('click', () =>
    emitStyle({ fillCustom: null, fillToken: null }));
  document.getElementById('object-style-stroke-custom').addEventListener('input', (e) =>
    emitStyle({ strokeCustom: e.target.value, strokeToken: null }));
  document.getElementById('object-style-stroke-clear').addEventListener('click', () =>
    emitStyle({ strokeCustom: null, strokeToken: null }));
}