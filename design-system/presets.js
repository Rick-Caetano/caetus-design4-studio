// Dados dos presets de conteúdo do Design System Caetus.
//
// `bandVisibility` opcional: mapa `{ [componentId]: boolean }` — permite ao preset
// religar/desligar componentes reutilizáveis (ex.: faixa diagonal). Presets NÃO
// conhecem implementação; só falam com o vocabulário público (ids do state.components).

export const silencio = {
  layout: 'cinematic',
  bandVisibility: { 'diagonal-band': true },
  bgPreset: 'bg-silencio-1',
  bgOpacity: '35',
  bgBlur: '2',
  title: 'Sua empresa operando em [silêncio produtivo].',
  subtitle: 'Automações sob medida conectam seus sistemas, otimizam seu atendimento e eliminam o trabalho manual repetitivo.',
  selo: 'Tecnologia inteligente trabalhando em silêncio nos bastidores.',
  cta: 'Descubra a Caetus OS',
  category: 'VALORES DA MARCA',
};

export const whatsapp = {
  layout: 'minimal',
  bandVisibility: { 'diagonal-band': true },
  bgPreset: 'none',
  bgOpacity: '0',
  bgBlur: '0',
  title: 'Nenhum cliente aceita [ficar esperando].',
  subtitle: 'Enquanto você foca no atendimento físico, a inteligência da Caetus responde seus contatos do WhatsApp de forma instantânea e natural.',
  selo: 'Seu atendimento ativo 24h por dia, 7 dias por semana.',
  cta: 'Comece a automatizar',
  category: 'RESOLUÇÃO DE PROBLEMAS',
};

export const tempo = {
  layout: 'split',
  bandVisibility: { 'diagonal-band': false },
  bgPreset: 'bg-silencio-2',
  bgOpacity: '100',
  bgBlur: '0',
  title: 'Tempo de sobra para focar no [crescimento].',
  subtitle: 'Sistemas que conversam entre si, gerenciam contatos e enviam cobranças. O que antes tomava horas, agora acontece em segundos.',
  selo: 'Deixe a burocracia com a tecnologia da Caetus.',
  cta: 'Automatizar agora',
  category: 'DESTAQUE DE PRODUTO',
};
