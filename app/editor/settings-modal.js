// Modal de Configurações: Tema/Idioma/Preferências/Sobre. Sprint 3A: só estrutura —
// Tema é o único item com alguma leitura/escrita real, e mesmo assim só existe um tema
// funcional ('caetus'). Lê/escreve exclusivamente via ConfigService (app/config/
// ConfigService.js), nunca localStorage/globals direto — mesmo padrão visual de
// backdrop+panel dos outros 2 modais (templates-modal.js, export-modal.js); ver
// docs/ARCHITECTURE.md para a nota sobre unificar os 3 num ModalManager no futuro
// (não implementado nesta sprint).

import manifest from '../../design-system/manifest.js';
import ConfigService from '../config/ConfigService.js';

function renderThemeSelection() {
  const current = ConfigService.getTheme();
  document.querySelectorAll('[data-theme-option]').forEach((el) => {
    el.checked = el.dataset.themeOption === current;
  });
}

function renderAbout() {
  const el = document.getElementById('settings-about-text');
  if (el) {
    el.textContent = `Caetus Studio — motor de edição visual. Design System ativo: ${manifest.meta.displayName}.`;
  }
}

function openModal() {
  document.getElementById('settings-modal').classList.remove('hidden');
  renderThemeSelection();
  renderAbout();
}

function closeModal() {
  document.getElementById('settings-modal').classList.add('hidden');
}

export function initSettingsModal() {
  document.getElementById('settings-modal-close').addEventListener('click', closeModal);
  document.getElementById('settings-modal-backdrop').addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !document.getElementById('settings-modal').classList.contains('hidden')) closeModal();
  });

  document.querySelectorAll('[data-theme-option]').forEach((el) => {
    el.addEventListener('change', (e) => {
      if (e.target.checked) ConfigService.setTheme(e.target.dataset.themeOption);
    });
  });

  document.getElementById('btn-open-settings').addEventListener('click', openModal);
}

export { openModal, closeModal };
