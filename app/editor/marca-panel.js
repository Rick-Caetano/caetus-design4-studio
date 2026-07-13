// Aba Marca: grid de logos da Asset Library (categoria 'logos'). Só emite 'logo:preset'
// no bus e reage a 'state:changed' para destacar o card ativo — mesmo padrão de
// app/editor/asset-picker.js. URL customizada e upload continuam ligados em
// app/editor/controls.js (não fazem parte da biblioteca).

import bus from '../events/bus.js';
import { getState } from '../canvas/state.js';
import { renderAssetGrid } from './asset-picker.js';

let searchTerm = '';
let customUrlOpen = false;

function render() {
  const grid = document.getElementById('marca-logo-grid');
  if (!grid) return;
  const { logo } = getState();

  renderAssetGrid({
    gridEl: grid,
    categories: ['logos'],
    query: searchTerm,
    activeId: logo.assetId,
    onSelect: (asset) => {
      customUrlOpen = false;
      bus.emit('logo:preset', { value: asset.id });
    },
    emptyMessage: 'Nenhum logo cadastrado no Design System ainda.',
  });

  const customWrap = document.getElementById('custom-logo-url-wrap');
  if (customWrap) customWrap.classList.toggle('hidden', !customUrlOpen && logo.assetId !== null);
}

export function initMarcaPanel() {
  render();
  bus.on('state:changed', render);

  const search = document.getElementById('marca-logo-search');
  if (search) {
    search.addEventListener('input', (e) => {
      searchTerm = e.target.value;
      render();
    });
  }

  const customToggle = document.getElementById('btn-marca-custom-url-toggle');
  if (customToggle) {
    customToggle.addEventListener('click', () => {
      customUrlOpen = true;
      render();
    });
  }
}
