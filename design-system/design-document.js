// Formato do "Design Document" — o que é de fato salvo/carregado por empresa.
//
// Um Design Document é um ENVELOPE em torno do state do canvas (ver
// app/canvas/state.js): `state` continua sendo exatamente getState()/setState(),
// sem reshape nenhum. Tudo que NÃO é conteúdo de canvas (dono, categorias, quem
// pode ver, versão) mora em `metadata`, separado — porque isso vai crescer
// (analytics, favoritos, autor) e nada disso pertence ao documento do post em si.
//
// `template` (dentro de state) continua sendo só a skeleton/layout escolhida —
// não é mais o "nome" do documento inteiro. O documento inteiro é o Design.
//
// Eixos independentes em metadata:
//   - visibility: quem PODE VER — 'private' (só a empresa dona) | 'shared' (visível
//     para as demais empresas na aba "Mais Layouts").
//   - origin: QUEM PUBLICOU — 'company' (uma empresa comum) | 'official' (a própria
//     Caetus) | 'community' (reservado para um futuro marketplace, não usado ainda).
//     'official' nunca é visibility — é procedência. Um design 'official' é sempre
//     também 'shared' (a Caetus publica pros outros verem).
//
// Regra permanente: designs criados por uma empresa nascem sempre
// { origin: 'company', visibility: 'private' }. Só dado de seed/migração (ver
// scripts/seed-*.mjs) pode nascer com outra combinação — e deve documentar a
// exceção onde isso acontece.

export function createDesignDocument({ id, companyId, name, categories = [], tags = [], state }) {
  const now = new Date().toISOString();
  return {
    documentVersion: 1,
    id,
    companyId,
    metadata: {
      name,
      categories,
      tags,
      origin: 'company',
      visibility: 'private',
      version: 1,
      createdBy: null,
      createdAt: now,
      updatedAt: now,
      preview: { thumbnail: null, cover: null },
    },
    state,
  };
}
