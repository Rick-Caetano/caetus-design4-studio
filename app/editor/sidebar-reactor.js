// Reage a mudanças de estado só para atualizar o PRÓPRIO chrome da sidebar: os pills
// dos toggles de componentes reutilizáveis (state.components) e os botões do modo
// de fit do fundo. Nunca toca o canvas — isso é sempre responsabilidade de
// app/canvas/renderer.js.
//
// A lista de componentes é DINÂMICA: para cada `state.components[i]` que tenha um
// toggle na sidebar (data-component-toggle="{id}"), reflete `visible`. Zero conhecimento
// específico por peça — adicionar um componente novo com toggle na UI = adicionar um
// data-component-toggle no HTML, nada mais.

import bus from '../events/bus.js';
import { getState } from '../canvas/state.js';

function setPill(btn, dot, enabled) {
  if (!btn || !dot) return;
  dot.className = 'inline-block h-4 w-4 transform rounded-full bg-white transition-transform ' +
    (enabled ? 'translate-x-6' : 'translate-x-1');
  btn.className = 'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ' +
    (enabled ? 'bg-[#0F50E2]' : 'bg-slate-700');
}

const BG_FIT_BUTTON_BY_MODE = { free: 'btn-bg-free', contain: 'btn-bg-fit', cover: 'btn-bg-fill' };

function setActiveBgFitButton(fit) {
  document.querySelectorAll('[data-bg-fit-action]').forEach((btn) => {
    btn.classList.toggle('is-active-fit', btn.id === BG_FIT_BUTTON_BY_MODE[fit]);
  });
}

function react(state) {
  const byId = new Map((state.components || []).map((c) => [c.id, c]));
  document.querySelectorAll('[data-component-toggle]').forEach((btn) => {
    const id = btn.dataset.componentToggle;
    const dot = btn.querySelector('[data-component-toggle-dot]');
    const inst = byId.get(id);
    if (!inst) return;
    setPill(btn, dot, inst.visible !== false);
  });
  setActiveBgFitButton(state.background.fit);
}

export function initSidebarReactor() {
  react(getState());
  bus.on('state:changed', react);
}
