// Fluxo "Salvar como layout": snapshot do getState() atual, nome + categorias, e
// cria um Design Document via designs-api.js. Sempre nasce origin=company +
// visibility=private (regra do servidor) — usuário não escolhe visibilidade aqui;
// promover para "shared" é uma ação futura ainda não implementada (ver plano).
//
// UI mínima por enquanto (prompt nativo) — o objetivo desta fatia é provar o fluxo
// de ponta a ponta (salvar → aparecer em "Meus layouts sob medida"), não um formulário
// completo. Trocar por um formulário no modal é um follow-up de UI, não muda a API.

import { getState } from '../canvas/state.js';
import { getEmpresaSlug } from '../canvas/empresa-context.js';
import { create } from '../data/designs-api.js';

async function saveCurrentDesign() {
  const name = window.prompt('Nome do layout:');
  if (!name) return;
  const categoriesInput = window.prompt('Categorias (separadas por vírgula, opcional):', '');
  const categories = (categoriesInput || '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);

  const empresa = getEmpresaSlug();
  try {
    await create(empresa, { name, categories, tags: [], state: structuredClone(getState()) });
    window.alert(`Layout "${name}" salvo em "Meus layouts sob medida".`);
  } catch (err) {
    console.error('[save-design-panel] falha ao salvar', err);
    window.alert('Não consegui salvar o layout — veja o console para detalhes.');
  }
}

export function initSaveDesignPanel() {
  document.getElementById('btn-save-design').addEventListener('click', saveCurrentDesign);
}
