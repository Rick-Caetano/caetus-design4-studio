// Registry de COMPONENTES REUTILIZÁVEIS do Design System.
//
// Toda peça visual "não-texto e não-objeto-imagem" do Studio (faixas, divisores,
// padrões decorativos, futuros crachás/QR codes/timelines/mockups) mora aqui como um
// KIND — uma entrada com `render(node, instance)` que sabe pintar o próprio DOM a
// partir do estado. Nada específico por peça vaza para o motor: o renderer só sabe
// "para cada state.components[i], resolver `kind` no registry e chamar render". Adicionar
// um componente novo = registrar uma entrada aqui + um estilo em components.css. Nenhum
// outro arquivo do motor precisa mudar.
//
// Instâncias vivem em state.components ({ id, kind, visible, ...props }). Posição/escala
// vivem em state.elements[id] (mesmo mecanismo genérico de texto/objeto). Ordem de
// empilhamento vive em state.layerOrder (mesmo sistema unificado). Sem exceções.
//
// Ver docs/ARCHITECTURE.md > "Componentes reutilizáveis (registry)".

export const componentsRegistry = {
  diagonalBand: {
    label: 'Faixa Diagonal',
    render(node) {
      node.className = 'ds-brand-component ds-diagonal-band';
    },
  },
  dividerBar: {
    label: 'Faixa Principal',
    render(node) {
      node.className = 'ds-brand-component ds-divider-bar';
    },
  },
  footerBar: {
    label: 'Faixa Footer',
    render(node) {
      node.className = 'ds-brand-component ds-footer-bar';
    },
  },
  watermarkPattern: {
    label: 'Padrão de Marca',
    render(node) {
      node.className = 'ds-brand-component ds-watermark-pattern';
      if (!node.querySelector('.p1')) {
        node.innerHTML = '<div class="p1"></div><div class="p2"></div>';
      }
    },
  },
  // Faixa zigue-zague — visualmente distinta da diagonalBand (borda serrilhada, não
  // um corte diagonal reto), por isso é um kind novo em vez de um patch em cima de
  // diagonalBand. Origem: brand-spec.md da Espaço de Festa Joá, seção "Postura de
  // Layout" (Do's: "faixa/borda zigue-zague").
  zigzagBand: {
    label: 'Faixa Zigue-Zague',
    render(node) {
      node.className = 'ds-brand-component ds-zigzag-band';
    },
  },
  // Padrão de losangos pontilhados — substitui watermarkPattern (chevrons angulares,
  // motivo da Caetus) para marcas cujo brand-spec pede uma textura de pontos em baixa
  // opacidade em vez de formas geométricas grandes. Origem: brand-spec.md da Espaço de
  // Festa Joá, seção "Postura de Layout" (Do's: "padrão de losangos pontilhados").
  dottedDiamondPattern: {
    label: 'Padrão de Losangos Pontilhados',
    render(node) {
      node.className = 'ds-brand-component ds-dotted-diamond-pattern';
    },
  },
  // Faixa footer colorida — substitui footerBar (hairline neutro de 1px em
  // var(--border), motivo corporativo da Caetus) para marcas cujo brand-spec veta
  // visual "clean/corporativo sem cor". Origem: brand-spec.md da Espaço de Festa Joá,
  // seção "Postura de Layout" (Don'ts: nunca reduzir a marca a um visual corporativo
  // sem cor; raio padrão de componente 999px).
  footerBarAccent: {
    label: 'Faixa Footer',
    render(node) {
      node.className = 'ds-brand-component ds-footer-bar-accent';
    },
  },
};

// Posição/tamanho iniciais no canvas para cada instância seed (usado pelo defaultState
// e por template:reset). Coordenadas em pixels do canvas 1080×1080; usuários podem
// arrastar/redimensionar em qualquer template.
export const componentDefaults = {
  'diagonal-band':    { transform: { x: 0, y: 0, scale: 1 } },
  'divider-bar':      { transform: { x: 96, y: 475, scale: 1 } },
  'footer-bar':       { transform: { x: 0, y: 0, scale: 1 } },
  'watermark-pattern':{ transform: { x: 0, y: 0, scale: 1 } },
  'zigzag-band':      { transform: { x: 0, y: 0, scale: 1 } },
  // brandName é um texto normal, mas mantemos a posição canônica aqui para que
  // element:resetTransform funcione mesmo se disparado por automação/atalho.
  'brandName':        { transform: { x: 96, y: 990, scale: 1 } },
};
