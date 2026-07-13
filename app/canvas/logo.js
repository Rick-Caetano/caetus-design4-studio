// Ações de logo: preset (via Asset Library), URL customizada e upload de arquivo local.
// Só mudam state.logo via setState — quem escreve no DOM (.logo-img) é exclusivamente
// app/canvas/renderer.js (applyLogo), reagindo a 'state:changed'. Drag-to-reposition e
// resize do logo são tratados de forma genérica por app/canvas/selection.js (junto com
// os demais elementos editáveis do canvas), não mais aqui.

import bus from '../events/bus.js';
import manifest from '../../design-system/manifest.js';
import { getState, setState } from './state.js';

// value é um id de asset da Asset Library (design-system/asset-library.js) — nunca um
// caminho de arquivo literal. `assetId` fica guardado para a UI (app/editor/marca-panel.js)
// destacar o card selecionado sem precisar comparar `src` string a string.
function changeLogoPreset(assetId) {
  const { logo } = getState();
  const asset = manifest.assetLibrary.getById(assetId);
  if (!asset) return;
  setState({ logo: { ...logo, assetId, src: asset.src } });
}

function changeLogoCustom(url) {
  const { logo } = getState();
  setState({ logo: { ...logo, assetId: null, src: url } });
}

function handleLogoUpload(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => changeLogoCustom(reader.result);
  reader.readAsDataURL(file);
}

bus.on('logo:preset', ({ value }) => changeLogoPreset(value));
bus.on('logo:custom', ({ url }) => changeLogoCustom(url));
bus.on('logo:upload', ({ file }) => handleLogoUpload(file));

export { changeLogoPreset, changeLogoCustom, handleLogoUpload };
