// Aba Marca > card "Tema da marca". Renderiza um card por BrandTheme carregado
// (design-system/themes/index.js) com preview visual: tipografia + swatches + mini
// componente. Clicar aplica setState({ brandTheme: key }); brand-theme.js reage.

import themes from '../../design-system/themes/index.js';
import { getState, setState } from '../canvas/state.js';
import bus from '../events/bus.js';

function render() {
  const grid = document.getElementById('tema-grid');
  if (!grid) return;
  const list = themes.getAll();
  const active = getState().brandTheme;
  grid.innerHTML = '';
  if (!list.length) {
    grid.innerHTML = '<p class="text-[11px] text-gray-400">Carregando temas…</p>';
    return;
  }
  list.forEach((theme) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'tema-card' + (theme.key === active ? ' active' : '');
    const display = theme.typography.display?.family || 'sans-serif';
    const body = theme.typography.body?.family || 'sans-serif';
    const swatches = Object.entries(theme.colors)
      .map(([k, v]) => `<span class="tema-card-swatch" style="background:${v}" title="${k}"></span>`).join('');
    card.innerHTML = `
      <div class="tema-card-preview" style="background:${theme.colors.bg};color:${theme.colors.fg};">
        <div class="tema-card-preview-title" style="font-family:'${display}',serif;">Aa</div>
        <div class="tema-card-preview-body" style="font-family:'${body}',sans-serif;color:${theme.colors.muted}">${theme.label}</div>
        <div class="tema-card-preview-chip" style="background:${theme.colors.accent};color:${theme.colors.surface};font-family:'${body}',sans-serif">CTA</div>
      </div>
      <div class="tema-card-swatches">${swatches}</div>
      <div class="tema-card-label">${theme.label}</div>
      <div class="tema-card-desc">${theme.description || ''}</div>
    `;
    card.addEventListener('click', () => setState({ brandTheme: theme.key }));
    grid.appendChild(card);
  });
}

export function initTemaPanel() {
  themes.ready.then(render);
  bus.on('state:changed', render);
}