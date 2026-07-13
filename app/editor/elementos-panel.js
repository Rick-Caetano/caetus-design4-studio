// Aba Elementos (Sprint 3B): grid de objetos gráficos da Asset Library, filtrado por
// categoria (elementos/tracos/icones/texturas). Só emite 'object:insert' no bus
// (app/canvas/objects.js aplica via o Selection System existente) e nunca toca o canvas
// — mesmo padrão de app/editor/marca-panel.js/fundo-panel.js. Reaproveita
// app/editor/asset-picker.js (mesmo grid usado por Marca/Fundo), como já previsto desde
// a Sprint 3A.
//
// Categoria (chips) e busca (substring, via asset-picker.js) já funcionam de verdade
// nesta sprint. Favoritos/recentes/marketplace são pontos de extensão preparados, não
// implementados — ver docs/ARCHITECTURE.md ("Biblioteca de Elementos: pontos de
// extensão"). Quando o pipeline de assets popular as categorias vazias de hoje, esta aba
// passa a mostrar conteúdo real sem nenhuma mudança de código, porque consome
// exclusivamente manifest.assetLibrary.

import bus from '../events/bus.js';
import { renderAssetGrid } from './asset-picker.js';

const CATEGORIES = [
  { key: 'elementos', label: 'Elementos' },
  { key: 'tracos', label: 'Traços' },
  { key: 'icones', label: 'Ícones' },
  { key: 'texturas', label: 'Texturas' },
];

let activeCategory = CATEGORIES[0].key;
let searchTerm = '';

function renderFilters() {
  const wrap = document.getElementById('elementos-category-filters');
  if (!wrap) return;
  wrap.innerHTML = '';
  CATEGORIES.forEach(({ key, label }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.className = key === activeCategory ? 'active' : '';
    btn.addEventListener('click', () => {
      activeCategory = key;
      render();
    });
    wrap.appendChild(btn);
  });
}

function render() {
  const grid = document.getElementById('elementos-grid');
  if (!grid) return;

  renderFilters();

  renderAssetGrid({
    gridEl: grid,
    categories: [activeCategory],
    query: searchTerm,
    activeId: null,
    onSelect: (asset) => bus.emit('object:insert', { assetId: asset.id }),
    emptyMessage: 'Nenhum elemento cadastrado nesta categoria ainda.',
  });
}

export function initElementosPanel() {
  render();
  bus.on('state:changed', render);

  const search = document.getElementById('elementos-search');
  if (search) {
    search.addEventListener('input', (e) => {
      searchTerm = e.target.value;
      render();
    });
  }
}
