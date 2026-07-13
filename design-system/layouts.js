// Layouts do Design System Caetus — HTML estático dos SLOTS DE TEXTO fixos por template
// (title/subtitle/selo/cta/category). Componentes gráficos (faixas, padrão de marca,
// nome da marca) NÃO ficam aqui — são componentes reutilizáveis instanciados pelo
// renderer a partir de state.components + state.texts (ver design-system/
// components-registry.js e docs/ARCHITECTURE.md). Templates só definem estado inicial.
//
// `data-bg-slot` no template `split` marca onde o motor monta a imagem de fundo
// compartilhada (#bg-img) — quem resolve é o motor (app/canvas/renderer.js →
// applyBackground), não este arquivo.

export const standard = `
        <div class="post-content">
          <div class="logo-container">
            <img class="logo-img" data-editable="logo" src="design-system/assets/logo-lockup.png" alt="Caetus Systems">
            <div class="font-mono text-xs tracking-[4px] opacity-70 uppercase" data-editable="category" style="font-family: var(--font-mono)" id="post-category-tag">TECNOLOGIA & EFICIÊNCIA</div>
          </div>

          <div class="headline-wrap">
            <h1 class="post-title" id="canvas-title" data-editable="title"></h1>
            <h2 class="post-subtitle" id="canvas-subtitle" data-editable="subtitle"></h2>
          </div>

          <div class="selo-container" id="canvas-selo-container" data-editable="selo">
            <div class="selo-gear">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </div>
            <p class="selo-text" id="canvas-selo-text"></p>
          </div>

          <div class="post-footer">
            <div class="footer-cta" id="canvas-cta" data-editable="cta">
              <span id="canvas-cta-text"></span>
              <span class="cta-arrow"></span>
            </div>
          </div>
        </div>
      `;

export const split = `
        <div class="split-grid">
          <div class="split-left">
            <div class="logo-container">
              <img class="logo-img" data-editable="logo" src="design-system/assets/logo-lockup.png" alt="Caetus Systems">
            </div>

            <div class="headline-wrap">
              <div class="font-mono text-xs tracking-[4px] opacity-70 uppercase mb-4" data-editable="category" style="font-family: var(--font-mono)" id="post-category-tag">TECNOLOGIA & EFICIÊNCIA</div>
              <h1 class="post-title" id="canvas-title" data-editable="title" style="font-size: 54px; line-height: 1.15;"></h1>
              <h2 class="post-subtitle" id="canvas-subtitle" data-editable="subtitle" style="font-size: 24px;"></h2>
            </div>

            <div class="selo-container" id="canvas-selo-container" data-editable="selo">
              <p class="selo-text" id="canvas-selo-text" style="font-size: 18px;"></p>
            </div>

            <div class="post-footer" style="border-top: none; padding-top: 0;">
              <div class="footer-cta" id="canvas-cta" data-editable="cta">
                <span id="canvas-cta-text"></span>
                <span class="cta-arrow"></span>
              </div>
            </div>
          </div>
          <div class="split-right" data-bg-slot></div>
        </div>
      `;
