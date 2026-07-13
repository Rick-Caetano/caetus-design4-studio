// Ponto único de configuração do Studio (nível de aplicação, não de documento — não faz
// parte de state.js/getState(), porque não é conteúdo do post, é preferência do editor,
// mesmo espírito da exceção já documentada para zoom em app/canvas/zoom.js).
//
// Nesta sprint só existe tema (e só um tema funcional: 'caetus'). É desenhado como o
// lugar único para onde idioma/preferências entram depois, em vez de espalhar
// localStorage/globals por módulo — app/editor/settings-modal.js já lê/escreve
// exclusivamente por aqui, nunca direto.

import bus from '../events/bus.js';

const AVAILABLE_THEMES = ['caetus'];
let currentTheme = 'caetus';

function getTheme() {
  return currentTheme;
}

function setTheme(theme) {
  if (!AVAILABLE_THEMES.includes(theme)) return;
  currentTheme = theme;
  bus.emit('config:changed', { theme: currentTheme });
}

function getAvailableThemes() {
  return AVAILABLE_THEMES;
}

export default { getTheme, setTheme, getAvailableThemes };
