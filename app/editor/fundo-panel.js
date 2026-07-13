// Aba Imagens (antiga "Fundo") — Marco 1.5 revisado: DUAS seções independentes, cada
// uma com seu grid resumido de 4 imagens e seu botão "Ver biblioteca completa" que
// abre o modal correspondente (app/editor/imagens-modal.js). "Imagem de Fundo"
// substitui o fundo atual; "Acrescentar Imagem" insere a imagem como objeto no canvas
// (roteia para 'object:insert', mesmo fluxo da aba Elementos) — as duas coexistem, uma
// nunca substitui a outra.

import bus from '../events/bus.js';
import { getState } from '../canvas/state.js';
import { renderAssetGrid } from './asset-picker.js';
import { openImagensModal } from './imagens-modal.js';

const PANEL_LIMIT = 4;
let customUrlOpen = false;

function render() {
  const { background } = getState();
  const bgGrid = document.getElementById('fundo-bg-grid');
  if (bgGrid) {
    renderAssetGrid({
      gridEl: bgGrid,
      categories: ['fundos'],
      activeId: background.preset,
      limit: PANEL_LIMIT,
      onSelect: (asset) => {
        customUrlOpen = false;
        bus.emit('bg:preset', { value: asset.id });
      },
      emptyMessage: 'Nenhum fundo cadastrado no Design System ainda.',
    });
  }

  const insertGrid = document.getElementById('imagens-insert-grid');
  if (insertGrid) {
    renderAssetGrid({
      gridEl: insertGrid,
      categories: ['fundos'],
      // Nenhum card fica "ativo" — cada clique insere um novo objeto no canvas.
      activeId: null,
      limit: PANEL_LIMIT,
      onSelect: (asset) => bus.emit('object:insert', { assetId: asset.id }),
      emptyMessage: 'Nenhuma imagem cadastrada no Design System ainda.',
    });
  }

  const noneBtn = document.getElementById('btn-fundo-none');
  if (noneBtn) noneBtn.classList.toggle('is-active-fit', background.preset === 'none');

  const customWrap = document.getElementById('custom-img-url-wrap');
  if (customWrap) customWrap.classList.toggle('hidden', !customUrlOpen && background.preset !== 'custom');
}

export function initFundoPanel() {
  render();
  bus.on('state:changed', render);

  const noneBtn = document.getElementById('btn-fundo-none');
  if (noneBtn) {
    noneBtn.addEventListener('click', () => {
      customUrlOpen = false;
      bus.emit('bg:preset', { value: 'none' });
    });
  }

  const customToggle = document.getElementById('btn-fundo-custom-url-toggle');
  if (customToggle) {
    customToggle.addEventListener('click', () => {
      customUrlOpen = true;
      render();
    });
  }

  const openBgBtn = document.getElementById('btn-imagens-bg-open');
  if (openBgBtn) openBgBtn.addEventListener('click', () => openImagensModal('bg'));

  const openInsertBtn = document.getElementById('btn-imagens-insert-open');
  if (openInsertBtn) openInsertBtn.addEventListener('click', () => openImagensModal('insert'));
}
