// Presets de conteúdo: carrega um preset de marca inteiro de uma vez só. Presets NÃO
// conhecem implementação — só falam o vocabulário público (ids de texto e ids de
// componente do state.components). Nenhuma lógica específica por peça mora aqui.

import manifest from '../../design-system/manifest.js';
import { getState, setState } from '../canvas/state.js';

function withTextValue(texts, id, value) {
  return texts.map((t) => (t.id === id ? { ...t, value } : t));
}

function applyBandVisibility(components, bandVisibility) {
  if (!bandVisibility) return components;
  return components.map((c) => (bandVisibility[c.id] !== undefined ? { ...c, visible: !!bandVisibility[c.id] } : c));
}

export function initPresets() {
  document.getElementById('preset-selector').addEventListener('change', function (e) {
    const presetKey = e.target.value;
    if (presetKey === 'custom') return;

    const p = manifest.presets[presetKey];
    const { texts, background, components } = getState();

    let nextTexts = texts;
    nextTexts = withTextValue(nextTexts, 'title', p.title);
    nextTexts = withTextValue(nextTexts, 'subtitle', p.subtitle);
    nextTexts = withTextValue(nextTexts, 'selo', p.selo);
    nextTexts = withTextValue(nextTexts, 'cta', p.cta);
    nextTexts = withTextValue(nextTexts, 'category', p.category);

    setState({
      template: p.layout,
      texts: nextTexts,
      background: {
        ...background,
        preset: p.bgPreset,
        opacity: Number(p.bgOpacity),
        blur: Number(p.bgBlur),
        customUrl: '',
        x: 0,
        y: 0,
        scale: 1,
        fit: p.layout === 'split' ? 'contain' : 'cover',
      },
      components: applyBandVisibility(components, p.bandVisibility),
    });
  });
}
