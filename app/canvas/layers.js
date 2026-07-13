// Camadas (Marco 1 v2): ordem de empilhamento UNIFICADA para TODOS os elementos
// editáveis do canvas — texto fixo do template (title/subtitle/selo/cta/category),
// logo, background, texto livre, e objetos gráficos. Substitui o escopo anterior
// (só "nós livres"), documentado no ARCHITECTURE.md ("Camadas unificadas — Marco 1
// v2"). Motivação: "trazer para frente" agora vale entre qualquer par de elementos,
// eliminando o teto de z-index fixo (.post-content:20) que fazia objetos parecerem
// "não subir" mesmo quando o layerOrder tinha reordenado corretamente.
//
// Limites estruturais (proteção contra estados que quebram o layout — ver seção da
// arquitetura):
//   • `background` fica PINADO no índice 0 (mais atrás). Nunca sobe. As 4 ações de
//     camada rejeitam pedidos de mover o background — a UI (selection.js) mostra os
//     botões desabilitados quando o background está selecionado.
//   • As decorações do template (`.diagonal-band`, `.watermark-paral`) não são
//     `[data-editable]` e não participam do layerOrder — continuam com z-index fixo
//     em CSS (design-system/components.css). São chrome do layout, não conteúdo.
//   • Todos os demais IDs editáveis (texto fixo, logo, texto livre, objeto) são
//     livremente reordenáveis.
//
// Restauração: `layers:reset` recomputa a ordem canônica (background + slots fixos do
// template ativo + logo + texto livre + objetos, na ordem de nascimento) — usado
// tanto pelo botão "Restaurar modelo" (via app/canvas/template-reset.js) quanto por
// window.CaetusStudio.resetLayerOrder().
//
// Só muda state.layerOrder via setState. Quem escreve no DOM é exclusivamente
// app/canvas/renderer.js (applyLayerZIndex), reagindo a 'state:changed'.

import bus from '../events/bus.js';
import manifest from '../../design-system/manifest.js';
import { getState, setState } from './state.js';

// Único ID pinado no fundo da pilha. Não é uma lista aberta de propósito: se surgir
// mais um "sempre atrás" no futuro, a decisão de tornar isso extensível vale ser
// feita na hora, com o segundo caso real na mão.
const PINNED_BOTTOM = 'background';

function isMovable(id) {
  return id && id !== PINNED_BOTTOM;
}

// Insere `id` numa ordem existente, sem duplicar. `after` (opcional) posiciona `id`
// logo acima de outro id já presente (usado por duplicateObject — cópia nasce colada
// acima do original, não sempre no topo de tudo); sem `after`, `id` vai para o topo
// (mais recente = mais na frente). `background`, se estiver na ordem, sempre fica no
// índice 0 — insertIntoOrder respeita isso ao filtrar+recolocar.
function insertIntoOrder(order, id, { after } = {}) {
  const withoutId = order.filter((x) => x !== id);
  let next;
  if (after) {
    const idx = withoutId.indexOf(after);
    if (idx !== -1) {
      next = [...withoutId.slice(0, idx + 1), id, ...withoutId.slice(idx + 1)];
    } else {
      next = [...withoutId, id];
    }
  } else {
    next = [...withoutId, id];
  }
  return pinBottom(next);
}

function removeFromOrder(order, id) {
  return order.filter((x) => x !== id);
}

// Se `background` estiver presente na ordem, garante que ele fica sempre no índice 0.
function pinBottom(order) {
  if (!order.includes(PINNED_BOTTOM)) return order;
  return [PINNED_BOTTOM, ...order.filter((x) => x !== PINNED_BOTTOM)];
}

// Autocorretivo: dado o `state` atual + o template ativo, devolve a lista de IDs que
// DEVEM existir em layerOrder. Chamada a cada render (renderer.js) — nada precisa
// migrar dado legado; IDs órfãos somem, IDs novos entram no topo mantendo a ordem
// prévia do usuário. `background` sempre no índice 0 se estiver participando.
function computeParticipants(state, entry) {
  const slotIds = (entry && entry.textSlots) || [];
  const freeTextIds = state.texts.filter((t) => !slotIds.includes(t.id)).map((t) => t.id);
  const objectIds = state.objects.map((o) => o.id);
  const componentIds = (state.components || []).map((c) => c.id);
  // Ordem canônica: background primeiro (piso), depois os componentes reutilizáveis
  // de marca (chrome decorativo), depois slots fixos do template + logo, e por último
  // textos livres e objetos por ordem de nascimento (topo).
  return [PINNED_BOTTOM, ...componentIds, ...slotIds, 'logo', ...freeTextIds, ...objectIds];
}

function ensureOrder(order, participants) {
  const known = new Set(participants);
  const kept = order.filter((id) => known.has(id));
  const added = participants.filter((id) => !order.includes(id));
  return pinBottom([...kept, ...added]);
}

function getLayerOrder() {
  return getState().layerOrder;
}

function moveInOrder(id, mode) {
  if (!isMovable(id)) return; // background nunca move
  const order = getLayerOrder();
  const idx = order.indexOf(id);
  if (idx === -1) return;

  // Índice mínimo permitido: 1 se background estiver pinado no 0, senão 0. Isso
  // evita que qualquer elemento passe POR BAIXO do background acidentalmente via
  // sendToBack / sendBackward.
  const floor = order[0] === PINNED_BOTTOM ? 1 : 0;

  let next = order;
  if (mode === 'front') {
    next = [...order.filter((x) => x !== id), id];
  } else if (mode === 'back') {
    const rest = order.filter((x) => x !== id);
    next = [...rest.slice(0, floor), id, ...rest.slice(floor)];
  } else if (mode === 'forward' && idx < order.length - 1) {
    next = [...order];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
  } else if (mode === 'backward' && idx > floor) {
    next = [...order];
    [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
  } else {
    return;
  }
  setState({ layerOrder: pinBottom(next) });
}

// Recomputa a ordem canônica do zero — descarta customizações do usuário. Usado por
// template-reset ("Restaurar modelo") e pela API pública resetLayerOrder().
function resetLayerOrder() {
  const state = getState();
  const entry = manifest.templates.find((t) => t.key === state.template) || manifest.templates[0];
  setState({ layerOrder: computeParticipants(state, entry) });
}

// Aliases publicados no bus: mantém o namespace 'object:' por compatibilidade com o
// código antigo (selection.js já emitia esses), mas as ações valem para qualquer
// elemento editável agora. 'layers:' é o namespace preferido para novos calls.
bus.on('object:bringToFront', ({ id }) => moveInOrder(id, 'front'));
bus.on('object:sendToBack', ({ id }) => moveInOrder(id, 'back'));
bus.on('object:bringForward', ({ id }) => moveInOrder(id, 'forward'));
bus.on('object:sendBackward', ({ id }) => moveInOrder(id, 'backward'));
bus.on('layers:bringToFront', ({ id }) => moveInOrder(id, 'front'));
bus.on('layers:sendToBack', ({ id }) => moveInOrder(id, 'back'));
bus.on('layers:bringForward', ({ id }) => moveInOrder(id, 'forward'));
bus.on('layers:sendBackward', ({ id }) => moveInOrder(id, 'backward'));
bus.on('layers:reset', () => resetLayerOrder());

export {
  PINNED_BOTTOM,
  isMovable,
  insertIntoOrder,
  removeFromOrder,
  computeParticipants,
  ensureOrder,
  getLayerOrder,
  moveInOrder,
  resetLayerOrder,
};
