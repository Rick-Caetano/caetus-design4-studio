// Ações de COMPONENTES reutilizáveis (registry: design-system/components-registry.js).
// Só mudam state.components/state.elements via setState — quem escreve no DOM é
// exclusivamente app/canvas/renderer.js (applyBrandComponents), reagindo a
// 'state:changed'.
//
// Toggle e Reset são AÇÕES GENÉRICAS — nada específico por peça. Reset restaura só
// transform (x/y/scale/rotation/opacity), NUNCA conteúdo (regra oficial: o conteúdo
// pertence ao usuário). Vale para qualquer id editável (componente, texto, objeto,
// logo), não só componentes de marca.

import bus from '../events/bus.js';
import manifest from '../../design-system/manifest.js';
import { getState, setState } from './state.js';

function toggleComponent(id) {
  const { components } = getState();
  const next = components.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c));
  setState({ components: next });
}

function setComponentVisibility(id, visible) {
  const { components } = getState();
  const next = components.map((c) => (c.id === id ? { ...c, visible: !!visible } : c));
  setState({ components: next });
}

// Reset genérico de TRANSFORM (posição/escala/rotação/opacidade). Vale para
// componente, texto, objeto, logo. Nunca toca conteúdo. Se o id tem uma posição
// canônica declarada em componentDefaults, volta para ela; senão, zera.
function resetElementTransform(id) {
  const state = getState();
  if (id === 'logo') {
    setState({ logo: { ...state.logo, x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 } });
    return;
  }
  const defaults = manifest.componentDefaults[id];
  const base = (defaults && defaults.transform) || { x: 0, y: 0, scale: 1 };
  setState({ elements: { ...state.elements, [id]: { ...base } } });
}

// Ao trocar de template via layout:set, aplica os overrides de visibilidade
// declarados no template (templates[].initialComponents). Nunca "remove
// disponibilidade" — só ajusta visibility inicial. Componentes que o usuário
// tenha adicionado/movido permanecem intactos.
bus.on('layout:set', ({ style }) => {
  const template = manifest.templates.find((t) => t.key === style);
  if (!template || !template.initialComponents) return;
  const { components } = getState();
  const next = components.map((c) => {
    const patch = template.initialComponents[c.id];
    if (!patch) return c;
    return { ...c, ...patch };
  });
  setState({ components: next });
});

bus.on('component:toggle', ({ id }) => toggleComponent(id));
bus.on('component:visible', ({ id, visible }) => setComponentVisibility(id, visible));
bus.on('element:resetTransform', ({ id }) => resetElementTransform(id));

// Compat: os eventos históricos diagonal:toggle / pattern:toggle continuam válidos
// (automation.js e código externo podem usá-los). São aliases finos para as ações
// genéricas acima — sem lógica específica por peça.
bus.on('diagonal:toggle', () => toggleComponent('diagonal-band'));
bus.on('pattern:toggle', () => toggleComponent('watermark-pattern'));

export { toggleComponent, setComponentVisibility, resetElementTransform };
