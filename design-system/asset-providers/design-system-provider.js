// Provider da Asset Library para o cartucho da Caetus. Implementa a interface mínima de
// provider ({ id, getAll, getById, getByCategory }) esperada por
// design-system/asset-library.js — é o único provider registrado hoje, mas o formato já
// é o que um provider "Local" (assets/stock/), de API/CDN ou de Marketplace precisaria
// implementar amanhã, sem a UI saber a diferença.
//
// Cada asset segue { id, type, category, label, preview, src, tags, metadata }.
// `metadata` é uma sacola livre e extensível — nenhuma chave é lida ainda nesta sprint,
// mas o formato já reserva espaço para, por exemplo: autor, licenca, corDominante,
// empresa, premium.
//
// Categorias: logos, fundos, elementos, tracos, icones, texturas. Só logos/fundos têm
// asset real hoje (reaproveitando os arquivos já existentes em design-system/assets/) —
// as demais ficam com array vazio de propósito (ver docs/ARCHITECTURE.md): nenhum asset
// fictício foi criado só para preencher a biblioteca. A Aba Elementos (Sprint 3B) é quem
// vai consumir essas categorias quando houver conteúdo real.

const assets = [
  {
    id: 'logo-lockup',
    type: 'image',
    category: 'logos',
    label: 'Logo Padrão (Lockup)',
    preview: 'design-system/assets/logo-lockup.png',
    src: 'design-system/assets/logo-lockup.png',
    tags: ['logo', 'lockup', 'padrão'],
    metadata: {},
  },
  {
    id: 'logo-mark',
    type: 'image',
    category: 'logos',
    label: 'Caetus Logo (Apenas Marca)',
    preview: 'design-system/assets/images/caetus_logo.png',
    src: 'design-system/assets/images/caetus_logo.png',
    tags: ['logo', 'marca'],
    metadata: {},
  },
  {
    id: 'logo-mark-nobg',
    type: 'image',
    category: 'logos',
    label: 'Caetus Logo (Sem Fundo)',
    preview: 'design-system/assets/images/caetus_logo_no_bg.png',
    src: 'design-system/assets/images/caetus_logo_no_bg.png',
    tags: ['logo', 'marca', 'transparente'],
    metadata: {},
  },
  {
    id: 'bg-silencio-1',
    type: 'image',
    category: 'fundos',
    label: 'Calmaria e Foco',
    preview: 'design-system/assets/images/silencio_produtivo_preset_1.jpg',
    src: 'design-system/assets/images/silencio_produtivo_preset_1.jpg',
    tags: ['fundo', 'silêncio produtivo'],
    metadata: {},
  },
  {
    id: 'bg-silencio-2',
    type: 'image',
    category: 'fundos',
    label: 'Profissional no Café',
    preview: 'design-system/assets/images/silencio_produtivo_preset_2.jpg',
    src: 'design-system/assets/images/silencio_produtivo_preset_2.jpg',
    tags: ['fundo', 'silêncio produtivo'],
    metadata: {},
  },
  // elementos / tracos / icones / texturas: nenhum asset real ainda neste cartucho.
];

function getAll() {
  return assets;
}

function getById(id) {
  return assets.find((a) => a.id === id) || null;
}

function getByCategory(category) {
  return assets.filter((a) => a.category === category);
}

export default {
  id: 'design-system',
  getAll,
  getById,
  getByCategory,
};
