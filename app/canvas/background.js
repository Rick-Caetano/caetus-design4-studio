// Ações de imagem de fundo: só mudam state.background via setState. Quem escreve no
// DOM do canvas é exclusivamente app/canvas/renderer.js (applyBackground), reagindo a
// 'state:changed'.

import bus from '../events/bus.js';
import { getState, setState } from './state.js';

// value é um id de asset da Asset Library (design-system/asset-library.js) — ou os
// modos especiais 'custom'/'none'. A resolução do src de verdade mora em
// app/canvas/renderer.js (resolveBgSrc), este módulo nunca conhece caminho de arquivo.
function changeBgPreset(value) {
  const { background, template } = getState();
  const editorialDefaults = template === 'split' ? { x: 0, y: 0, scale: 1, fit: 'contain' } : {};
  setState({ background: { ...background, preset: value, ...editorialDefaults } });
}

function changeBgCustom(url) {
  const { background, template } = getState();
  const editorialDefaults = template === 'split' ? { x: 0, y: 0, scale: 1, fit: 'contain' } : {};
  setState({ background: { ...background, preset: 'custom', customUrl: url, ...editorialDefaults } });
}

function updateBgOpacity(val) {
  const { background } = getState();
  setState({ background: { ...background, opacity: Number(val) } });
}

function updateBgBlur(val) {
  const { background } = getState();
  setState({ background: { ...background, blur: Number(val) } });
}

// "Resetar imagem" (botão único na aba Imagens): volta ao estado pristino do template
// atual. Cover segue sendo o default geral de composição, mas no Editorial (split) o
// estado pristino é contain para a foto nascer inteira dentro do painel direito.
function resetBgTransform() {
  const { background, template } = getState();
  const fit = template === 'split' ? 'contain' : 'cover';
  setState({ background: { ...background, x: 0, y: 0, scale: 1, fit } });
}

// Modos de posicionamento (Parte 4.3 do Sprint 2 — ver docs/ARCHITECTURE.md):
// - centerBackground: mantém o fit/zoom atual, só centraliza.
// - fitBackground/fillBackground: modos automáticos reais, mapeados 1:1 para
//   object-fit ('contain'/'cover') em app/canvas/renderer.js.
// - setBackgroundFreeMode: só troca o rótulo do modo para 'free', sem tocar x/y/scale —
//   usado pelo botão "Livre" pra voltar ao ajuste manual sem perder o enquadramento atual.
//
// Extension point documentado, não implementado agora (sem segundo caso de uso real
// que justifique): 'stretch' mapearia para object-fit: fill; 'tile' exigiria trocar
// #bg-img de <img> para um elemento com background-image + background-repeat, já que
// object-fit não tem valor de tile.
function centerBackground() {
  const { background } = getState();
  setState({ background: { ...background, x: 0, y: 0 } });
}

function fitBackground() {
  const { background } = getState();
  setState({ background: { ...background, fit: 'contain', x: 0, y: 0, scale: 1 } });
}

function fillBackground() {
  const { background } = getState();
  setState({ background: { ...background, fit: 'cover', x: 0, y: 0, scale: 1 } });
}

function setBackgroundFreeMode() {
  const { background } = getState();
  setState({ background: { ...background, fit: 'free' } });
}

bus.on('bg:preset', ({ value }) => changeBgPreset(value));
bus.on('bg:custom', ({ url }) => changeBgCustom(url));
bus.on('bg:opacity', ({ value }) => updateBgOpacity(value));
bus.on('bg:blur', ({ value }) => updateBgBlur(value));
bus.on('bg:resetTransform', () => resetBgTransform());
bus.on('bg:center', () => centerBackground());
bus.on('bg:fit', () => fitBackground());
bus.on('bg:fill', () => fillBackground());
bus.on('bg:free', () => setBackgroundFreeMode());

export {
  changeBgPreset, changeBgCustom, updateBgOpacity, updateBgBlur, resetBgTransform,
  centerBackground, fitBackground, fillBackground, setBackgroundFreeMode,
};
