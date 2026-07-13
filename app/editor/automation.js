// window.CaetusStudio — API pública de automação. Cada método emite um evento no bus
// ou lê getState() diretamente; getCurrentState() devolve o documento inteiro, já que
// state.js é a fonte única da verdade (ver app/canvas/state.js).

import bus from '../events/bus.js';
import manifest from '../../design-system/manifest.js';
import { getState } from '../canvas/state.js';
import { zoomIn, zoomOut, zoomToFit, setZoom } from '../canvas/zoom.js';
import { openModal as openTemplatesModal } from './templates-modal.js';
import { openModal as openExportModal } from './export-modal.js';
import { getExportDiagnostics } from '../canvas/export/export-diagnostics.js';

export function initAutomation() {
  const CaetusStudio = window.CaetusStudio || {};

  Object.assign(CaetusStudio, {
    // Format management
    setFormat: (format) => bus.emit('format:set', { format }),
    getCurrentFormat: () => getState().format,

    // Template/layout management
    setLayout: (style) => bus.emit('layout:set', { style }),
    toggleDiagonal: () => bus.emit('diagonal:toggle'),
    togglePattern: () => bus.emit('pattern:toggle'),
    openTemplatesModal: () => openTemplatesModal(),

    // Logo management — value é um id de asset da Asset Library (design-system/asset-library.js)
    changeLogo: (value) => bus.emit('logo:preset', { value }),
    changeLogoCustom: (url) => bus.emit('logo:custom', { url }),
    uploadLogoFile: (file) => bus.emit('logo:upload', { file }),

    // Text content — state.texts é uma lista dinâmica (ver design-system/config.js);
    // estes são atalhos de conveniência para os 5 papéis base, todos roteados pelas
    // ações genéricas de app/canvas/text.js.
    updateTitle: (val) => bus.emit('text:update', { id: 'title', value: val }),
    updateSubtitle: (val) => bus.emit('text:update', { id: 'subtitle', value: val }),
    updateSelo: (val) => bus.emit('text:update', { id: 'selo', value: val }),
    updateCTA: (val) => bus.emit('text:update', { id: 'cta', value: val }),
    updateCategoryTag: (text) => bus.emit('text:update', { id: 'category', value: text }),
    updateCategoryStyle: (bg, fg, radius) => bus.emit('text:style', {
      id: 'category',
      style: { typography: { color: fg }, background: { color: bg }, border: { radius } },
    }),

    // Textos genéricos (add/remove/renomear/listar) — ver app/canvas/text.js.
    addText: (payload) => bus.emit('text:add', payload || {}),
    removeText: (id) => bus.emit('text:remove', { id }),
    renameText: (id, label) => bus.emit('text:rename', { id, label }),
    updateText: (id, value) => bus.emit('text:update', { id, value }),
    updateTextStyle: (id, style) => bus.emit('text:style', { id, style }),
    getTexts: () => getState().texts,

    // Background — value é um id de asset da Asset Library (ou 'custom'/'none').
    changeBgImage: (val) => bus.emit('bg:preset', { value: val }),
    updateBgOpacity: (val) => bus.emit('bg:opacity', { value: val }),
    updateBgBlur: (val) => bus.emit('bg:blur', { value: val }),

    // Asset Library — nunca expõe caminho de arquivo, só a API do serviço.
    getAssets: (category) => (category ? manifest.assetLibrary.getByCategory(category) : manifest.assetLibrary.getAll()),
    searchAssets: (query) => manifest.assetLibrary.search(query),

    // Objetos gráficos do canvas (Sprint 3B, ver app/canvas/objects.js) — assetId é
    // sempre um id da Asset Library. Reaproveitam o mesmo Selection System de
    // texto/logo (seleção/drag/resize já funcionam automaticamente para qualquer id
    // presente em state.objects).
    insertObject: (assetId) => bus.emit('object:insert', { assetId }),
    removeObject: (id) => bus.emit('object:remove', { id }),
    duplicateObject: (id) => bus.emit('object:duplicate', { id }),
    getObjects: () => getState().objects,

    // Camadas (Marco 1 v2, ver app/canvas/layers.js) — reordenam state.layerOrder,
    // cobrindo TODO elemento editável (texto fixo + logo + background + livres).
    // `background` é pinado no fundo (ver PINNED_BOTTOM em layers.js): calls que
    // tentam movê-lo são no-op silencioso.
    bringToFront: (id) => bus.emit('layers:bringToFront', { id }),
    sendToBack: (id) => bus.emit('layers:sendToBack', { id }),
    bringForward: (id) => bus.emit('layers:bringForward', { id }),
    sendBackward: (id) => bus.emit('layers:sendBackward', { id }),
    getLayerOrder: () => getState().layerOrder,
    // Recomputa a ordem canônica (background + slots fixos + logo + livres, na ordem
    // de nascimento) — descarta customizações do usuário. "Restaurar modelo" já
    // chama por baixo (app/canvas/template-reset.js).
    resetLayerOrder: () => bus.emit('layers:reset'),


    // Restaurar modelo — volta ao estado exatamente como carregado, não é undo passo a
    // passo (ver app/canvas/template-reset.js).
    resetTemplate: () => bus.emit('template:reset'),

    // Zoom (viewport, não faz parte do documento)
    zoomIn: () => zoomIn(),
    zoomOut: () => zoomOut(),
    zoomToFit: () => zoomToFit(),
    setZoom: (z) => setZoom(z),

    // Export — abre o modal (fluxo normal) ou dispara direto com ExportOptions
    // explícito/default (útil para automação/testes, sem passar pela UI do modal).
    // Default: PNG no tamanho atual do canvas.
    openExportModal: () => openExportModal(),
    exportPost: (options) => {
      const canvasConfig = manifest.config.formatConfig[getState().format];
      bus.emit('export:request', {
        format: 'png',
        width: canvasConfig.width,
        height: canvasConfig.height,
        quality: 0.92,
        ...options,
      });
    },
    getExportDiagnostics: () => getExportDiagnostics(),

    // Estado — devolve o documento inteiro (formato/template/texts/background/logo/components)
    getCurrentState: () => getState(),

    // Load preset
    loadPreset: (presetKey) => {
      const selector = document.getElementById('preset-selector');
      selector.value = presetKey;
      selector.dispatchEvent(new Event('change'));
    },
  });

  window.CaetusStudio = CaetusStudio;
}
