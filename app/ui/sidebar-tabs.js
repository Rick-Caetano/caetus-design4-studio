// Abas por ícone da sidebar (estilo mini-canvas: Modelos / Marca / Fundo / Selos /
// Texto). Só alterna visibilidade entre .sidebar-tab-section — nunca toca o canvas nem
// o estado do documento.

function activateTab(tab) {
  document.querySelectorAll('.sidebar-tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.querySelectorAll('[data-tab-section]').forEach((section) => {
    section.hidden = section.dataset.tabSection !== tab;
  });
}

function initSidebarTabs() {
  const buttons = document.querySelectorAll('.sidebar-tab-btn');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => activateTab(btn.dataset.tab));
  });
  if (buttons[0]) activateTab(buttons[0].dataset.tab);
}

export { initSidebarTabs, activateTab };
