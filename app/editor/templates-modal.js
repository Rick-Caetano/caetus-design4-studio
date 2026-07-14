// Modal de Layouts multiempresa: "Meus layouts sob medida" (Design Documents da
// empresa atual, sempre em destaque/aba padrão) e "Mais layouts" (Design Documents
// de OUTRAS empresas com visibility=shared, separados em "⭐ Oficiais da Caetus" e
// "🏢 Compartilhados por outras empresas", agrupáveis por categoria).
//
// Os antigos templates estáticos (design-system/templates.js: minimal/cinematic/
// split) NÃO são mais a fonte deste modal — eles migraram para Design Documents
// reais de origin=official, donos da empresa caetus_systems (ver scripts de seed).
// Este modal só fala com a API (app/data/designs-api.js) e nunca lê
// empresas/*/memoria/caetus-studio/designs/ diretamente — quem faz esse scan é o
// servidor (server/designs_service.py).
//
// Cada card clona o HTML do Layout referenciado pelo `template` do documento e
// preenche com o CONTEÚDO SALVO daquele documento (doc.state), nunca com o estado
// ao vivo do canvas — diferente do comportamento antigo. Clicar num card emite
// `design:load` (ver app/canvas/design-load.js), que faz setState(doc.state) inteiro.

import manifest from '../../design-system/manifest.js';
import bus from '../events/bus.js';
import { formatTextHighlight, getTextValue } from '../canvas/text.js';
import { resolveBgSrc } from '../canvas/renderer.js';
import { getEmpresaSlug } from '../canvas/empresa-context.js';
import { listOwn, discover } from '../data/designs-api.js';

const THUMB_NATURAL_SIZE = 1080;
const THUMB_CARD_SIZE = 220;

let activeTab = 'meus'; // 'meus' | 'mais'
let activeCategory = 'Todos';
let searchTerm = '';

let ownDocs = [];
let sharedDocs = []; // resultado de discover(), inclui official + company de outras empresas

function templateEntryFor(doc) {
  return manifest.templates.find((t) => t.key === doc.state.template) || manifest.templates[0];
}

function buildThumb(doc) {
  const entry = templateEntryFor(doc);
  const state = doc.state;
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

function docCategories(doc) {
  return doc.metadata.categories && doc.metadata.categories.length ? doc.metadata.categories : ['Sem categoria'];
}

function matchesFilter(doc) {
  const inCategory = activeCategory === 'Todos' || docCategories(doc).includes(activeCategory);
  const term = searchTerm.trim().toLowerCase();
  const inSearch = !term
    || doc.metadata.name.toLowerCase().includes(term)
    || docCategories(doc).some((c) => c.toLowerCase().includes(term));
  return inCategory && inSearch;
}

function makeCard(doc) {
  const card = document.createElement('div');
  card.className = 'template-card';
  card.appendChild(buildThumb(doc));

  const info = document.createElement('div');
  info.className = 'template-card-info';
  info.innerHTML = `<div class="template-card-label">${doc.metadata.name}</div><div class="template-card-category">${docCategories(doc).join(', ')}</div>`;
  card.appendChild(info);

  card.addEventListener('click', () => {
    bus.emit('design:load', { document: doc });
    closeModal();
  });

  return card;
}

function renderSection(grid, title, docs) {
  if (!docs.length) return;
  const heading = document.createElement('div');
  heading.className = 'templates-section-title';
  heading.textContent = title;
  grid.appendChild(heading);
  docs.filter(matchesFilter).forEach((doc) => grid.appendChild(makeCard(doc)));
}

function renderGrid() {
  const grid = document.getElementById('templates-grid');
  grid.innerHTML = '';

  if (activeTab === 'meus') {
    const docs = ownDocs.filter(matchesFilter);
    if (!docs.length) {
      const hint = document.createElement('div');
      hint.className = 'templates-empty-hint';
      hint.textContent = 'Nenhum layout salvo ainda para esta empresa.';
      grid.appendChild(hint);
      return;
    }
    docs.forEach((doc) => grid.appendChild(makeCard(doc)));
    return;
  }

  const official = sharedDocs.filter((d) => d.metadata.origin === 'official');
  const shared = sharedDocs.filter((d) => d.metadata.origin !== 'official');
  renderSection(grid, '⭐ Oficiais da Caetus', official);
  renderSection(grid, '🏢 Compartilhados por outras empresas', shared);
  if (!official.length && !shared.length) {
    const hint = document.createElement('div');
    hint.className = 'templates-empty-hint';
    hint.textContent = 'Nenhum layout compartilhado disponível ainda.';
    grid.appendChild(hint);
  }
}

function renderCategoryFilters() {
  const container = document.getElementById('templates-category-filters');
  if (activeTab !== 'mais') {
    container.innerHTML = '';
    return;
  }
  const categories = ['Todos', ...new Set(sharedDocs.flatMap(docCategories))];
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

function setActiveTab(tab) {
  activeTab = tab;
  activeCategory = 'Todos';
  document.querySelectorAll('.templates-tab').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  renderCategoryFilters();
  renderGrid();
}

async function loadDocs() {
  const empresa = getEmpresaSlug();
  try {
    [ownDocs, sharedDocs] = await Promise.all([listOwn(empresa), discover(empresa)]);
  } catch (err) {
    console.warn('[templates-modal] falha ao carregar Design Documents', err);
    ownDocs = [];
    sharedDocs = [];
  }
  renderCategoryFilters();
  renderGrid();
}

function openModal() {
  document.getElementById('templates-modal').classList.remove('hidden');
  setActiveTab('meus');
  loadDocs();
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
  document.querySelectorAll('.templates-tab').forEach((btn) => {
    btn.addEventListener('click', () => setActiveTab(btn.dataset.tab));
  });
}

export { openModal, closeModal };
