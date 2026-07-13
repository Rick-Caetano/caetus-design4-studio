// Zoom do preview — estado de VIEWPORT, não de documento. Deliberadamente fora de
// state.js: não é conteúdo do post (não seria salvo/exportado com ele), então é a
// única exceção consciente à regra de "só o renderer.js escreve no canvas": aqui o
// próprio módulo aplica o transform de zoom diretamente, fora do ciclo state → render.

import bus from '../events/bus.js';
import manifest from '../../design-system/manifest.js';
import { getState } from './state.js';

const ZOOM_MIN = 0.1;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.1;

let currentZoom = 1;
let lastFitFormat = null;

function applyZoom() {
  const canvas = document.getElementById('post-canvas');
  canvas.style.transform = `scale(${currentZoom})`;
  canvas.style.transformOrigin = 'center center';
  document.getElementById('zoom-level-label').innerText = Math.round(currentZoom * 100) + '%';
  bus.emit('zoom:changed', { zoom: currentZoom });
}

function setZoom(z) {
  currentZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));
  applyZoom();
}

function zoomIn() {
  setZoom(currentZoom + ZOOM_STEP);
}

function zoomOut() {
  setZoom(currentZoom - ZOOM_STEP);
}

function zoomToFit() {
  const wrapper = document.querySelector('.post-wrapper');
  const { formatConfig } = manifest.config;
  const config = formatConfig[getState().format];
  const availableW = wrapper.clientWidth - 80;
  const availableH = wrapper.clientHeight - 80;
  const scale = Math.min(availableW / config.width, availableH / config.height, 1);
  setZoom(scale);
}

function initZoomControls() {
  document.getElementById('zoom-in-btn').addEventListener('click', zoomIn);
  document.getElementById('zoom-out-btn').addEventListener('click', zoomOut);
  document.getElementById('zoom-fit-btn').addEventListener('click', zoomToFit);

  document.querySelector('.post-wrapper').addEventListener('wheel', (e) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    setZoom(currentZoom + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP));
  }, { passive: false });

  bus.on('state:changed', (state) => {
    if (state.format !== lastFitFormat) {
      lastFitFormat = state.format;
      zoomToFit();
    }
  });

  zoomToFit();
}

function getZoom() {
  return currentZoom;
}

export { initZoomControls, setZoom, zoomIn, zoomOut, zoomToFit, getZoom };
