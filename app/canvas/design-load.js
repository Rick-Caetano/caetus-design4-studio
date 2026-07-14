// Carrega um Design Document salvo (ver design-system/design-document.js) inteiro
// no canvas — mesma ideia de layout:set, mas para um documento completo vindo da
// API em vez de um template estático do manifest. `doc.state` já é exatamente a
// forma de state.js; nenhum reshape é necessário.

import bus from '../events/bus.js';
import { setState } from './state.js';

function loadDesign({ document: doc }) {
  if (!doc || !doc.state) return;
  setState(structuredClone(doc.state));
}

function initDesignLoad() {
  bus.on('design:load', loadDesign);
}

export { initDesignLoad };
