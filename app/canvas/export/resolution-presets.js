// Presets de resolução de exportação — dado genérico do motor (independe de marca,
// por isso não mora em design-system/). Usado pelo modal de exportação
// (app/editor/export-modal.js) para montar a grade de opções. "Tamanho atual do
// canvas" e "Personalizado" são resolvidos à parte (a partir de manifest.config e de
// input livre, respectivamente) — não entram nesta lista.

export const RESOLUTION_PRESETS = [
  { key: 'ig-feed', label: 'Instagram Feed', width: 1080, height: 1080 },
  { key: 'ig-feed-hi', label: 'Instagram Alta', width: 2160, height: 2160 },
  { key: 'stories', label: 'Stories', width: 1080, height: 1920 },
  { key: 'stories-hi', label: 'Stories Alta', width: 2160, height: 3840 },
];

function aspectRatio(width, height) {
  return width / height;
}

// Compatível quando a proporção do preset bate com a do canvas atual (tolerância
// pequena só para arredondamento) — evita oferecer um preset 9:16 num canvas 1:1, que
// exigiria corte/distorção que este exportador não faz.
function isPresetCompatible(preset, canvasWidth, canvasHeight) {
  return Math.abs(aspectRatio(preset.width, preset.height) - aspectRatio(canvasWidth, canvasHeight)) < 0.02;
}

export { aspectRatio, isPresetCompatible };
