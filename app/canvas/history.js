// Undo/redo do documento (Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y). Escuta 'state:changed' e
// mantém uma pilha de snapshots do state inteiro; mudanças que chegam a menos de
// COALESCE_MS uma da outra (ex.: digitar um título) viram um único passo de undo.
//
// Restaurar um snapshot só chama setState — os painéis da sidebar (app/editor/
// texts-panel.js, marca-panel.js, fundo-panel.js, sidebar-reactor.js) já se
// re-renderizam a partir de getState() a cada 'state:changed', então não é preciso
// nenhuma sincronização manual de input aqui: undo/redo funciona porque esses painéis
// já reagem ao mesmo evento que setState sempre emite.

import bus from '../events/bus.js';
import { getState, setState } from './state.js';

const MAX_HISTORY = 60;
const COALESCE_MS = 500;

let undoStack = [];
let redoStack = [];
let baseline = null;
let pendingTimer = null;
let suppressCapture = false;

function clone(state) {
  return structuredClone(state);
}

function emitHistoryChanged() {
  bus.emit('history:changed', { canUndo: undoStack.length > 0, canRedo: redoStack.length > 0 });
}

function commitPending() {
  if (!pendingTimer) return;
  clearTimeout(pendingTimer);
  pendingTimer = null;
  undoStack.push(baseline);
  if (undoStack.length > MAX_HISTORY) undoStack.shift();
  redoStack = [];
  baseline = clone(getState());
  emitHistoryChanged();
}

function onStateChanged() {
  if (suppressCapture) return;
  clearTimeout(pendingTimer);
  pendingTimer = setTimeout(commitPending, COALESCE_MS);
}

function restore(snapshot) {
  suppressCapture = true;
  setState(clone(snapshot));
  suppressCapture = false;
  baseline = clone(getState());
  emitHistoryChanged();
}

function performUndo() {
  commitPending();
  if (undoStack.length === 0) return;
  redoStack.push(clone(getState()));
  restore(undoStack.pop());
}

function performRedo() {
  if (redoStack.length === 0) return;
  undoStack.push(clone(getState()));
  restore(redoStack.pop());
}

function canUndo() {
  return undoStack.length > 0;
}

function canRedo() {
  return redoStack.length > 0;
}

function initHistory() {
  baseline = clone(getState());
  bus.on('state:changed', onStateChanged);
  emitHistoryChanged();

  document.addEventListener('keydown', (e) => {
    const meta = e.ctrlKey || e.metaKey;
    if (!meta) return;
    const key = e.key.toLowerCase();

    if (key === 'z' && e.shiftKey) {
      e.preventDefault();
      performRedo();
    } else if (key === 'z') {
      e.preventDefault();
      performUndo();
    } else if (key === 'y') {
      e.preventDefault();
      performRedo();
    }
  });
}

export { initHistory, performUndo, performRedo, canUndo, canRedo };
