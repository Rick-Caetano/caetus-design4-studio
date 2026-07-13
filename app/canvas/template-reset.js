// "Restaurar modelo": diferente de Undo (que volta passo a passo), este botão pula
// direto para o estado exatamente como ficou quando o template atual foi carregado —
// seja por clicar num layout (layout:set) ou carregar um preset (que já muda
// template+conteúdo num único setState). Escuta 'state:changed' e, sempre que
// state.template mudar em relação ao último valor visto, guarda um snapshot do estado
// resultante; template:reset restaura esse snapshot com um setState normal (conta como
// um passo comum de undo, não sai do histórico).
//
// Marco 1 v2 — Camadas unificadas: além de restaurar o snapshot, também recomputa o
// layerOrder canônico (background + slots fixos + logo + livres, na ordem de
// nascimento) — a única forma direta na UI de "desfazer todas as reordenações de
// camada" que o usuário fez sem passar por undo passo a passo. Ver
// docs/ARCHITECTURE.md > "Camadas unificadas — Marco 1 v2" > "Restauração".

import bus from '../events/bus.js';
import { getState, setState } from './state.js';

let lastSeenTemplate = null;
let snapshot = null;

function captureIfTemplateChanged(state) {
  if (state.template === lastSeenTemplate) return;
  lastSeenTemplate = state.template;
  snapshot = structuredClone(state);
}

function resetToTemplateInitialState() {
  if (!snapshot) return;
  setState(structuredClone(snapshot));
  // Recompute layerOrder do zero — layers.js consome o state que acabou de ser
  // aplicado acima. Pequeno setState extra, mas mantém a lógica de canonização num
  // único ponto (computeParticipants em layers.js).
  bus.emit('layers:reset');
}

function initTemplateReset() {
  captureIfTemplateChanged(getState());
  bus.on('state:changed', captureIfTemplateChanged);
  bus.on('template:reset', resetToTemplateInitialState);
}

export { initTemplateReset, resetToTemplateInitialState };

