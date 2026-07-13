// Dados de configuração do Design System Caetus — sem lógica de aplicação.
// O editor (app/) interpreta estes dados; este arquivo só declara valores.

export const formatConfig = {
  '1:1': { width: 1080, height: 1080, name: 'Instagram Feed (1:1)', label: '1:1 (1080×1080)' },
  '9:16': { width: 1080, height: 1920, name: 'Instagram Stories (9:16)', label: '9:16 (1080×1920)' },
  '4:5': { width: 1080, height: 1350, name: 'Instagram Portrait (4:5)', label: '4:5 (1080×1350)' },
  '16:9': { width: 1920, height: 1080, name: 'Landscape (16:9)', label: '16:9 (1920×1080)' },
  '1.91:1': { width: 1920, height: 1005, name: 'Facebook (1.91:1)', label: '1.91:1 (1920×1005)' },
};

// Estado inicial do documento (ver app/canvas/state.js) — a mesma forma que, no
// futuro, vira o JSON salvo/exportado/importado de um post.
//
// TUDO é componente reutilizável: `texts`, `objects` e `components` são apenas três
// tipos diferentes de instância — cada instância tem `id`, opcionalmente `visible`,
// props específicas do tipo, e vive no mesmo sistema de transform (state.elements[id])
// e camadas (state.layerOrder). Nenhuma peça é "fixa" de template: templates só
// definem o estado inicial. Ver docs/ARCHITECTURE.md.
export const defaultState = {
  format: '1:1',
  template: 'minimal',
  // Textos: cada item é `{ id, type, category, label, value, style }`. O item
  // `brandName` (nome da marca, "CAETUS SYSTEMS") é tratado como QUALQUER OUTRO
  // texto — sem exceção. Reset dele restaura só transform, nunca o conteúdo.
  texts: [
    {
      id: 'title',
      type: 'heading',
      category: 'titulo-principal',
      label: 'Título',
      value: 'Enquanto você atende um cliente, outros já esperam no WhatsApp.',
      style: { typography: {}, background: {}, border: {} },
    },
    {
      id: 'subtitle',
      type: 'body',
      category: 'subtitulo',
      label: 'Subtítulo',
      value: 'Sua empresa pode responder na hora, sem contratar ninguém e sem perder vendas.',
      style: { typography: {}, background: {}, border: {} },
    },
    {
      id: 'selo',
      type: 'body',
      category: 'selo',
      label: 'Selo',
      value: 'Tecnologia que trabalha nos bastidores para você focar no que importa.',
      style: { typography: {}, background: {}, border: {} },
    },
    {
      id: 'cta',
      type: 'body',
      category: 'cta',
      label: 'Chamada (CTA)',
      value: 'Fale com a gente.',
      style: { typography: {}, background: {}, border: {} },
    },
    {
      id: 'category',
      type: 'chip',
      category: 'tag-categoria',
      label: 'Categoria',
      value: 'TECNOLOGIA & EFICIÊNCIA',
      style: {
        typography: { color: '#021434' },
        background: { color: '#FFFFFF' },
        border: { radius: 0 },
      },
    },
    {
      id: 'brandName',
      type: 'body',
      category: 'texto',
      label: 'Nome da Marca',
      value: 'CAETUS SYSTEMS',
      style: {
        typography: { color: '#021434', fontSize: 16, fontWeight: 700 },
        background: {},
        border: {},
      },
    },
  ],
  background: { preset: 'bg-silencio-1', customUrl: '', opacity: 15, blur: 0, x: 0, y: 0, scale: 1, fit: 'cover' },
  logo: { assetId: 'logo-lockup', src: 'design-system/assets/logo-lockup.png', x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
  // Transform (posição/escala) de cada elemento editável — texto, objeto, componente,
  // logo. Aplicado por app/canvas/renderer.js, alterado por app/canvas/selection.js.
  elements: {
    title: { x: 0, y: 0, scale: 1 },
    subtitle: { x: 0, y: 0, scale: 1 },
    selo: { x: 0, y: 0, scale: 1 },
    cta: { x: 0, y: 0, scale: 1 },
    category: { x: 0, y: 0, scale: 1 },
    brandName: { x: 96, y: 990, scale: 1 },
    'diagonal-band': { x: 0, y: 0, scale: 1 },
    'divider-bar': { x: 96, y: 475, scale: 1 },
    'footer-bar': { x: 0, y: 0, scale: 1 },
    'watermark-pattern': { x: 0, y: 0, scale: 1 },
  },
  // Componentes reutilizáveis (registry: design-system/components-registry.js). Cada
  // instância é `{ id, kind, visible, ...props }`. Os quatro seed abaixo compõem o
  // "brand chrome" que antes ficava embutido no HTML dos layouts como decoração fixa
  // — agora são componentes normais, disponíveis em qualquer template, movíveis,
  // reordenáveis e togglabeis. Zero código específico por peça (só o renderer chama
  // registry[kind].render).
  components: [
    { id: 'diagonal-band',     kind: 'diagonalBand',     visible: true },
    { id: 'divider-bar',       kind: 'dividerBar',       visible: true },
    { id: 'footer-bar',        kind: 'footerBar',        visible: true },
    { id: 'watermark-pattern', kind: 'watermarkPattern', visible: true },
  ],
  // Objetos gráficos inseridos pelo usuário via Aba Elementos (Sprint 3B).
  objects: [],
  // Camadas unificadas — texto fixo + componentes de marca + logo + livres + objetos.
  // `background` sempre pinado no índice 0. Ver app/canvas/layers.js.
  layerOrder: [],
};

export const meta = {
  displayName: 'Caetus Systems',
  filePrefix: 'caetus_systems',
};
