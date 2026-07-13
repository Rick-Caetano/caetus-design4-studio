// Aplica um BrandTheme (design-system/themes/<key>/) no #post-canvas:
//   • grava as cores em CSS custom properties (--bg, --surface, --fg, --accent…) no
//     próprio #post-canvas — herdadas por todos os descendentes, sobrepondo o :root
//     definido em design-system/tokens.css (o valor default do Caetus).
//   • injeta @font-face das famílias declaradas em typography.yaml (idempotente).
//   • grava também --font-display / --font-body / --font-mono no #post-canvas.
//
// Tudo isso é chrome de RENDER — nada é gravado em state.texts/objects. Trocar de tema
// = trocar as variáveis; textos/objetos que guardam colorToken/fillToken repintam
// automaticamente porque suas cores são `var(--<token>)`.
//
// Reage a 'state:changed' e só age quando state.brandTheme muda de valor — evita
// reinjetar <style> a cada movimento de mouse.

import bus from '../events/bus.js';
import themes from '../../design-system/themes/index.js';
import { getState } from './state.js';

let lastApplied = null;
const injectedFontFamilies = new Set();
let googleFontsLinkEl = null;

function injectFontFaces(entries) {
  const rules = [];
  entries.forEach((entry) => {
    if (!entry || !entry.family || !Array.isArray(entry.sources)) return;
    entry.sources.forEach((src) => {
      const key = `${entry.family}|${src.weight || 400}|${src.style || 'normal'}|${src.url}`;
      if (injectedFontFamilies.has(key)) return;
      injectedFontFamilies.add(key);
      rules.push(`@font-face{font-family:"${entry.family}";src:url("${src.url}") format("${src.format || 'truetype'}");font-weight:${src.weight || 400};font-style:${src.style || 'normal'};}`);
    });
  });
  if (!rules.length) return;
  const style = document.createElement('style');
  style.dataset.brandThemeFonts = 'true';
  style.textContent = rules.join('\n');
  document.head.appendChild(style);
}

function setGoogleFontsLink(url) {
  if (!url) {
    if (googleFontsLinkEl) { googleFontsLinkEl.remove(); googleFontsLinkEl = null; }
    return;
  }
  if (!googleFontsLinkEl) {
    googleFontsLinkEl = document.createElement('link');
    googleFontsLinkEl.rel = 'stylesheet';
    document.head.appendChild(googleFontsLinkEl);
  }
  if (googleFontsLinkEl.href !== url) googleFontsLinkEl.href = url;
}

function familyStack(entry) {
  if (!entry) return '';
  const primary = entry.family ? `"${entry.family}"` : '';
  return [primary, entry.stack].filter(Boolean).join(', ');
}

function applyTheme(theme) {
  const canvas = document.getElementById('post-canvas');
  if (!canvas || !theme) return;

  Object.entries(theme.colors).forEach(([token, value]) => {
    canvas.style.setProperty(`--${token}`, value);
  });

  const { display, body, mono, googleFontsUrl } = theme.typography;
  setGoogleFontsLink(googleFontsUrl);
  injectFontFaces([display, body, mono]);

  if (display) canvas.style.setProperty('--font-display', familyStack(display));
  if (body)    canvas.style.setProperty('--font-body', familyStack(body));
  if (mono)    canvas.style.setProperty('--font-mono', familyStack(mono));
}

function react() {
  const key = getState().brandTheme;
  if (key === lastApplied) return;
  const theme = themes.getById(key);
  if (!theme) return; // ainda não terminou de carregar — reagir de novo no próximo state:changed
  lastApplied = key;
  applyTheme(theme);
}

export function initBrandTheme() {
  // Assim que os temas terminarem de carregar, aplica o tema atual mesmo que nenhum
  // state:changed venha em seguida (bootstrap com defaultState.brandTheme).
  themes.ready.then(() => {
    lastApplied = null;
    react();
  });
  bus.on('state:changed', react);
}

// Helper puro: resolve um par (token, custom) numa string CSS aplicável. Custom sempre
// vence — é a "override manual" que o usuário escolheu no color picker. Token cai em
// var(--<token>), respeitando o tema ativo no #post-canvas.
export function resolveColor({ colorToken, customColor, legacyColor }) {
  if (customColor) return customColor;
  if (colorToken) return `var(--${colorToken})`;
  if (legacyColor) return legacyColor; // retrocompatibilidade com state antigo
  return '';
}