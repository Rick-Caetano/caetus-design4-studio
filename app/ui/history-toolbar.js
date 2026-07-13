// Botões visuais de Undo/Redo (Ctrl+Z / Ctrl+Shift+Z já existiam como atalho em
// app/canvas/history.js — isto só adiciona o chrome). Só chama performUndo/performRedo
// e reage a 'history:changed' para habilitar/desabilitar; nunca toca o canvas.

import bus from '../events/bus.js';
import { performUndo, performRedo, canUndo, canRedo } from '../canvas/history.js';

function updateButtons() {
  document.getElementById('btn-undo').disabled = !canUndo();
  document.getElementById('btn-redo').disabled = !canRedo();
}

function initHistoryToolbar() {
  document.getElementById('btn-undo').addEventListener('click', performUndo);
  document.getElementById('btn-redo').addEventListener('click', performRedo);
  bus.on('history:changed', updateButtons);
  updateButtons();
}

export { initHistoryToolbar };
