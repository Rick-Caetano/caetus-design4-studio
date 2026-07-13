// Editor: só sabe do DOM da sidebar. Cada controle emite um intent no bus —
// nunca chama uma função do canvas diretamente, e nunca lê/escreve o DOM do canvas.

import bus from '../events/bus.js';

function bindClick(id, handler) {
  const el = document.getElementById(id);
  if (el) el.addEventListener('click', handler);
}

function bindInput(id, handler) {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', handler);
}

function bindChange(id, handler) {
  const el = document.getElementById(id);
  if (el) el.addEventListener('change', handler);
}

// Marco 2: os antigos controles do card "Tag de Categoria" (aba Marca) foram removidos.
// O texto `category` de state.texts é editado pela aba Texto como qualquer outro item —
// nenhum binding específico é necessário aqui.

export function initControls() {
  // Format selector
  bindClick('btn-format-1-1', () => bus.emit('format:set', { format: '1:1' }));
  bindClick('btn-format-9-16', () => bus.emit('format:set', { format: '9:16' }));
  bindClick('btn-format-4-5', () => bus.emit('format:set', { format: '4:5' }));
  bindClick('btn-format-16-9', () => bus.emit('format:set', { format: '16:9' }));
  bindClick('btn-format-1.91-1', () => bus.emit('format:set', { format: '1.91:1' }));

  // Layout
  document.querySelectorAll('[data-layout-key]').forEach((btn) => {
    btn.addEventListener('click', () => bus.emit('layout:set', { style: btn.dataset.layoutKey }));
  });
  bindClick('btn-reset-template', () => bus.emit('template:reset'));

  // Toggles genéricos de componente (data-component-toggle="{id}"): zero conhecimento
  // por peça. Vale para faixa diagonal, faixa principal, faixa footer, padrão de marca
  // ou qualquer componente reutilizável futuro que ganhe um toggle na UI.
  document.querySelectorAll('[data-component-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => bus.emit('component:toggle', { id: btn.dataset.componentToggle }));
  });
  // Reset genérico de transform (posição/escala/rotação/opacidade). Vale para
  // componente, texto, objeto ou logo — nunca toca conteúdo.
  document.querySelectorAll('[data-element-reset]').forEach((btn) => {
    btn.addEventListener('click', () => bus.emit('element:resetTransform', { id: btn.dataset.elementReset }));
  });

  // Brand & logo — a escolha entre asset/URL customizada é a grid de
  // app/editor/marca-panel.js; aqui só a URL/upload em si.
  bindInput('custom-logo-url', (e) => bus.emit('logo:custom', { url: e.target.value }));
  bindChange('logo-upload-file', (e) => {
    if (e.target.files[0]) bus.emit('logo:upload', { file: e.target.files[0] });
  });

  // Background image — a escolha entre asset/Nenhuma/URL customizada é a grid de
  // app/editor/fundo-panel.js; aqui só a URL/ajustes/posicionamento.
  bindInput('custom-img-url', (e) => bus.emit('bg:custom', { url: e.target.value }));
  bindInput('bg-opacity', (e) => {
    document.getElementById('opacity-val').innerText = e.target.value + '%';
    bus.emit('bg:opacity', { value: e.target.value });
  });
  bindInput('bg-blur', (e) => {
    document.getElementById('blur-val').innerText = e.target.value + 'px';
    bus.emit('bg:blur', { value: e.target.value });
  });
  bindClick('btn-bg-reset-position', () => bus.emit('bg:resetTransform'));
  bindClick('btn-bg-center', () => bus.emit('bg:center'));
  bindClick('btn-bg-fit', () => bus.emit('bg:fit'));
  bindClick('btn-bg-fill', () => bus.emit('bg:fill'));
  bindClick('btn-bg-free', () => bus.emit('bg:free'));

  // Seals
  bindClick('btn-add-seal', () => bus.emit('seal:add'));

  // Export
  bindClick('btn-export', () => bus.emit('export:modal:open'));
}
