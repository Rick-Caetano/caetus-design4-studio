// Modo tela cheia — puro chrome de viewport, não é dado do documento nem intent de
// edição, por isso mora em app/ui/ (ao lado de sidebar.js) e não em app/editor/ nem
// app/canvas/. Usa a Fullscreen API nativa do navegador sobre <html>, para cobrir
// sidebar + canvas juntos.

function isFullscreen() {
  return Boolean(document.fullscreenElement);
}

function updateButton(btn) {
  btn.classList.toggle('is-active', isFullscreen());
  btn.title = isFullscreen() ? 'Sair da tela cheia' : 'Tela cheia';
}

function toggleFullscreen() {
  if (isFullscreen()) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen();
  }
}

function initFullscreen() {
  const btn = document.getElementById('btn-fullscreen');
  if (!btn) return;
  btn.addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', () => updateButton(btn));
  updateButton(btn);
}

export { initFullscreen, toggleFullscreen };
