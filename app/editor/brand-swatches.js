// Helper compartilhado: renderiza uma linha de swatches dos tokens semânticos do
// BrandTheme ativo (design-system/themes/index.js#TOKEN_KEYS). Cada swatch é um botão
// que chama onPick(token). O consumidor decide como aplicar (typography.colorToken,
// background.colorToken, fillToken, strokeToken…).
//
// Zero estado próprio: recebe activeToken e (opcional) includeNone. Não escuta bus —
// quem consome (text-style-panel/object-style-panel) chama render() de novo quando
// state:changed.

import themes from '../../design-system/themes/index.js';

export function renderBrandSwatches(container, { activeToken, includeNone = false, onPick } = {}) {
  if (!container) return;
  container.innerHTML = '';
  themes.TOKEN_KEYS.forEach((token) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'brand-swatch' + (activeToken === token ? ' active' : '');
    btn.style.background = `var(--${token})`;
    btn.title = token;
    btn.setAttribute('aria-label', token);
    btn.addEventListener('click', () => onPick && onPick(token));
    container.appendChild(btn);
  });
  if (includeNone) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'brand-swatch brand-swatch-none' + (!activeToken ? ' active' : '');
    btn.title = 'Sem cor';
    btn.setAttribute('aria-label', 'Sem cor');
    btn.textContent = '∅';
    btn.addEventListener('click', () => onPick && onPick(null));
    container.appendChild(btn);
  }
}