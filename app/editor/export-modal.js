// Modal "Exportar": só manipula o próprio DOM do modal, nunca o canvas (mesmo padrão de
// templates-modal.js). Monta um ExportOptions e emite 'export:request' — não conhece
// ExportService nem a lib de exportação usada por baixo. Escuta 'export:status'
// (emitido por app/canvas/export.js) para mostrar loading/sucesso/erro sem travar a UI.

import bus from '../events/bus.js';
import manifest from '../../design-system/manifest.js';
import { getState } from '../canvas/state.js';
import { RESOLUTION_PRESETS, isPresetCompatible } from '../canvas/export/resolution-presets.js';
import { buildFilename } from '../canvas/export/export-options.js';
import { getTextValue } from '../canvas/text.js';

const DEFAULT_QUALITY = 0.92;

let selectedFormat = 'png';
let selectedResolutionKey = null; // preset.key | 'current' | 'custom'
let currentStatus = 'idle'; // idle | exporting | success | error

function currentCanvasConfig() {
  return manifest.config.formatConfig[getState().format];
}

function resolutionCandidates() {
  const canvas = currentCanvasConfig();
  const presetCards = RESOLUTION_PRESETS.map((preset) => ({
    key: preset.key,
    label: preset.label,
    sublabel: `${preset.width}×${preset.height}`,
    width: preset.width,
    height: preset.height,
    disabled: !isPresetCompatible(preset, canvas.width, canvas.height),
  }));
  const currentCard = {
    key: 'current',
    label: 'Tamanho atual do canvas',
    sublabel: `${canvas.width}×${canvas.height}`,
    width: canvas.width,
    height: canvas.height,
    disabled: false,
  };
  const customCard = {
    key: 'custom', label: 'Personalizado', sublabel: 'Largura e altura livres', disabled: false,
  };
  return [currentCard, ...presetCards, customCard];
}

function resolveSelectedDimensions() {
  if (selectedResolutionKey === 'custom') {
    return {
      width: Number(document.getElementById('export-custom-width').value),
      height: Number(document.getElementById('export-custom-height').value),
    };
  }
  const candidate = resolutionCandidates().find((c) => c.key === selectedResolutionKey);
  return candidate ? { width: candidate.width, height: candidate.height } : { width: 0, height: 0 };
}

function autoFilenamePreview() {
  const { width, height } = resolveSelectedDimensions();
  if (!width || !height) return '';
  return buildFilename(
    { format: selectedFormat, width, height },
    { meta: manifest.meta, canvasFormat: getState().format, title: getTextValue(getState().texts, 'title') }
  ).replace(/\.[a-z]+$/i, '');
}

function refreshFilenamePlaceholder() {
  const input = document.getElementById('export-filename');
  input.placeholder = autoFilenamePreview() || 'nome-do-arquivo';
}

function renderResolutionGrid() {
  const grid = document.getElementById('export-resolution-grid');
  grid.innerHTML = '';
  resolutionCandidates().forEach((card) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'export-resolution-card' + (card.key === selectedResolutionKey ? ' active' : '');
    btn.disabled = card.disabled;
    if (card.disabled) {
      btn.title = 'Formato do canvas atual não é compatível com este preset. Mude o formato na aba Modelos ou use Personalizado.';
    }
    btn.innerHTML = `<span class="export-resolution-card-label">${card.label}</span>`
      + `<span class="export-resolution-card-sub">${card.sublabel}</span>`;
    btn.addEventListener('click', () => selectResolution(card.key));
    grid.appendChild(btn);
  });

  document.getElementById('export-custom-fields').classList.toggle('hidden', selectedResolutionKey !== 'custom');
}

function selectResolution(key) {
  selectedResolutionKey = key;
  renderResolutionGrid();
  refreshFilenamePlaceholder();
}

function selectFormat(format) {
  if (format !== 'png') return; // jpg/webp: arquitetura já suporta, exposição fica para depois
  selectedFormat = format;
  document.querySelectorAll('[data-export-format]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.exportFormat === format);
  });
  refreshFilenamePlaceholder();
}

function setStatus(next, err, meta) {
  currentStatus = next;
  const statusEl = document.getElementById('export-status');
  const submitBtn = document.getElementById('export-modal-submit');
  const closeBtn = document.getElementById('export-modal-close');
  const backdrop = document.getElementById('export-modal-backdrop');

  statusEl.classList.remove('is-error', 'is-success');

  if (next === 'exporting') {
    statusEl.textContent = 'Gerando arquivo…';
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Exportando...';
    closeBtn.disabled = true;
    backdrop.style.pointerEvents = 'none';
  } else if (next === 'success') {
    statusEl.textContent = `Exportado: ${meta?.filename || ''}`;
    statusEl.classList.add('is-success');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Exportar';
    closeBtn.disabled = false;
    backdrop.style.pointerEvents = '';
  } else if (next === 'error') {
    statusEl.textContent = `Não foi possível exportar: ${err?.message || 'erro desconhecido'}. Verifique as imagens usadas e tente novamente.`;
    statusEl.classList.add('is-error');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Tentar novamente';
    closeBtn.disabled = false;
    backdrop.style.pointerEvents = '';
  } else {
    statusEl.textContent = '';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Exportar';
    closeBtn.disabled = false;
    backdrop.style.pointerEvents = '';
  }
}

function submitExport() {
  const { width, height } = resolveSelectedDimensions();
  if (!width || !height) {
    setStatus('error', new Error('Informe largura e altura válidas.'));
    return;
  }
  const filenameInput = document.getElementById('export-filename');
  bus.emit('export:request', {
    format: selectedFormat,
    width,
    height,
    quality: DEFAULT_QUALITY,
    filename: filenameInput.value.trim() || undefined,
  });
}

function openModal() {
  document.getElementById('export-modal').classList.remove('hidden');

  document.getElementById('export-filename').value = '';
  selectFormat('png');

  const candidates = resolutionCandidates();
  const bestMatch = candidates.find((c) => c.key !== 'custom' && c.key !== 'current' && !c.disabled)
    || candidates.find((c) => c.key === 'current');
  selectedResolutionKey = bestMatch ? bestMatch.key : 'custom';

  renderResolutionGrid();
  refreshFilenamePlaceholder();
  setStatus('idle');
}

function closeModal() {
  if (currentStatus === 'exporting') return;
  document.getElementById('export-modal').classList.add('hidden');
}

function initExportModal() {
  document.getElementById('export-modal-close').addEventListener('click', closeModal);
  document.getElementById('export-modal-backdrop').addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !document.getElementById('export-modal').classList.contains('hidden')) closeModal();
  });

  document.querySelectorAll('[data-export-format]').forEach((btn) => {
    btn.addEventListener('click', () => selectFormat(btn.dataset.exportFormat));
  });

  document.getElementById('export-custom-width').addEventListener('input', refreshFilenamePlaceholder);
  document.getElementById('export-custom-height').addEventListener('input', refreshFilenamePlaceholder);

  document.getElementById('export-modal-submit').addEventListener('click', submitExport);

  bus.on('export:modal:open', openModal);
  bus.on('export:status', ({ status: evtStatus, err, meta }) => {
    setStatus(evtStatus === 'start' ? 'exporting' : evtStatus, err, meta);
  });
}

export { initExportModal, openModal, closeModal };
