// Atalhos de teclado globais do app (zoom, exportar, tela cheia). Não confundir com os
// atalhos de seleção de elemento (setas/Delete/Escape), que ficam em
// app/canvas/selection.js porque dependem do estado privado de "o que está selecionado".
// Este módulo só emite intents no bus ou chama ações de viewport — nunca toca o canvas.

import bus from '../events/bus.js';
import { zoomIn, zoomOut, zoomToFit } from '../canvas/zoom.js';
import { toggleFullscreen } from './fullscreen.js';

function isTypingTarget() {
  const tag = document.activeElement && document.activeElement.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA';
}

function initShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (isTypingTarget()) return;

    const meta = e.ctrlKey || e.metaKey;

    if (meta && (e.key === '=' || e.key === '+')) {
      e.preventDefault();
      zoomIn();
    } else if (meta && e.key === '-') {
      e.preventDefault();
      zoomOut();
    } else if (meta && e.key === '0') {
      e.preventDefault();
      zoomToFit();
    } else if (meta && (e.key === 'e' || e.key === 'E')) {
      e.preventDefault();
      bus.emit('export:modal:open');
    } else if (e.key === 'f' || e.key === 'F') {
      toggleFullscreen();
    }
  });
}

export { initShortcuts };
