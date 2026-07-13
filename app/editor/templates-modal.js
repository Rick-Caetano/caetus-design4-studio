// Modal "Ver todos os modelos": busca, filtro por categoria e miniaturas AO VIVO —
// cada card clona o HTML resolvido do template e preenche com o conteúdo atual
// (getState().texts / .logo / .background), nunca lendo o canvas real nem escrevendo
// nele. Clicar num card só faz setState({ template }) — quem aplica é renderer.js.

import manifest from '../../design-system/manifest.js';
import bus from '../events/bus.js';
import { getState } from '../canvas/state.js';
import { formatTextHighlight, getTextValue } from '../canvas/text.js';
import { resolveBgSrc } from '../canvas/renderer.js';

const THUMB_NATURAL_SIZE = 1080;
const THUMB_CARD_SIZE = 220;

let activeCategory = 'Todos';
let searchTerm = '';

function buildThumb(entry) {
  const state = getState();
  const scale = THUMB_CARD_SIZE / THUMB_NATURAL_SIZE;

  const inner = document.createElement('div');
  inner.style.width = THUMB_NATURAL_SIZE + 'px';
  inner.style.height = THUMB_NATURAL_SIZE + 'px';
  inner.style.transform = `scale(${scale})`;
  inner.style.transformOrigin = 'top left';
  inner.style.position = 'relative';
  inner.style.background = 'var(--bg)';
  if (entry.canvasClass) inner.classList.add(entry.canvasClass);

  inner.innerHTML = manifest.layouts[entry.layoutKey];

  const qs = (id) => inner.querySelector(`[id="${id}"]`);
  const titleEl = qs('canvas-title');
  if (titleEl) titleEl.innerHTML = formatTextHighlight(getTextValue(state.texts, 'title'));
  const subtitleEl = qs('canvas-subtitle');
  if (subtitleEl) subtitleEl.innerText = getTextValue(state.texts, 'subtitle');
  const seloEl = qs('canvas-selo-text');
  if (seloEl) seloEl.innerText = getTextValue(state.texts, 'selo');
  const ctaEl = qs('canvas-cta-text');
  if (ctaEl) ctaEl.innerText = getTextValue(state.texts, 'cta');
  inner.querySelectorAll('[id="post-category-tag"]').forEach((tag) => {
    tag.innerText = getTextValue(state.texts, 'category');
  });

  const logoEl = inner.querySelector('.logo-img');
  if (logoEl) logoEl.src = state.logo.src;

  if (entry.capabilities.background) {
    const bgClone = document.createElement('img');
    bgClone.className = 'watermark-bg';
    bgClone.src = resolveBgSrc(state);
    bgClone.style.opacity = state.background.opacity / 100;
    bgClone.style.filter = `blur(${state.background.blur}px)`;
    const slot = inner.querySelector('[data-bg-slot]');
    if (slot) slot.appendChild(bgClone);
    else inner.prepend(bgClone);
  }

  const thumb = document.createElement('div');
  thumb.className = 'template-card-thumb';
  thumb.appendChild(inner);
  return thumb;
}

function matchesFilter(entry) {
  const inCategory = activeCategory === 'Todos' || entry.category === activeCategory;
  const term = searchTerm.trim().toLowerCase();
  const inSearch = !term || entry.label.toLowerCase().includes(term) || entry.category.toLowerCase().includes(term);
  return inCategory && inSearch;
}

function renderGrid() {
  const grid = document.getElementById('templates-grid');
  grid.innerHTML = '';
  manifest.templates.filter(matchesFilter).forEach((entry) => {
    const card = document.createElement('div');
    card.className = 'template-card';
    card.appendChild(buildThumb(entry));

    const info = document.createElement('div');
    info.className = 'template-card-info';
    info.innerHTML = `<div class="template-card-label">${entry.label}</div><div class="template-card-category">${entry.category}</div>`;
    card.appendChild(info);

    card.addEventListener('click', () => {
      bus.emit('layout:set', { style: entry.key });
      closeModal();
    });

    grid.appendChild(card);
  });
}

function renderCategoryFilters() {
  const container = document.getElementById('templates-category-filters');
  const categories = ['Todos', ...new Set(manifest.templates.map((t) => t.category))];
  container.innerHTML = '';
  categories.forEach((cat) => {
    const btn = document.createElement('button');
    btn.textContent = cat;
    btn.className = cat === activeCategory ? 'active' : '';
    btn.addEventListener('click', () => {
      activeCategory = cat;
      renderCategoryFilters();
      renderGrid();
    });
    container.appendChild(btn);
  });
}

function openModal() {
  document.getElementById('templates-modal').classList.remove('hidden');
  renderCategoryFilters();
  renderGrid();
}

function closeModal() {
  document.getElementById('templates-modal').classList.add('hidden');
}

export function initTemplatesModal() {
  document.getElementById('btn-templates-modal-open').addEventListener('click', openModal);
  document.getElementById('templates-modal-close').addEventListener('click', closeModal);
  document.getElementById('templates-modal-backdrop').addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
  document.getElementById('templates-search').addEventListener('input', (e) => {
    searchTerm = e.target.value;
    renderGrid();
  });
}

export { openModal, closeModal };
