// Templates do Design System Caetus — dado puro, sem lógica de aplicação.
//
// Um Template é um recorte de "estado inicial" sobre a arquitetura genérica:
// combina um Layout (esqueleto HTML dos slots de texto) com overrides opcionais
// de visibilidade/posição para os componentes reutilizáveis (ver
// design-system/components-registry.js e docs/ARCHITECTURE.md).
//
// Templates NÃO POSSUEM elementos gráficos — nenhuma peça é fixa de template.
// Qualquer componente do registry pode existir em qualquer template. Templates
// só ditam o estado inicial: quais componentes nascem visíveis e onde.
//
// `initialComponents` é opcional: mapa `{ [componentId]: patch }` aplicado no
// state.components ao ativar o template (via layout:set). Sem entrada = mantém
// o que já estava. Nunca "remove disponibilidade" — só ajusta visibilidade
// inicial. Usuário sempre pode religar depois pelo painel.

export const templates = [
  {
    key: 'minimal',
    label: 'Clean',
    category: 'Minimalista',
    layoutKey: 'standard',
    canvasClass: null,
    capabilities: { background: true, logo: true, seals: true },
    // ids de state.texts que já existem como data-editable fixo no HTML deste layout
    // (design-system/layouts.js) — ver app/canvas/renderer.js (applyTexts). Qualquer
    // outro id em state.texts vira um nó livre no canvas.
    textSlots: ['title', 'subtitle', 'selo', 'cta', 'category'],
    initialComponents: {},
    featured: true,
  },
  {
    key: 'cinematic',
    label: 'Cinemático',
    category: 'Cinemático',
    layoutKey: 'standard',
    canvasClass: 'layout-cinematic',
    capabilities: { background: true, logo: true, seals: true },
    textSlots: ['title', 'subtitle', 'selo', 'cta', 'category'],
    // Cinemático nasce sem o padrão de marca (a foto de fundo já é a estrela). Usuário
    // pode religar quando quiser — sem restrição arquitetural.
    initialComponents: { 'watermark-pattern': { visible: false } },
    featured: true,
  },
  {
    key: 'split',
    label: 'Editorial',
    category: 'Editorial',
    layoutKey: 'split',
    canvasClass: null,
    capabilities: { background: true, logo: true, seals: true },
    textSlots: ['title', 'subtitle', 'selo', 'cta', 'category'],
    // Editorial nasce sem faixa diagonal e sem padrão (o painel de foto à direita
    // é o elemento visual principal). Ainda assim togglabeis pelo usuário.
    initialComponents: {
      'diagonal-band': { visible: false },
      'watermark-pattern': { visible: false },
    },
    featured: true,
  },
];
