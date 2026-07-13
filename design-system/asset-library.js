// Fachada da Asset Library — NUNCA é consumida como array cru. Toda a UI (app/) passa
// obrigatoriamente pela API abaixo, nunca lê os dados de um provider diretamente. Isso é
// o que permite trocar/adicionar de onde os assets vêm (o cartucho da Caetus, a Asset
// Library local de assets/stock/, e amanhã um provider de API/CDN ou de Marketplace)
// sem a UI saber a diferença.
//
// Mesmo padrão de registry já usado por app/canvas/export/ExportService.js: um array de
// providers, cada um implementando { id, getAll(), getById(id), getByCategory(category) }.
// `registerProvider` já está pronto para providers futuros que só existirão em runtime
// (API/CDN/Marketplace) — os dois de hoje já nascem registrados estaticamente.

import designSystemProvider from './asset-providers/design-system-provider.js';
import localAssetsProvider from './asset-providers/local-assets-provider.js';

const providers = [designSystemProvider, localAssetsProvider];

// Alguns providers (design-system-provider.js) já nascem prontos; outros (
// local-assets-provider.js) leem assets/stock/ via fetch e só terminam depois de um
// round-trip de rede. `ready` deixa quem orquestra o bootstrap (app/app.js) saber
// quando é seguro assumir que a biblioteca já tem tudo que existe hoje em disco — sem
// este módulo (dado de marca) precisar importar bus/state (que são do motor).
const ready = Promise.all(providers.map((p) => p.ready || Promise.resolve()));

function registerProvider(provider) {
  providers.push(provider);
}

function getAll() {
  return providers.flatMap((p) => p.getAll());
}

function getById(id) {
  for (const provider of providers) {
    const found = provider.getById(id);
    if (found) return found;
  }
  return null;
}

function getByCategory(category) {
  return providers.flatMap((p) => p.getByCategory(category));
}

// Sprint 3A: busca simples por substring em label/categoria/tags — sem índice, sem
// ranking. Suficiente para poucas dezenas de assets; se a biblioteca crescer muito,
// trocar a implementação aqui não muda quem chama.
function search(query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return getAll();
  return getAll().filter((asset) => (
    asset.label.toLowerCase().includes(q)
    || asset.category.toLowerCase().includes(q)
    || asset.tags.some((tag) => tag.toLowerCase().includes(q))
  ));
}

// Sprint 3A: sem tracking de uso/recência ainda — aproximação simples (últimos
// cadastrados). Ponto de extensão para quando existir de fato um histórico de uso.
function getRecent(limit = 8) {
  return getAll().slice(-limit);
}

export default {
  ready,
  registerProvider,
  getAll,
  getById,
  getByCategory,
  search,
  getRecent,
};
