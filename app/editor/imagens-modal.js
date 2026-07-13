// Modais de Imagens: DUAS bibliotecas completas separadas porque os dois usos não se
// substituem —
//   - #imagens-bg-modal: aplica a imagem como FUNDO do canvas (emite 'bg:preset').
//     Destaca o card do preset ativo (activeId = background.preset).
//   - #imagens-insert-modal: insere a imagem como OBJETO no canvas (emite
//     'object:insert'), mesmo fluxo da aba Elementos — cada clique cria um novo
//     objeto, por isso nenhum card fica "ativo".
//
// Ambas leem a mesma categoria 'fundos' da Asset Library (inclui as fotos de
// assets/stock/images/*, ver local-assets-provider.js) — mesma pasta, dois usos.

import bus from '../events/bus.js';
import { getState } from '../canvas/state.js';
import { renderAssetGrid } from './asset-picker.js';

const MODALS = {
  bg: {
    modalId: 'imagens-bg-modal',
    gridId: 'imagens-bg-grid',
    highlightActive: true,
    onSelect: (asset) => bus.emit('bg:preset', { value: asset.id }),
  },
  insert: {
    modalId: 'imagens-insert-modal',
    gridId: 'imagens-insert-modal-grid',
    highlightActive: false,
    onSelect: (asset) => bus.emit('object:insert', { assetId: asset.id }),
  },
};

function renderGrid(key) {
  const cfg = MODALS[key];
  const grid = document.getElementById(cfg.gridId);
  if (!grid) return;
  const { background } = getState();
  renderAssetGrid({
    gridEl: grid,
    categories: ['fundos'],
    activeId: cfg.highlightActive ? background.preset : null,
    onSelect: (asset) => {
      cfg.onSelect(asset);
      closeImagensModal(key);
    },
    emptyMessage: 'Nenhuma imagem cadastrada no Design System ainda.',
  });
}

export function openImagensModal(key = 'bg') {
  const cfg = MODALS[key];
  if (!cfg) return;
  const modal = document.getElementById(cfg.modalId);
  if (!modal) return;
  renderGrid(key);
  modal.classList.remove('hidden');
}

export function closeImagensModal(key) {
  if (!key) { Object.keys(MODALS).forEach(closeImagensModal); return; }
  const modal = document.getElementById(MODALS[key].modalId);
  if (modal) modal.classList.add('hidden');
}

export function initImagensModal() {
  document.querySelectorAll('[data-imagens-close]').forEach((el) => {
    el.addEventListener('click', () => closeImagensModal(el.dataset.imagensClose));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeImagensModal();
  });
  // Re-renderiza os grids abertos quando o estado muda (destaque do card ativo do
  // modal de fundo acompanha trocas feitas em qualquer lugar).
  bus.on('state:changed', () => {
    Object.keys(MODALS).forEach((key) => {
      const modal = document.getElementById(MODALS[key].modalId);
      if (modal && !modal.classList.contains('hidden')) renderGrid(key);
    });
  });
}