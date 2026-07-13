// Seleção, drag e resize de qualquer elemento editável do canvas (título, subtítulo,
// selo, CTA, tag de categoria, logo, background e objetos gráficos inseridos via Aba
// Elementos — todos marcados com [data-editable="chave"]). Segue a mesma regra do
// resto de app/canvas/: só chama setState(...), nunca escreve o transform do elemento
// diretamente — quem aplica de verdade é app/canvas/renderer.js. O overlay de seleção
// (moldura + alça de resize + barra de ações) é a única exceção: é puro chrome de
// edição, não faz parte do documento, então é desenhado direto no DOM.
//
// Marco 1 v2 — Camadas unificadas: a barra de ações mostra os 4 botões de camada
// (enviar para trás / um nível / trazer um nível / trazer para frente) para QUALQUER
// elemento selecionado (não só objetos). Duplicar/Excluir continuam sendo específicos
// de objetos (state.objects) — só aparecem quando o selecionado é objeto. Quando o
// background está selecionado, os 4 botões de camada ficam desabilitados: background é
// o piso estrutural, pinado no índice 0 do state.layerOrder (ver app/canvas/layers.js
// e a seção "Camadas unificadas" em docs/ARCHITECTURE.md).
//
// Alt+clique cicla pela pilha de elementos sob o ponto do clique — permite selecionar
// um elemento coberto por outro sem precisar mover ninguém. Sem Alt, mantém o
// comportamento de "clica no topo" que sempre existiu.
//
// select()/deselect() emitem 'selection:changed' ({ key }) — a única forma de outro
// módulo saber o que está selecionado agora, já que `selectedKey` é privado deste
// arquivo. `key` é `null` quando nada está selecionado.

import bus from '../events/bus.js';
import { getState, setState } from './state.js';
import { getZoom } from './zoom.js';
import { PINNED_BOTTOM, isMovable } from './layers.js';

const SCALE_MIN = 0.3;
const SCALE_MAX = 3;
const NUDGE_STEP = 1;
const NUDGE_STEP_FAST = 10;

let selectedKey = null;
let overlay = null;
let dragOrigin = null; // { mode: 'move' | 'resize', startX, startY, originX, originY, startScale, naturalWidth }

// Estado do ciclo de Alt+clique: mesma posição do último Alt+clique + índice atual da
// lista de candidatos empilhados nesse ponto. Reseta quando o ponto muda.
let altCycle = null;

// Marco 2 — Text edit mode. `editingKey` é o id do texto em edição inline; `null`
// quando ninguém está editando. `editingOriginal` guarda o valor cru pré-edição
// (com colchetes) para permitir Esc = reverter. Estado privado deste módulo — quem
// precisa saber "fulano está sendo editado?" chama `isEditingText(id)` (renderer.js
// usa isso para não sobrescrever o innerText enquanto o caret está lá dentro).
let editingKey = null;
let editingOriginal = null;

function isTextKey(key) {
  return getState().texts.some((t) => t.id === key);
}

function isEditingText(id) {
  return editingKey !== null && editingKey === id;
}

// Formatação de highlight duplicada intencionalmente (mesma regra de
// app/canvas/text.js#formatTextHighlight). Reimportar de text.js criaria ciclo
// (text.js já importa `select` deste módulo). Suporta `[palavra]` e `[palavra|#cor]`.
function escapeHl(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function formatHl(str) {
  return escapeHl(str)
    .replace(/\[([^\]|]+)(?:\|([^\]]+))?\]/g, (_m, text, color) => {
      if (color) {
        const safe = color.trim().replace(/[^a-zA-Z0-9#(),.\s%]/g, '').slice(0, 40);
        return `<span class="hl" style="color:${safe}">${text}</span>`;
      }
      return `<span class="hl">${text}</span>`;
    })
    .replace(/\n/g, '<br>');
}

function getTransform(key) {
  const state = getState();
  if (key === 'logo') return state.logo;
  if (key === PINNED_BOTTOM) return state.background;
  return state.elements[key];
}

function patchTransform(key, patch) {
  const state = getState();
  if (key === 'logo') {
    setState({ logo: { ...state.logo, ...patch } });
  } else if (key === PINNED_BOTTOM) {
    // Ajuste manual do fundo (drag, resize, nudge) preserva o fit atual. Isso permite
    // arrastar uma imagem em "Ajustar" sem ela voltar para Livre/Preencher, especialmente
    // no layout Editorial, onde o usuário precisa mover a foto inteira dentro do painel.
    setState({ background: { ...state.background, ...patch } });
  } else {
    setState({ elements: { ...state.elements, [key]: { ...state.elements[key], ...patch } } });
  }
}

function findEditable(key) {
  return document.querySelector(`[data-editable="${key}"]`);
}

function isTypingTarget() {
  const el = document.activeElement;
  if (!el) return false;
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') return true;
  // Um nó em Text edit mode (Marco 2) é contentEditable — trata como campo de texto
  // para atalhos globais (setas, Delete, [ ]) não vazarem para o canvas.
  return el.isContentEditable === true;
}

// ─── Marco 2 — Text edit mode ────────────────────────────────────────────────────
// Duplo clique (ou Enter com o texto já selecionado) num nó de texto entra aqui.
// contentEditable=true, drag/resize suprimidos nesse nó, Enter confirma e mantém a
// seleção ativa, Esc cancela e reverte. Sem Shift+Enter — multilinha é feita pela
// aba Texto (a UX inline é para ajustes rápidos). Não há sistema de transformação
// novo: só um estado a mais dentro do próprio Selection System.

function enterTextEdit(key) {
  if (editingKey === key) return;
  const text = getState().texts.find((t) => t.id === key);
  const target = findEditable(key);
  if (!text || !target) return;
  editingKey = key;
  editingOriginal = text.value;
  target.setAttribute('contenteditable', 'true');
  target.spellcheck = false;
  // Valor cru (com [colchetes]) — a formatação de highlight é chrome do renderer,
  // não parte do texto real. O usuário edita o que está de fato em state.
  target.innerText = text.value;
  target.focus();
  const range = document.createRange();
  range.selectNodeContents(target);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  // Overlay atrapalha a interação nativa de seleção de texto — some durante a
  // edição e volta ao confirmar/cancelar (updateOverlayPosition reposiciona certo).
  overlay.classList.add('hidden');
}

function restoreRenderedText(key) {
  const target = findEditable(key);
  if (!target) return;
  const text = getState().texts.find((t) => t.id === key);
  if (!text) return;
  target.innerHTML = formatHl(text.value);
}

function exitTextEdit(commit) {
  if (!editingKey) return;
  const key = editingKey;
  const target = findEditable(key);
  const original = editingOriginal;
  editingKey = null;
  editingOriginal = null;
  if (target) {
    target.removeAttribute('contenteditable');
    target.blur();
  }
  if (commit && target) {
    const newValue = target.innerText;
    if (newValue !== original) {
      // Emite intent — text.js aplica setState, renderer re-renderiza com a formatação
      // correta (heading passa por formatTextHighlight de novo).
      bus.emit('text:update', { id: key, value: newValue });
    } else {
      restoreRenderedText(key);
    }
  } else {
    restoreRenderedText(key);
  }
  if (selectedKey === key) {
    overlay.classList.remove('hidden');
    updateActionButtons(key);
    updateOverlayPosition();
  }
}



// Barra de ações redesenhada (Marco 1 v2): grupo compacto de 4 botões de camada
// SEMPRE visível quando algo está selecionado (não só para objetos). Duplicar/Excluir
// continuam num segundo grupo, só habilitado para objetos. Ícones inline, viewBox
// 24x24, mesma linguagem visual que Figma/Illustrator para "trazer para frente"
// (barra + seta = tudo de uma vez) vs. seta só (um nível).
function buildOverlay() {
  const el = document.createElement('div');
  el.id = 'selection-overlay';
  el.className = 'selection-overlay hidden';
  el.innerHTML = `
    <div class="selection-handle selection-handle-se" data-resize-handle></div>
    <div class="selection-actions" data-object-actions>
      <div class="selection-actions-group" data-group="layers">
        <button type="button" class="selection-action-btn" data-action="sendToBack" title="Enviar para trás ( Ctrl+[ )" aria-label="Enviar para trás">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v10"></path><path d="M8 15l4 4 4-4"></path><path d="M5 19h14"></path></svg>
        </button>
        <button type="button" class="selection-action-btn" data-action="sendBackward" title="Enviar um nível ( [ )" aria-label="Enviar um nível">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v9"></path><path d="M8 14l4 4 4-4"></path></svg>
        </button>
        <button type="button" class="selection-action-btn" data-action="bringForward" title="Trazer um nível ( ] )" aria-label="Trazer um nível">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19v-9"></path><path d="M8 10l4-4 4 4"></path></svg>
        </button>
        <button type="button" class="selection-action-btn" data-action="bringToFront" title="Trazer para frente ( Ctrl+] )" aria-label="Trazer para frente">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V9"></path><path d="M8 10l4-4 4 4"></path><path d="M5 5h14"></path></svg>
        </button>
      </div>
      <div class="selection-actions-divider" data-only-for="object"></div>
      <div class="selection-actions-group" data-group="object" data-only-for="object">
        <button type="button" class="selection-action-btn" data-action="duplicate" title="Duplicar ( Ctrl+D )" aria-label="Duplicar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"></rect><path d="M4 16V6a2 2 0 0 1 2-2h10"></path></svg>
        </button>
        <button type="button" class="selection-action-btn selection-action-btn-danger" data-action="delete" title="Excluir ( Delete )" aria-label="Excluir">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path></svg>
        </button>
      </div>
    </div>
  `;
  return el;
}

// Objetos (state.objects) são a única categoria de elemento editável que pode ser
// removida de verdade — texto/logo/fundo continuam com Delete = resetar transform.
function isObjectKey(key) {
  return getState().objects.some((o) => o.id === key);
}

// Altura (em espaço do canvas, não de tela) que a barra de ações precisa acima da
// seleção — bate com o `top: -48px` de .selection-actions em styles/layout.css. Quando
// não cabe (elemento perto do topo do canvas), a barra alterna para abaixo da seleção
// via .selection-actions-below — sem isso ela ficaria cortada por
// #post-canvas { overflow: hidden }, que existe de propósito para o crop do fundo.
const ACTIONS_BAR_CLEARANCE = 56;

function updateOverlayPosition() {
  if (!selectedKey) return;
  const target = findEditable(selectedKey);
  if (!target) {
    deselect();
    return;
  }
  const canvas = document.getElementById('post-canvas');
  const zoom = getZoom();
  const canvasRect = canvas.getBoundingClientRect();
  const targetRect = getSelectionRect(selectedKey, target);

  const top = (targetRect.top - canvasRect.top) / zoom;
  overlay.style.left = (targetRect.left - canvasRect.left) / zoom + 'px';
  overlay.style.top = top + 'px';
  overlay.style.width = targetRect.width / zoom + 'px';
  overlay.style.height = targetRect.height / zoom + 'px';

  const actions = overlay.querySelector('[data-object-actions]');
  actions.classList.toggle('selection-actions-below', top < ACTIONS_BAR_CLEARANCE);
}

// Atualiza visibilidade/estado dos botões da barra em função do tipo do selecionado:
//   • layer buttons: sempre presentes, mas desabilitados se o item for o background
//     (pinado) — tooltip explica a razão. Para todos os outros, habilitados.
//   • duplicate/delete: só existem no DOM para objetos ([data-only-for="object"]).
function updateActionButtons(key) {
  const actions = overlay.querySelector('[data-object-actions]');
  const isObj = isObjectKey(key);
  actions.querySelectorAll('[data-only-for="object"]').forEach((n) => {
    n.hidden = !isObj;
  });
  const pinned = key === PINNED_BOTTOM;
  actions.querySelectorAll('[data-group="layers"] .selection-action-btn').forEach((btn) => {
    btn.disabled = pinned;
    btn.classList.toggle('is-disabled', pinned);
    if (pinned) {
      btn.dataset.disabledReason = 'O fundo permanece sempre atrás (piso estrutural).';
    } else {
      delete btn.dataset.disabledReason;
    }
  });
}

function select(key) {
  selectedKey = key;
  overlay.classList.remove('hidden');
  updateActionButtons(key);
  updateOverlayPosition();
  bus.emit('selection:changed', { key: selectedKey });
}

function deselect() {
  if (editingKey) exitTextEdit(true);
  selectedKey = null;
  overlay.classList.add('hidden');
  altCycle = null;
  bus.emit('selection:changed', { key: selectedKey });
}

// Delete/Backspace: para um objeto, remove de verdade. Para qualquer outro elemento
// editável, mantém o comportamento de reset de posição/escala.
function deleteSelected() {
  if (!selectedKey) return;
  if (isObjectKey(selectedKey)) {
    bus.emit('object:remove', { id: selectedKey });
    deselect();
  } else {
    patchTransform(selectedKey, { x: 0, y: 0, scale: 1 });
  }
}

function duplicateSelected() {
  if (!selectedKey || !isObjectKey(selectedKey)) return;
  bus.emit('object:duplicate', { id: selectedKey });
}

function startMove(e, key) {
  const transform = getTransform(key);
  dragOrigin = {
    mode: 'move',
    startX: e.clientX,
    startY: e.clientY,
    originX: transform.x,
    originY: transform.y,
  };
}

function startResize(e, key) {
  const transform = getTransform(key);
  const target = findEditable(key);
  const zoom = getZoom();
  const currentWidthLocal = getSelectionRect(key, target).width / zoom;
  dragOrigin = {
    mode: 'resize',
    startX: e.clientX,
    startY: e.clientY,
    startScale: transform.scale,
    naturalWidth: currentWidthLocal / transform.scale,
  };
}

// Para o background em contain/free, o DOM do <img> ocupa o frame inteiro, mas a foto
// visível pode ocupar só parte dele. O overlay e a sensibilidade do resize seguem a
// área visível da foto, não o frame inteiro — no Editorial isso evita a sensação de que
// "a parte inteira do background" foi selecionada quando a imagem está ajustada.
function getSelectionRect(key, target) {
  if (key !== PINNED_BOTTOM) return target.getBoundingClientRect();

  const { background } = getState();
  if (background.fit === 'cover') return target.getBoundingClientRect();

  const rect = target.getBoundingClientRect();
  const naturalWidth = target.naturalWidth || 0;
  const naturalHeight = target.naturalHeight || 0;
  if (!naturalWidth || !naturalHeight || !rect.width || !rect.height) return rect;

  const ratio = Math.min(rect.width / naturalWidth, rect.height / naturalHeight);
  const visibleWidth = naturalWidth * ratio;
  const visibleHeight = naturalHeight * ratio;
  return {
    left: rect.left + (rect.width - visibleWidth) / 2,
    top: rect.top + (rect.height - visibleHeight) / 2,
    right: rect.left + (rect.width + visibleWidth) / 2,
    bottom: rect.top + (rect.height + visibleHeight) / 2,
    width: visibleWidth,
    height: visibleHeight,
  };
}

// Retorna todos os [data-editable] do canvas empilhados sob o ponto (clientX,clientY),
// do topo visual para o fundo — usado pelo Alt+clique para ciclar por sobreposições.
// document.elementsFromPoint respeita a pintura real (z-index computado por
// applyLayerZIndex), então já reflete a ordem correta sem duplicar cálculo.
function editablesAtPoint(clientX, clientY) {
  const stack = document.elementsFromPoint(clientX, clientY);
  const seen = new Set();
  const result = [];
  for (const node of stack) {
    const editable = node.closest && node.closest('[data-editable]');
    if (!editable) continue;
    const key = editable.dataset.editable;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(key);
  }
  return result;
}

// Alt+clique: se a lista de candidatos empilhados no ponto for a mesma da última
// vez, avança para o próximo; senão, começa uma nova sequência a partir do topo. A
// primeira Alt+clique num ponto novo NÃO precisa dar a mesma resposta de um clique
// simples (ir pro topo) — vai direto para o segundo elemento visualmente, que é o
// que o usuário normalmente quer (o topo ele já podia selecionar sem Alt).
function altCyclePick(clientX, clientY) {
  const candidates = editablesAtPoint(clientX, clientY);
  if (candidates.length === 0) return null;
  const signature = candidates.join('|');
  if (!altCycle || altCycle.signature !== signature) {
    altCycle = { signature, index: candidates.length > 1 ? 1 : 0 };
  } else {
    altCycle.index = (altCycle.index + 1) % candidates.length;
  }
  return candidates[altCycle.index];
}

function onPointerDown(e) {
  // Text edit mode (Marco 2): se o clique é DENTRO do nó em edição, deixa a interação
  // nativa de contentEditable acontecer (posicionar caret, selecionar). Fora dele,
  // confirma a edição antes de processar como seleção nova.
  if (editingKey) {
    const withinEditing = e.target.closest(`[data-editable="${editingKey}"]`);
    if (withinEditing) return;
    exitTextEdit(true);
  }

  const handle = e.target.closest('[data-resize-handle]');
  if (handle) {
    if (!selectedKey) return;
    e.preventDefault();
    e.stopPropagation();
    startResize(e, selectedKey);
    return;
  }


  if (e.target.closest('[data-object-actions]')) return;

  // Alt+clique: ciclar pela pilha de elementos sob o cursor.
  if (e.altKey) {
    const key = altCyclePick(e.clientX, e.clientY);
    if (!key) {
      deselect();
      return;
    }
    e.preventDefault();
    if (key !== selectedKey) select(key);
    startMove(e, key);
    return;
  }

  const editable = e.target.closest('[data-editable]');
  if (!editable) {
    deselect();
    return;
  }

  e.preventDefault();
  const key = editable.dataset.editable;
  if (key !== selectedKey) {
    select(key);
    altCycle = null; // clique simples "reseta" a sequência de ciclo
  }
  startMove(e, key);
}

function onPointerMove(e) {
  if (!dragOrigin || !selectedKey) return;
  const zoom = getZoom();

  if (dragOrigin.mode === 'move') {
    const x = dragOrigin.originX + (e.clientX - dragOrigin.startX) / zoom;
    const y = dragOrigin.originY + (e.clientY - dragOrigin.startY) / zoom;
    patchTransform(selectedKey, { x, y });
  } else if (dragOrigin.mode === 'resize') {
    const deltaX = (e.clientX - dragOrigin.startX) / zoom;
    const scale = Math.max(SCALE_MIN, Math.min(SCALE_MAX, dragOrigin.startScale + deltaX / dragOrigin.naturalWidth));
    patchTransform(selectedKey, { scale });
  }
}

function onPointerUp() {
  dragOrigin = null;
}

function onKeyDown(e) {
  // Text edit mode (Marco 2): Enter confirma e mantém a seleção; Esc reverte. Nenhum
  // outro atalho global deve disparar enquanto o usuário digita — o `return` embaixo
  // impede vazamento para Delete/[/]/setas.
  if (editingKey) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      exitTextEdit(true);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      exitTextEdit(false);
    }
    return;
  }

  if (!selectedKey || isTypingTarget()) return;

  // Enter com um texto selecionado entra em Text edit mode (mesmo gesto do dblclick).
  if (e.key === 'Enter' && isTextKey(selectedKey)) {
    e.preventDefault();
    enterTextEdit(selectedKey);
    return;
  }

  if (e.key === 'Escape') {
    deselect();
    return;
  }


  const meta = e.ctrlKey || e.metaKey;
  if (meta && e.key.toLowerCase() === 'd') {
    if (isObjectKey(selectedKey)) {
      e.preventDefault();
      duplicateSelected();
    }
    return;
  }

  // Atalhos de camada (Marco 1 v2): [ / ] = um nível; Ctrl+[ / Ctrl+] = tudo. Só
  // dispara se o elemento for movível (background é pinado, ver layers.js).
  if ((e.key === '[' || e.key === ']') && isMovable(selectedKey)) {
    e.preventDefault();
    const action = e.key === ']'
      ? (meta ? 'bringToFront' : 'bringForward')
      : (meta ? 'sendToBack' : 'sendBackward');
    bus.emit(`layers:${action}`, { id: selectedKey });
    return;
  }

  if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault();
    deleteSelected();
    return;
  }

  const step = e.shiftKey ? NUDGE_STEP_FAST : NUDGE_STEP;
  const transform = getTransform(selectedKey);
  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    patchTransform(selectedKey, { x: transform.x - step });
  } else if (e.key === 'ArrowRight') {
    e.preventDefault();
    patchTransform(selectedKey, { x: transform.x + step });
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    patchTransform(selectedKey, { y: transform.y - step });
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    patchTransform(selectedKey, { y: transform.y + step });
  }
}

function initSelection() {
  const canvas = document.getElementById('post-canvas');
  overlay = buildOverlay();
  canvas.appendChild(overlay);

  canvas.addEventListener('mousedown', onPointerDown);
  document.addEventListener('mousemove', onPointerMove);
  document.addEventListener('mouseup', onPointerUp);
  document.addEventListener('keydown', onKeyDown);
  window.addEventListener('resize', updateOverlayPosition);

  // Duplo clique num nó de texto entra em Text edit mode (Marco 2). Duplo clique em
  // qualquer outra coisa (objeto, logo, fundo) segue sem efeito por enquanto — o
  // Viewport mode do Marco 6 vai ocupar esse gesto para objetos-foto.
  canvas.addEventListener('dblclick', (e) => {
    const editable = e.target.closest('[data-editable]');
    if (!editable) return;
    const key = editable.dataset.editable;
    if (!isTextKey(key)) return;
    e.preventDefault();
    if (key !== selectedKey) select(key);
    enterTextEdit(key);
  });


  overlay.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
    e.stopPropagation();
    deleteSelected();
  });
  overlay.querySelector('[data-action="duplicate"]').addEventListener('click', (e) => {
    e.stopPropagation();
    duplicateSelected();
  });
  // Camadas (Marco 1 v2, ver app/canvas/layers.js) — só emitem o intent; layers.js é
  // quem reordena state.layerOrder via setState. Namespace 'layers:' é o preferido;
  // o antigo 'object:' segue ouvido em layers.js por compatibilidade.
  ['sendToBack', 'sendBackward', 'bringForward', 'bringToFront'].forEach((action) => {
    overlay.querySelector(`[data-action="${action}"]`).addEventListener('click', (e) => {
      e.stopPropagation();
      if (!selectedKey || !isMovable(selectedKey)) return;
      bus.emit(`layers:${action}`, { id: selectedKey });
    });
  });

  bus.on('state:changed', () => {
    if (selectedKey) updateActionButtons(selectedKey);
    updateOverlayPosition();
  });
  bus.on('zoom:changed', updateOverlayPosition);
}

export { initSelection, select, deselect, isEditingText };
