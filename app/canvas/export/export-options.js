// ExportOptions: o contrato entre o modal de exportação (app/editor/export-modal.js) e
// o exportador (app/canvas/export/ExportService.js). Nenhum dos dois conhece a lib de
// exportação usada por baixo — só este objeto simples:
//   { format: 'png' | 'jpg' | 'webp', width, height, quality, filename? }
// quality é 0-1, usado só por jpg/webp (canvas.toBlob ignora para png). filename é
// opcional — quando omitido ou vazio, buildFilename() gera um nome automático.

const MIME_BY_FORMAT = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
};

const EXTENSION_BY_FORMAT = {
  png: 'png',
  jpg: 'jpg',
  webp: 'webp',
};

function mimeTypeFor(format) {
  return MIME_BY_FORMAT[format] || MIME_BY_FORMAT.png;
}

function extensionFor(format) {
  return EXTENSION_BY_FORMAT[format] || EXTENSION_BY_FORMAT.png;
}

function slugify(text) {
  return (text || '')
    .substring(0, 30)
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase();
}

function stripKnownExtension(name) {
  return name.replace(/\.(png|jpe?g|webp)$/i, '');
}

function buildAutoFilenameBase({ meta, canvasFormat, title, width, height }) {
  const formatSuffix = canvasFormat.replace(':', '-');
  const titleSlug = slugify(title) || 'post';
  return `${meta.filePrefix}_${formatSuffix}_${titleSlug}_${width}x${height}`;
}

// context: { meta: manifest.meta, canvasFormat: state.format, title: getTextValue(state.texts, 'title') }
function buildFilename(options, context) {
  const base = options.filename && options.filename.trim()
    ? stripKnownExtension(options.filename.trim())
    : buildAutoFilenameBase({ ...context, width: options.width, height: options.height });
  return `${base}.${extensionFor(options.format)}`;
}

function validateExportOptions(options) {
  if (!options || typeof options !== 'object') throw new Error('ExportOptions inválido.');
  if (!MIME_BY_FORMAT[options.format]) throw new Error(`Formato de exportação não suportado: ${options.format}`);
  if (!Number.isFinite(options.width) || options.width <= 0) throw new Error('Largura de exportação inválida.');
  if (!Number.isFinite(options.height) || options.height <= 0) throw new Error('Altura de exportação inválida.');
  return options;
}

export { mimeTypeFor, extensionFor, buildFilename, validateExportOptions };
