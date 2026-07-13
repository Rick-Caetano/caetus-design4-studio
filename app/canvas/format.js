// Ação de formato: só muda state.format via setState. Quem redimensiona o canvas de
// verdade é app/canvas/renderer.js, reagindo a 'state:changed'.

import bus from '../events/bus.js';
import manifest from '../../design-system/manifest.js';
import { setState } from './state.js';

function setFormat(format) {
  const { formatConfig } = manifest.config;
  if (!formatConfig[format]) return;
  setState({ format });
}

bus.on('format:set', ({ format }) => setFormat(format));

export { setFormat };
