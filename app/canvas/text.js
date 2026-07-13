// Ações de texto: só mudam state.texts (lista dinâmica, ver design-system/config.js e
// docs/ARCHITECTURE.md) via setState. Quem escreve no DOM do canvas é exclusivamente
// app/canvas/renderer.js (applyTexts), reagindo a 'state:changed'.
//
// `id` é a chave estável (usada por data-editable/state.elements) — nunca muda depois de
// criado. Renomear só edita `label`. Textos novos recebem um id gerado que não bate com
// nenhum data-editable fixo do layout atual, então o renderer os desenha como nós livres
// (mesmo mecanismo de posição/escala de app/canvas/selection.js, sem sistema novo).

import bus from '../events/bus.js';
import manifest from '../../design-system/manifest.js';
import { getState, setState } from './state.js';
import { select } from './selection.js';
import { insertIntoOrder, removeFromOrder } from './layers.js';

let freeIdCounter = 0;

function generateId() {
  freeIdCounter += 1;
  return `text-${Date.now().toString(36)}-${freeIdCounter}`;
}

// Sintaxe de destaque inline — vale para QUALQUER texto (título, subtítulo, CTA,
// selo, texto livre, nome da marca). Duas formas:
//   [palavra]           → cor de destaque padrão (.hl, --accent)
//   [palavra|#FF0000]   → cor arbitrária (hex, rgb(), nome CSS)
// O texto real em state fica com os colchetes; a formatação é só chrome do renderer.
// Escapa HTML primeiro para não permitir injeção via valor do usuário.
function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function sanitizeColor(raw) {
  // Aceita apenas caracteres válidos em cores CSS (hex, rgb(), hsl(), named).
  return raw.trim().replace(/[^a-zA-Z0-9#(),.\s%]/g, '').slice(0, 40);
}
function formatTextHighlight(str) {
  return escapeHtml(str)
    .replace(/\[([^\]|]+)(?:\|([^\]]+))?\]/g, (_m, text, color) => {
      if (color) {
        const safe = sanitizeColor(color);
        return `<span class="hl" style="color:${safe}">${text}</span>`;
      }
      return `<span class="hl">${text}</span>`;
    })
    .replace(/\n/g, '<br>');
}

// Helper puro reaproveitado por templates-modal.js/export-modal.js/seals.js — em vez de
// cada um saber a forma do array de textos, pedem o valor por id.
function getTextValue(texts, id) {
  const entry = texts.find((t) => t.id === id);
  return entry ? entry.value : '';
}

function getText(id) {
  return getState().texts.find((t) => t.id === id) || null;
}

// Categorias válidas de texto (Marco 2). Papel semântico, não regra dura de estilo —
// futuros marcos (paleta/templates) podem se orientar por isso sem precisar hardcode.
const TEXT_CATEGORIES = ['titulo-principal', 'subtitulo', 'texto', 'cta', 'tag-categoria', 'selo'];

function addText({ label, value, type, category } = {}) {
  const state = getState();
  const { texts, elements } = state;
  const entry = {
    id: generateId(),
    type: type || 'body',
    category: TEXT_CATEGORIES.includes(category) ? category : 'texto',
    label: label || 'Novo texto',
    value: value || 'Novo texto',
    // Cor explícita + fundo escuro semi-opaco (em vez de herdar var(--fg), pensado para
    // painéis claros da UI): um texto livre não sabe sobre o que vai cair (foto escura,
    // fundo branco do template 'split', ou em cima do próprio logo, que ocupa o canto
    // onde o cascateamento abaixo nasce todo texto novo) — só um fundo próprio garante
    // contraste em qualquer um desses casos, sem precisar adivinhar a cor por trás.
    // Backdrop, não `type: 'chip'`: chip é um papel semântico (categoria/tag); isto é só
    // legibilidade. applyTextStyleToNode (renderer.js) já dá padding a qualquer texto
    // com background.color, não só a chips.
    style: {
      typography: { color: '#ffffff' },
      background: { color: 'rgba(15, 23, 42, 0.82)' },
      border: {},
    },
  };
  // Todo texto novo é livre (não bate com nenhum data-editable fixo do layout atual —
  // ver app/canvas/renderer.js), então precisa de uma entrada em state.elements antes
  // de qualquer interação de seleção/drag/resize (app/canvas/selection.js espera que
  // ela já exista).
  //
  // Nasce perto do centro do canvas (a partir das dimensões do formato ativo, não um
  // pixel fixo — o mesmo texto precisa fazer sentido em 1080×1080 e em 1080×1920), nunca
  // no canto superior esquerdo: é onde o logo (state.logo, x:0/y:0) e a tag de categoria
  // já vivem em todo template (design-system/layouts.js), então qualquer texto que
  // nascesse ali ficaria empilhado atrás/sobre a marca. Um leve cascateamento evita
  // empilhar todo texto novo exatamente no mesmo ponto.
  const { formatConfig } = manifest.config;
  const { width, height } = formatConfig[state.format] || formatConfig['1:1'];
  const cascade = (texts.length % 8) * 16;
  const spawn = { x: Math.round(width / 2 - 110) + cascade, y: Math.round(height / 2 - 60) + cascade };
  setState({
    texts: [...texts, entry],
    elements: { ...elements, [entry.id]: { ...spawn, scale: 1 } },
    // Todo texto novo é livre (ver comentário acima) — entra na ordem de empilhamento
    // de camadas (app/canvas/layers.js) igual a um objeto, no topo (mais recente = mais
    // na frente).
    layerOrder: insertIntoOrder(state.layerOrder, entry.id),
  });
  return entry.id;
}

function removeText(id) {
  const { texts, elements, layerOrder } = getState();
  const nextElements = { ...elements };
  delete nextElements[id];
  setState({
    texts: texts.filter((t) => t.id !== id),
    elements: nextElements,
    layerOrder: removeFromOrder(layerOrder, id),
  });
}

function renameText(id, label) {
  const { texts } = getState();
  setState({ texts: texts.map((t) => (t.id === id ? { ...t, label } : t)) });
}

function updateText(id, value) {
  const { texts } = getState();
  setState({ texts: texts.map((t) => (t.id === id ? { ...t, value } : t)) });
}

// patch é um objeto parcial no mesmo formato de `style` ({ typography, background,
// border }) — faz merge raso por grupo, preservando o que já existia em cada um.
function updateTextStyle(id, patch) {
  const { texts } = getState();
  setState({
    texts: texts.map((t) => {
      if (t.id !== id) return t;
      return {
        ...t,
        style: {
          typography: { ...t.style.typography, ...patch.typography },
          background: { ...t.style.background, ...patch.background },
          border: { ...t.style.border, ...patch.border },
        },
      };
    }),
  });
}

// Marco 2: categoria semântica editável pelo usuário na aba Texto. Rejeita valores
// fora da whitelist para não introduzir estados inválidos via bus.
function setTextCategory(id, category) {
  if (!TEXT_CATEGORIES.includes(category)) return;
  const { texts } = getState();
  setState({ texts: texts.map((t) => (t.id === id ? { ...t, category } : t)) });
}

// Seleciona o texto recém-criado logo em seguida ao setState acima: bus.emit é síncrono
// (app/events/bus.js) e renderer.js já reagiu a 'state:changed' e desenhou o node no DOM
// antes deste ponto, então select() (app/canvas/selection.js) já encontra o elemento via
// [data-editable] — mesmo raciocínio de app/canvas/objects.js (object:insert). Também
// funciona como uma segunda garantia de visibilidade além do fundo/posição acima: mesmo
// que o texto ainda fique difícil de enxergar em algum caso não previsto, a moldura de
// seleção com alça de resize aparece imediatamente ao redor dele.
bus.on('text:add', (payload) => {
  const id = addText(payload);
  select(id);
});
bus.on('text:remove', ({ id }) => removeText(id));
bus.on('text:rename', ({ id, label }) => renameText(id, label));
bus.on('text:update', ({ id, value }) => updateText(id, value));
bus.on('text:style', ({ id, style }) => updateTextStyle(id, style));
bus.on('text:category', ({ id, category }) => setTextCategory(id, category));

export {
  TEXT_CATEGORIES,
  formatTextHighlight,
  getTextValue,
  getText,
  addText,
  removeText,
  renameText,
  updateText,
  updateTextStyle,
  setTextCategory,
};
