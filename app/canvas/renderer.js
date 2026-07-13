// ÚNICO módulo que escreve no DOM de #post-canvas. Reage a 'state:changed' (emitido por
// state.js a cada setState) e reflete o estado inteiro no canvas — nunca lê o payload de
// um evento de intent diretamente, sempre o estado corrente via getState().
//
// TUDO é componente reutilizável: texto (state.texts), objeto (state.objects) e
// componente de marca (state.components) usam os mesmos mecanismos de transform
// (state.elements[id]), camadas (state.layerOrder) e seleção. Nenhuma peça é
// "fixa de template".

import bus from '../events/bus.js';
import manifest from '../../design-system/manifest.js';
import { getState, setState } from './state.js';
import { formatTextHighlight } from './text.js';
import { computeParticipants, ensureOrder, PINNED_BOTTOM } from './layers.js';
import { isEditingText } from './selection.js';

let lastRenderedTemplate = null;

function resolveTemplateEntry(state) {
  return manifest.templates.find((t) => t.key === state.template) || manifest.templates[0];
}

function resolveBgSrc(state) {
  const { preset, customUrl } = state.background;
  if (preset === 'custom') return customUrl || '';
  if (preset === 'none') return '';
  const asset = manifest.assetLibrary.getById(preset);
  return asset ? asset.src : '';
}

function applyTextStyleToNode(node, text) {
  const { typography = {}, background = {}, border = {} } = text.style || {};
  node.style.color = typography.color || '';
  node.style.fontSize = typography.fontSize ? typography.fontSize + 'px' : '';
  node.style.fontWeight = typography.fontWeight || '';
  node.style.textAlign = typography.textAlign || '';
  node.style.backgroundColor = background.color || '';
  node.style.borderRadius = border.radius !== undefined && border.radius !== '' ? border.radius + 'px' : '';
  node.style.borderColor = border.color || '';
  node.style.borderWidth = border.width ? border.width + 'px' : '';
  node.style.padding = background.color ? '4px 8px' : '';
}

function fillTextNode(node, text) {
  if (!isEditingText(text.id)) {
    // Highlight inline (`[palavra]` / `[palavra|#cor]`) vale para QUALQUER texto,
    // não só heading — ver app/canvas/text.js#formatTextHighlight.
    node.innerHTML = formatTextHighlight(text.value);
  }
  applyTextStyleToNode(node, text);
}

function applyTexts(state, entry) {
  const container = document.getElementById('post-content-container');
  const textsById = new Map(state.texts.map((t) => [t.id, t]));

  entry.textSlots.forEach((slotId) => {
    const node = container.querySelector(`[data-editable="${slotId}"]`);
    if (!node) return;
    const text = textsById.get(slotId);
    if (!text) {
      node.style.display = 'none';
      return;
    }
    node.style.display = '';
    fillTextNode(node, text);
  });
}

// Nós LIVRES: texto livre (id fora de entry.textSlots) + todo state.objects. Ambos
// usam o mesmo mecanismo genérico de posição/escala. Empilhamento vem de z-index
// unificado (applyLayerZIndex).
function applyFreeNodes(state, entry) {
  const container = document.getElementById('post-content-container');
  const freeTexts = state.texts.filter((t) => !entry.textSlots.includes(t.id));
  const textsById = new Map(freeTexts.map((t) => [t.id, t]));
  const objectsById = new Map(state.objects.map((o) => [o.id, o]));
  const freeIds = new Set([...textsById.keys(), ...objectsById.keys()]);

  container.querySelectorAll('.canvas-free-node').forEach((node) => {
    if (!freeIds.has(node.dataset.editable)) node.remove();
  });

  freeIds.forEach((id) => {
    const text = textsById.get(id);
    if (text) {
      let node = container.querySelector(`[data-editable="${id}"]`);
      if (!node) {
        node = document.createElement('div');
        node.dataset.editable = id;
        node.className = 'canvas-free-node';
        node.dataset.freeKind = 'text';
        container.appendChild(node);
      }
      fillTextNode(node, text);
      return;
    }

    const obj = objectsById.get(id);
    let node = container.querySelector(`[data-editable="${id}"]`);
    if (!node) {
      node = document.createElement('img');
      node.dataset.editable = id;
      node.className = 'canvas-free-node';
      node.dataset.freeKind = 'object';
      container.appendChild(node);
    }
    if (node.src !== obj.src) node.src = obj.src;
    node.alt = obj.category || '';
    node.style.opacity = obj.opacity;
  });
}

// Componentes reutilizáveis do Design System (state.components). Cada instância vira
// um node absoluto dentro de #post-canvas com `data-editable="{id}"`, pintado pelo
// registry (design-system/components-registry.js). O motor só sabe "chame render pra
// esta instância" — nada específico por peça. Transform, seleção e camadas seguem os
// mesmos mecanismos dos textos/objetos.
function applyBrandComponents(state) {
  const canvas = document.getElementById('post-canvas');
  const registry = manifest.componentsRegistry;
  const existingIds = new Set(state.components.map((c) => c.id));

  canvas.querySelectorAll('[data-ds-component]').forEach((node) => {
    if (!existingIds.has(node.dataset.editable)) node.remove();
  });

  state.components.forEach((instance) => {
    let node = canvas.querySelector(`[data-editable="${instance.id}"][data-ds-component]`);
    if (!node) {
      node = document.createElement('div');
      node.dataset.editable = instance.id;
      node.dataset.dsComponent = instance.kind;
      canvas.appendChild(node);
    }
    const entry = registry[instance.kind];
    if (entry && typeof entry.render === 'function') entry.render(node, instance);
    node.style.display = instance.visible === false ? 'none' : '';
  });
}

const Z_LAYER_BASE = 100;
function applyLayerZIndex(state) {
  state.layerOrder.forEach((id, i) => {
    if (id === PINNED_BOTTOM) return;
    const el = document.querySelector(`[data-editable="${id}"]`);
    if (!el) return;
    const computed = getComputedStyle(el).position;
    if (computed === 'static') el.style.position = 'relative';
    el.style.zIndex = String(Z_LAYER_BASE + i);
  });
}

function applyLogo(state) {
  const logoImg = document.querySelector('.logo-img');
  if (!logoImg) return;
  logoImg.src = state.logo.src;
  logoImg.style.opacity = state.logo.opacity;
  logoImg.style.transformOrigin = 'top left';
  logoImg.style.transform = `translate(${state.logo.x}px, ${state.logo.y}px) scale(${state.logo.scale}) rotate(${state.logo.rotation}deg)`;
}

function applyElementTransforms(state) {
  document.querySelectorAll('[data-editable]').forEach((el) => {
    const key = el.dataset.editable;
    if (key === 'logo') return;
    const transform = state.elements[key];
    if (!transform) return;
    el.style.transformOrigin = 'top left';
    el.style.transform = `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`;
  });
}

function applyBackground(state, entry) {
  const bgImg = document.getElementById('bg-img');
  const show = entry.capabilities.background;
  bgImg.style.display = show ? 'block' : 'none';
  if (!show) return;

  const container = document.getElementById('post-content-container');
  const slot = container.querySelector('[data-bg-slot]');
  const mount = slot || document.getElementById('post-canvas');
  if (bgImg.parentElement !== mount) mount.appendChild(bgImg);

  bgImg.src = resolveBgSrc(state);
  bgImg.style.opacity = state.background.opacity / 100;
  bgImg.style.filter = `blur(${state.background.blur}px)`;
  bgImg.style.objectFit = state.background.fit === 'free' ? 'contain' : state.background.fit;
  bgImg.style.transformOrigin = 'center center';
  bgImg.style.transform = `translate(${state.background.x}px, ${state.background.y}px) scale(${state.background.scale})`;
}

function updateButtonStates(state) {
  document.querySelectorAll('[data-layout-key]').forEach((btn) => {
    const active = btn.dataset.layoutKey === state.template;
    btn.className = 'py-2 px-3 rounded-lg text-xs font-medium border ' +
      (active ? 'border-[#3b82f6] bg-[#1e293b] text-white' : 'border-transparent bg-slate-800 text-gray-400');
  });

  const { formatConfig } = manifest.config;
  Object.keys(formatConfig).forEach((fmt) => {
    const btn = document.getElementById('btn-format-' + fmt.replace(':', '-'));
    if (!btn) return;
    btn.className = fmt === state.format
      ? 'py-2 px-2 rounded-lg text-xs font-medium border border-[#3b82f6] bg-[#1e293b] text-white hover:bg-slate-700 transition'
      : 'py-2 px-2 rounded-lg text-xs font-medium border border-transparent bg-slate-800 text-gray-300 hover:bg-slate-700 transition';
    if (fmt === '1.91:1') btn.className += ' col-span-2';
  });
}

function render(state) {
  const entry = resolveTemplateEntry(state);
  const canvas = document.getElementById('post-canvas');
  const container = document.getElementById('post-content-container');

  const templateChanged = state.template !== lastRenderedTemplate;

  if (templateChanged) {
    const bgImg = document.getElementById('bg-img');
    if (bgImg.parentElement !== canvas) canvas.appendChild(bgImg);

    canvas.classList.remove('layout-cinematic');
    if (entry.canvasClass) canvas.classList.add(entry.canvasClass);
    container.innerHTML = manifest.layouts[entry.layoutKey];
    lastRenderedTemplate = state.template;
  }

  const { formatConfig } = manifest.config;
  const fmtConfig = formatConfig[state.format];
  canvas.style.width = fmtConfig.width + 'px';
  canvas.style.height = fmtConfig.height + 'px';
  canvas.style.minWidth = fmtConfig.width + 'px';
  canvas.style.minHeight = fmtConfig.height + 'px';

  applyBackground(state, entry);
  applyBrandComponents(state);
  applyTexts(state, entry);
  applyFreeNodes(state, entry);
  applyLogo(state);
  applyElementTransforms(state);
  updateButtonStates(state);

  const participants = computeParticipants(state, entry);
  const nextOrder = ensureOrder(state.layerOrder, participants);
  const changed = nextOrder.length !== state.layerOrder.length
    || nextOrder.some((id, i) => id !== state.layerOrder[i]);
  if (changed) {
    setState({ layerOrder: nextOrder });
    return;
  }
  applyLayerZIndex(state);
}

// Ações — só mudam estado, nunca tocam o DOM diretamente.
function setLayout(style) {
  const { background } = getState();
  const fit = style === 'split' ? 'contain' : 'cover';
  setState({ template: style, background: { ...background, fit, x: 0, y: 0, scale: 1 } });
}

bus.on('state:changed', render);
bus.on('layout:set', ({ style }) => setLayout(style));

export { render, setLayout, resolveTemplateEntry, resolveBgSrc };
