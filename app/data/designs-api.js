// Única porta de entrada HTTP para Design Documents — nenhum outro módulo do app
// fala `fetch('/api/...')` diretamente (mesmo espírito de app/canvas/export.js
// escondendo a lib de export atrás de uma função). O servidor por trás desta rota
// (server/api_server.py, via `python iniciar.py`) é quem de fato varre
// empresas/*/memoria/caetus-studio/designs/ — este módulo só faz fetch.

async function request(method, path, body) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`designs-api ${method} ${path}: HTTP ${res.status}`);
  return res.status === 204 ? null : res.json();
}

// Designs da própria empresa (qualquer visibility — é a dona).
export function listOwn(companyId) {
  return request('GET', `/companies/${companyId}/designs`);
}

// Cria um Design Document novo. Nasce sempre origin=company + visibility=private
// (regra do servidor, ver server/designs_service.py) — quem chama não escolhe isso.
export function create(companyId, { name, categories, tags, state, thumbnail }) {
  return request('POST', `/companies/${companyId}/designs`, {
    metadata: { name, categories, tags, preview: { thumbnail } },
    state,
  });
}

export function update(companyId, designId, patch) {
  return request('PUT', `/companies/${companyId}/designs/${designId}`, patch);
}

export function remove(companyId, designId) {
  return request('DELETE', `/companies/${companyId}/designs/${designId}`);
}

// Designs de OUTRAS empresas com visibility=shared, para a aba "Mais Layouts".
export function discover(excludeCompanyId) {
  const qs = excludeCompanyId ? `?excludeCompany=${encodeURIComponent(excludeCompanyId)}` : '';
  return request('GET', `/designs/discover${qs}`);
}
