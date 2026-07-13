// Grid de asset picker reutilizável — usado por app/editor/marca-panel.js e
// app/editor/fundo-panel.js (e, na Sprint 3B, pela Aba Elementos). Só lê
// manifest.assetLibrary (nunca um array cru — ver design-system/asset-library.js) e
// nunca toca o canvas: quem chama decide o que fazer no `onSelect`.

import manifest from '../../design-system/manifest.js';

function collectAssets(categories, query) {
  const pool = categories.flatMap((category) => manifest.assetLibrary.getByCategory(category));
  if (!query || !query.trim()) return pool;
  const q = query.trim().toLowerCase();
  return pool.filter((asset) => (
    asset.label.toLowerCase().includes(q)
    || asset.tags.some((tag) => tag.toLowerCase().includes(q))
  ));
}

function buildCard(asset, isActive, onSelect) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'asset-card' + (isActive ? ' active' : '');
  card.dataset.assetId = asset.id;
  card.innerHTML = `
    <span class="asset-card-thumb"><img src="${asset.preview}" alt="${asset.label}"></span>
    <span class="asset-card-info">
      <span class="asset-card-label">${asset.label}</span>
      <span class="asset-card-category">${asset.category}</span>
    </span>
  `;
  card.addEventListener('click', () => onSelect(asset));
  return card;
}

// gridEl: container onde o grid é desenhado. categories: lista de categorias da Asset
// Library a mostrar juntas. query: termo de busca (Sprint 3A: substring simples).
// activeId: id do asset selecionado hoje (destaca o card). onSelect(asset): callback.
// limit (opcional): mostra só os N primeiros (Marco 1.5 — grid resumido na aba Imagens).
function renderAssetGrid({ gridEl, categories, query, activeId, onSelect, emptyMessage, limit }) {
  gridEl.innerHTML = '';
  let assets = collectAssets(categories, query);

  if (assets.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'asset-grid-empty';
    empty.textContent = emptyMessage || 'Nenhum asset encontrado nesta categoria ainda.';
    gridEl.appendChild(empty);
    return;
  }

  if (typeof limit === 'number' && limit > 0) assets = assets.slice(0, limit);

  assets.forEach((asset) => {
    gridEl.appendChild(buildCard(asset, asset.id === activeId, onSelect));
  });
}

export { renderAssetGrid };
