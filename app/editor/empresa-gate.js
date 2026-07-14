// Primeira página do Caetus Studio: seleção de empresa. Enquanto a URL não tiver
// `?empresa=`, o app não boota (ver app/app.js) — mostra só este gate. Escolher
// uma empresa navega para `?empresa=<slug>` (reload) — único ponto de troca de
// empresa do Studio.

import { companies } from '../data/companies.js';

function switchTo(slug) {
  const url = new URL(window.location.href);
  url.searchParams.set('empresa', slug);
  window.location.href = url.toString();
}

export function showEmpresaGate() {
  const gate = document.getElementById('empresa-gate');
  const grid = document.getElementById('empresa-gate-grid');
  if (!gate || !grid) return;

  grid.innerHTML = '';
  companies.forEach((company) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'empresa-gate-card';
    btn.innerHTML = `
      <span class="empresa-gate-card-icon">🏢</span>
      <span class="empresa-gate-card-label">${company.label}</span>
    `;
    btn.addEventListener('click', () => switchTo(company.id));
    grid.appendChild(btn);
  });

  document.body.classList.add('empresa-gate-active');
  gate.classList.remove('hidden');
}
