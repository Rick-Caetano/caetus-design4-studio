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
};

// Posição/tamanho iniciais no canvas para cada instância seed (usado pelo defaultState
// e por template:reset). Coordenadas em pixels do canvas 1080×1080; usuários podem
// arrastar/redimensionar em qualquer template.
export const componentDefaults = {
  'diagonal-band':    { transform: { x: 0, y: 0, scale: 1 } },
  'divider-bar':      { transform: { x: 96, y: 475, scale: 1 } },
  'footer-bar':       { transform: { x: 0, y: 0, scale: 1 } },
  'watermark-pattern':{ transform: { x: 0, y: 0, scale: 1 } },
  // brandName é um texto normal, mas mantemos a posição canônica aqui para que
  // element:resetTransform funcione mesmo se disparado por automação/atalho.
  'brandName':        { transform: { x: 96, y: 990, scale: 1 } },
};
