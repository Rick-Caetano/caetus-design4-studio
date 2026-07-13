// Aba Texto: renderiza a lista dinâmica de state.texts (ver design-system/config.js) e
// só emite intents no bus (text:add/text:remove/text:rename/text:update) — nunca toca o
// canvas. Reage a 'state:changed' e se re-renderiza a partir de getState(), mesmo padrão
// de app/editor/sidebar-reactor.js; isso é o que torna undo/redo "de graça" (ver
// app/canvas/history.js).
//
// Sprint 3A: só label/valor/adicionar/remover. Editor de estilo (tipografia/cor/
// alinhamento) fica fora de escopo desta sprint — a estrutura `style` já existe em
// cada texto e é aplicada pelo renderer, só não há UI para editá-la ainda.

import bus from '../events/bus.js';
import { getState } from '../canvas/state.js';

let lastRenderedIds = null;

function isFocused(el) {
  return document.activeElement === el;
}

// Ordem apresentada na UI casa com a whitelist em app/canvas/text.js (TEXT_CATEGORIES),
// mas com rótulos amigáveis. Mudar o valor emite 'text:category' — o canvas guarda o
// papel semântico mas ainda não deriva estilo automaticamente disso (será usado por
// futuros marcos de paleta/templates sem quebrar contratos).
const CATEGORY_OPTIONS = [
  { value: 'titulo-principal', label: 'Título principal' },
  { value: 'subtitulo', label: 'Subtítulo' },
  { value: 'texto', label: 'Texto' },
  { value: 'cta', label: 'CTA' },
  { value: 'tag-categoria', label: 'Tag de categoria' },
  { value: 'selo', label: 'Selo' },
];

function buildCategoryOptionsHtml(selected) {
  return CATEGORY_OPTIONS.map((opt) => {
    const sel = opt.value === selected ? ' selected' : '';
    return `<option value="${opt.value}"${sel}>${opt.label}</option>`;
  }).join('');
}

function buildItem(text) {
  const item = document.createElement('div');
  item.className = 'control-card text-item';
  item.dataset.textId = text.id;
  item.innerHTML = `
    <div class="control-card-body">
      <div class="text-item-row">
        <input type="text" class="control-input text-item-label" placeholder="Nome do texto">
        <button type="button" class="text-item-remove" title="Remover texto">✕</button>
      </div>
      <textarea class="control-input text-item-value h-16" placeholder="Conteúdo — use [palavra] para destaque padrão ou [palavra|#FF0000] para cor específica"></textarea>
      <div>
        <label class="control-label">Categoria</label>
        <select class="control-input text-item-category">
          ${buildCategoryOptionsHtml(text.category || 'texto')}
        </select>
      </div>
    </div>
  `;

  const labelInput = item.querySelector('.text-item-label');
  const valueInput = item.querySelector('.text-item-value');
  const categorySelect = item.querySelector('.text-item-category');
  const removeBtn = item.querySelector('.text-item-remove');

  labelInput.value = text.label;
  valueInput.value = text.value;

  labelInput.addEventListener('input', () => {
    bus.emit('text:rename', { id: text.id, label: labelInput.value });
  });
  valueInput.addEventListener('input', () => {
    bus.emit('text:update', { id: text.id, value: valueInput.value });
  });
  categorySelect.addEventListener('change', () => {
    bus.emit('text:category', { id: text.id, category: categorySelect.value });
  });
  removeBtn.addEventListener('click', () => {
    bus.emit('text:remove', { id: text.id });
  });

  return item;
}

function updateItemInPlace(item, text) {
  const labelInput = item.querySelector('.text-item-label');
  const valueInput = item.querySelector('.text-item-value');
  const categorySelect = item.querySelector('.text-item-category');
  if (!isFocused(labelInput)) labelInput.value = text.label;
  if (!isFocused(valueInput)) valueInput.value = text.value;
  if (categorySelect && !isFocused(categorySelect)) categorySelect.value = text.category || 'texto';
}

function render() {
  const list = document.getElementById('texts-list');
  if (!list) return;
  const { texts } = getState();
  const currentIds = texts.map((t) => t.id).join(',');

  if (currentIds === lastRenderedIds) {
    texts.forEach((text) => {
      const item = list.querySelector(`[data-text-id="${text.id}"]`);
      if (item) updateItemInPlace(item, text);
    });
    return;
  }

  list.innerHTML = '';
  texts.forEach((text) => list.appendChild(buildItem(text)));
  lastRenderedIds = currentIds;
}

export function initTextsPanel() {
  render();
  bus.on('state:changed', render);

  const addBtn = document.getElementById('btn-add-text');
  if (addBtn) {
    addBtn.addEventListener('click', () => bus.emit('text:add', {}));
  }
}
