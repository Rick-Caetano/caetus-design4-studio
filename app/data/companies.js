// Registro de empresas conhecidas pelo client — só o essencial pra trocar de
// "ambiente" manualmente nesta fase beta: id (bate com empresas/<slug>/), nome de
// exibição e o BrandTheme que é a cara daquela empresa por padrão.
//
// Beta: lista hardcoded, dado estático. Quando existir uma rota que leia
// empresas/*/empresa.yaml (ver server/designs_service.py para o precedente de
// "servidor varre empresas/, client nunca varre sozinho"), isso vira fetch — o
// gate de abertura (empresa-gate.js) continua funcionando igual, só a fonte muda.

export const companies = [
  { id: 'caetus_systems', label: 'Caetus Systems', theme: 'caetus' },
  { id: 'espaco_de_festa_joa', label: 'Espaço de Festa Joá', theme: 'joa' },
];

export function getCompany(id) {
  return companies.find((c) => c.id === id) || companies[0];
}
