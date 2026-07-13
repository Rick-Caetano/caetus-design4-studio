// Única porta de entrada pública de exportação. O modal (app/editor/export-modal.js) e
// a casca de bus (app/canvas/export.js) só conhecem exportDocument()/exportAndDownload()
// — nunca a lib de exportação usada por baixo. Trocar de provedor no futuro (ou
// adicionar pdf/svg) é só mexer no registry PROVIDERS abaixo.

import manifest from '../../../design-system/manifest.js';
import { getState } from '../state.js';
import { getTextValue } from '../text.js';
import { mimeTypeFor, buildFilename, validateExportOptions } from './export-options.js';
import { renderToBlob as renderToBlobHtmlToImage } from './providers/html-to-image-provider.js';
import { recordExportAttempt } from './export-diagnostics.js';

// Registry de providers por formato de saída — ponto de extensão para pdf/svg no
// futuro: um novo provider só precisa expor renderToBlob(node, opts) -> Promise<Blob>
// com a mesma assinatura do provider atual.
const PROVIDERS = {
  png: { name: 'html-to-image', renderToBlob: renderToBlobHtmlToImage },
  jpg: { name: 'html-to-image', renderToBlob: renderToBlobHtmlToImage },
  webp: { name: 'html-to-image', renderToBlob: renderToBlobHtmlToImage },
};

function resolveProvider(format) {
  const provider = PROVIDERS[format];
  if (!provider) throw new Error(`Nenhum provedor de exportação registrado para "${format}".`);
  return provider;
}

// Exportação em lote (não implementada — nenhuma UI precisa disso ainda): chamar
// exportDocument() em loop com múltiplos ExportOptions já funciona hoje sem nenhuma
// mudança aqui, já que cada chamada é independente e não compartilha estado mutável.
async function exportDocument(options) {
  validateExportOptions(options);
  const canvasEl = document.getElementById('post-canvas');
  const provider = resolveProvider(options.format);

  const blob = await provider.renderToBlob(canvasEl, {
    mimeType: mimeTypeFor(options.format),
    quality: options.quality,
    pixelWidth: options.width,
    pixelHeight: options.height,
  });

  return { blob, providerName: provider.name };
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// onProgress(status, err?, meta?) — status: 'start' | 'success' | 'error'. Único canal
// de status; este módulo nunca toca DOM de sidebar/modal (isso é chrome de UI).
async function exportAndDownload(options, { onProgress } = {}) {
  const startedAt = performance.now();
  onProgress?.('start');

  try {
    const { blob, providerName } = await exportDocument(options);
    const filename = buildFilename(options, {
      meta: manifest.meta,
      canvasFormat: getState().format,
      title: getTextValue(getState().texts, 'title'),
    });
    downloadBlob(blob, filename);

    recordExportAttempt({
      timestamp: Date.now(),
      provider: providerName,
      options,
      durationMs: Math.round(performance.now() - startedAt),
      outputWidth: options.width,
      outputHeight: options.height,
      blobSizeBytes: blob.size,
      status: 'success',
    });
    onProgress?.('success', null, { filename });
  } catch (err) {
    recordExportAttempt({
      timestamp: Date.now(),
      provider: PROVIDERS[options.format]?.name || 'unknown',
      options,
      durationMs: Math.round(performance.now() - startedAt),
      status: 'error',
      errorMessage: err.message,
    });
    onProgress?.('error', err);
    throw err;
  }
}

export { exportDocument, exportAndDownload };
