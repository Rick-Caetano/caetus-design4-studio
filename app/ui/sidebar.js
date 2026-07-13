// Recolhimento e redimensionamento da aba lateral (sidebar). Puro chrome de viewport —
// não é dado do documento nem intent de edição do post, por isso mora em app/ui/ (ver
// app/ui/fullscreen.js para a mesma justificativa).

const MIN_WIDTH = 320;
const MAX_WIDTH = 640;
const DEFAULT_WIDTH = 450;
const COLLAPSED_WIDTH = 64;

let width = DEFAULT_WIDTH;
let collapsed = false;

function applyWidth(sidebar, collapseBtn) {
  sidebar.style.width = (collapsed ? COLLAPSED_WIDTH : width) + 'px';
  sidebar.classList.toggle('sidebar-collapsed', collapsed);
  if (collapseBtn) collapseBtn.classList.toggle('is-collapsed', collapsed);
}

function initResizeHandle(sidebar, handle, collapseBtn) {
  let dragging = false;

  handle.addEventListener('mousedown', (e) => {
    if (collapsed) return;
    dragging = true;
    e.preventDefault();
  });
  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    width = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, e.clientX));
    applyWidth(sidebar, collapseBtn);
  });
  document.addEventListener('mouseup', () => {
    dragging = false;
  });
}

function initSidebarChrome() {
  const sidebar = document.getElementById('app-sidebar');
  if (!sidebar) return;
  const handle = document.getElementById('sidebar-resize-handle');
  const collapseBtn = document.getElementById('btn-sidebar-collapse');

  applyWidth(sidebar, collapseBtn);
  if (handle) initResizeHandle(sidebar, handle, collapseBtn);
  if (collapseBtn) {
    collapseBtn.addEventListener('click', () => {
      collapsed = !collapsed;
      applyWidth(sidebar, collapseBtn);
    });
  }
}

export { initSidebarChrome };
