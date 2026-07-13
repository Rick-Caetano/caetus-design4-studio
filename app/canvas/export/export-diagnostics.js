// Histórico em memória das últimas exportações — existe para comparar provedores
// (tempo, tamanho de arquivo, taxa de erro) sem precisar instrumentar de novo no
// futuro, e para facilitar investigar uma regressão relatada pelo usuário. Só
// ExportService.js escreve aqui (recordExportAttempt); leitura é pública
// (getExportDiagnostics), também exposta em window.CaetusStudio (app/editor/automation.js).
//
// entry: { timestamp, provider, options, durationMs, outputWidth?, outputHeight?,
//          blobSizeBytes?, status: 'success' | 'error', errorMessage? }

const MAX_ENTRIES = 20;
let entries = [];

function recordExportAttempt(entry) {
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) entries.shift();
  if (typeof window !== 'undefined' && window.CAETUS_DEBUG) {
    console.table([entry]);
  }
}

function getExportDiagnostics() {
  return entries.slice();
}

export { recordExportAttempt, getExportDiagnostics };
