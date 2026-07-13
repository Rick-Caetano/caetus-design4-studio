// Casca fina de bus: recebe 'export:request' (emitido pelo modal em
// app/editor/export-modal.js) já com um ExportOptions resolvido, delega a exportação de
// verdade a ExportService, e republica o progresso em 'export:status'. Nunca toca DOM
// de sidebar/modal — isso é chrome de UI e mora em app/editor/export-modal.js.

import bus from '../events/bus.js';
import { exportAndDownload } from './export/ExportService.js';

bus.on('export:request', async (options) => {
  try {
    await exportAndDownload(options, {
      onProgress: (status, err, meta) => bus.emit('export:status', { status, err, meta }),
    });
  } catch (err) {
    console.error('Erro na exportação:', err);
  }
});
