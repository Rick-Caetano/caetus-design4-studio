// "Presets de conteúdo" — antes era um array hardcoded só da Caetus
// (design-system/presets.js: silencio/whatsapp/tempo). Agora são os Design
// Documents da PRÓPRIA empresa ativa (mesma fonte de "Meus layouts sob medida",
// ver templates-modal.js): cada empresa tem seus próprios presets, com seu próprio
// conteúdo, tema e componentes — nada fica hardcoded pra Caetus.
//
// Selecionar um preset aqui é exatamente carregar aquele Design Document inteiro
// (bus 'design:load', mesmo caminho do modal de layouts) — não só texto: tema,
// faixas/componentes de marca e tudo mais vêm junto, então trocar de preset já
// troca também a "Faixa Diagonal"/"Padrão de Marca"/etc para a versão daquela
// empresa, sem precisar de lógica separada.

import bus from '../events/bus.js';
import { listOwn } from '../data/designs-api.js';
import { getEmpresaSlug } from '../canvas/empresa-context.js';

let ownDesigns = [];

function populateSelect(select) {
  select.innerHTML = '';
  ownDesigns.forEach((doc) => {
    const option = document.createElement('option');
    option.value = doc.id;
    option.textContent = doc.metadata.name;
    select.appendChild(option);
  });
  const customOption = document.createElement('option');
  customOption.value = 'custom';
  customOption.textContent = '-- Customizado / Criar Livre --';
  select.appendChild(customOption);
}

// Busca os Design Documents da empresa ativa e popula o <select>. Devolve a lista
// pro bootstrap (app/app.js) decidir qual carregar como estado inicial.
export async function loadContentPresets() {
  const empresa = getEmpresaSlug();
  try {
    ownDesigns = await listOwn(empresa);
  } catch (err) {
    console.warn('[content-presets] falha ao carregar presets da empresa', err);
    ownDesigns = [];
  }
  const select = document.getElementById('preset-selector');
  if (select) populateSelect(select);
  return ownDesigns;
}

export function getLoadedDesigns() {
  return ownDesigns;
}

export function initContentPresets() {
  const select = document.getElementById('preset-selector');
  if (!select) return;
  select.addEventListener('change', () => {
    const value = select.value;
    if (value === 'custom') return;
    const doc = ownDesigns.find((d) => d.id === value);
    if (doc) bus.emit('design:load', { document: doc });
  });
}
