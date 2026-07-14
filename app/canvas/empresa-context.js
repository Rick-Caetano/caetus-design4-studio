// Contexto de empresa do client — lido uma vez da URL no bootstrap (app/app.js).
// Sem auth/sessão ainda (ver docs/EVOLUCAO-UX-PLANO.md): o slug vem só de `?empresa=`.
// Todo módulo que precisa saber "de qual empresa é este Studio" (designs-api.js,
// layouts-modal, empresa-gate) importa daqui — nunca reparseia location.search por
// conta própria, pra não espalhar essa leitura e travar numa suposição de empresa
// única.
//
// A escolha de empresa acontece uma única vez, no gate de abertura do Studio (ver
// app/editor/empresa-gate.js) — não há troca manual depois disso dentro do editor.

import { getCompany } from '../data/companies.js';

const DEFAULT_EMPRESA = 'caetus_systems'; // empresa #1 — mantém o comportamento atual como default

let empresaSlug = null;

function readFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('empresa') || DEFAULT_EMPRESA;
}

export function getEmpresaSlug() {
  if (empresaSlug === null) empresaSlug = readFromUrl();
  return empresaSlug;
}

// Diferente de getEmpresaSlug() (que já aplica o default): diz se a URL de fato
// escolheu uma empresa. app/app.js usa isso pra decidir entre bootar direto ou
// mostrar a seleção de empresa como primeira página (ver empresa-gate.js) —
// abrir o Studio "cru" nunca deve cair silenciosamente em caetus_systems.
export function hasEmpresaInUrl() {
  return new URLSearchParams(window.location.search).has('empresa');
}

export function setEmpresaSlug(slug) {
  empresaSlug = slug;
}

export function getActiveCompany() {
  return getCompany(getEmpresaSlug());
}
