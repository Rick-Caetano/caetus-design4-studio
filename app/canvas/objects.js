// Ações de objetos gráficos inseridos pelo usuário (Sprint 3B): só mudam state.objects
// (lista de identidade, ver design-system/config.js e docs/ARCHITECTURE.md) via
// setState. Quem escreve no DOM do canvas é exclusivamente app/canvas/renderer.js
// (applyFreeNodes), reagindo a 'state:changed'.
//
// Todo objeto inserido precisa de uma entrada em state.elements antes de qualquer
// interação de seleção/drag/resize (app/canvas/selection.js espera que ela já exista) —
// mesmo mecanismo genérico que app/canvas/text.js já usa para texto livre, reaproveitado
// aqui sem nenhum sistema de transformação novo.

import bus from '../events/bus.js';
import manifest from '../../design-system/manifest.js';
import { getState, setState } from './state.js';
import { select } from './selection.js';
import { insertIntoOrder, removeFromOrder } from './layers.js';

let freeIdCounter = 0;

function generateId() {
  freeIdCounter += 1;
  return `object-${Date.now().toString(36)}-${freeIdCounter}`;
}

function getObjects() {
  return getState().objects;
}

function getObject(id) {
  return getState().objects.find((o) => o.id === id) || null;
}

// assetId é sempre resolvido via manifest.assetLibrary — nunca um caminho de arquivo
// literal (ver design-system/asset-library.js). `type`/`category` vêm do próprio asset,
// para uso futuro (filtros, camadas) sem precisar consultar a Asset Library de novo.
function insertObject(assetId) {
  const asset = manifest.assetLibrary.getById(assetId);
  if (!asset) return null;

  const { objects, elements, layerOrder } = getState();
  const id = generateId();
  const entry = {
    id,
    assetId: asset.id,
    type: asset.type,
    category: asset.category,
    src: asset.src,
    opacity: 1,
  };
  // Leve cascateamento, mesmo padrão de app/canvas/text.js (addText), para não empilhar
  // todo objeto novo exatamente no mesmo canto.
  const offset = 24 + (objects.length % 8) * 16;
  setState({
    objects: [...objects, entry],
    elements: { ...elements, [id]: { x: offset, y: offset, scale: 1 } },
    // Entra no topo da ordem de camadas (app/canvas/layers.js) — mais recente = mais
    // na frente.
    layerOrder: insertIntoOrder(layerOrder, id),
  });
  return id;
}

function removeObject(id) {
  const { objects, elements, layerOrder } = getState();
  const nextElements = { ...elements };
  delete nextElements[id];
  setState({
    objects: objects.filter((o) => o.id !== id),
    elements: nextElements,
    layerOrder: removeFromOrder(layerOrder, id),
  });
}

// Novo id, mesmas propriedades/asset, posição levemente deslocada a partir do transform
// atual do original — não do offset de inserção original.
function duplicateObject(id) {
  const { objects, elements, layerOrder } = getState();
  const source = objects.find((o) => o.id === id);
  if (!source) return null;

  const newId = generateId();
  const sourceTransform = elements[id] || { x: 0, y: 0, scale: 1 };
  setState({
    objects: [...objects, { ...source, id: newId }],
    elements: {
      ...elements,
      [newId]: { ...sourceTransform, x: sourceTransform.x + 24, y: sourceTransform.y + 24 },
    },
    // A cópia nasce logo ACIMA do original na ordem de camadas (comportamento Figma/
    // Canva), não sempre no topo de tudo — ver insertIntoOrder em app/canvas/layers.js.
    layerOrder: insertIntoOrder(layerOrder, newId, { after: id }),
  });
  return newId;
}

// Seleciona o objeto recém-criado logo em seguida ao setState acima: bus.emit é
// síncrono (app/events/bus.js) e renderer.js já reagiu a 'state:changed' e desenhou o
// node no DOM antes deste ponto, então select() (app/canvas/selection.js) já encontra o
// elemento via [data-editable].
bus.on('object:insert', ({ assetId }) => {
  const id = insertObject(assetId);
  if (id) select(id);
});
bus.on('object:remove', ({ id }) => removeObject(id));
bus.on('object:duplicate', ({ id }) => {
  const newId = duplicateObject(id);
  if (newId) select(newId);
});

export { getObjects, getObject, insertObject, removeObject, duplicateObject };
