// Estado atual do Canvas — fonte ÚNICA da verdade do documento. Nenhum outro módulo
// escreve no DOM do canvas por conta própria: todo módulo que precisa mudar alguma
// coisa (texto, fundo, layout, logo, componentes) só chama setState(patch). Quem reage
// a isso e reflete no DOM é exclusivamente app/canvas/renderer.js, via o evento
// 'state:changed' emitido aqui.
//
// Formato do documento (mesma forma que, no futuro, vira o JSON salvo/exportado):
//   { format, template, texts: { title, subtitle, selo, cta, category: {...} },
//     background: {...}, logo: {...}, components: { diagonalBand, watermark, seals } }
//
// setState faz merge raso só no nível top. Para mudar um campo aninhado, espalhe o
// objeto inteiro: setState({ logo: { ...getState().logo, x, y } }).
//
// Exceção: o zoom (app/canvas/zoom.js) é estado de viewport, não de documento — não
// mora aqui de propósito, porque não seria salvo/exportado com o post.

import bus from '../events/bus.js';
import manifest from '../../design-system/manifest.js';

const { defaultState } = manifest.config;

const state = structuredClone(defaultState);

export function getState() {
  return state;
}

export function setState(patch) {
  Object.assign(state, patch);
  bus.emit('state:changed', state);
}
