# Evolução de UX/Editor do Caetus Studio — Plano e Progresso

> Este arquivo é a fonte de verdade do progresso desta iniciativa — sobrevive a limpezas de contexto de sessão. Antes de continuar o trabalho em qualquer marco, leia este arquivo inteiro primeiro.

## Status geral

| Marco | Descrição | Status |
|---|---|---|
| 1 | Camadas (front/back/forward/backward) | ✅ Validado |
| 1.5 | Aba Imagens + ajuste manual de background editorial | ✅ Corrigido — aguardando validação |
| 1.6 | Modal Imagens: toggle "Aplicar como fundo" vs "Inserir no canvas" | ✅ Implementado — aguardando validação |
| 2 | Edição de texto inline + categorias de texto | ✅ Implementado — aguardando validação |
| 3 | Paleta de cores da marca + divisor decorativo | ⏳ Pendente |
| 4 | Barra de elementos + recolorir SVG + shell de painel flutuante | ⏳ Pendente |
| 5 | Evolução da aba Imagens (chips subcategoria + modal-manager) | ⏳ Parcial (rename + modal já entregues em 1.5) |
| 6 | Image Viewport (fundo + objetos-foto) | ⏳ Pendente |
| 7 | Templates nascem completos | ⏳ Pendente |
| 8 | Auditoria geral de UX | ⏳ Pendente |

## Marco 1.5 — Aba Imagens (prioritário, antecipado a pedido do usuário)

Antecipa parcialmente o Marco 5 e resolve dor imediata com o fundo do layout Editorial.

**O que foi feito:**
- Aba lateral "Fundo" renomeada para "Imagens" (label + title).
- `app/editor/fundo-panel.js`: grid resumido (`limit: 6`) das imagens da categoria `fundos`; botão "Ver biblioteca completa →" abre novo modal. Busca removida do painel (baixo volume).
- Novo `app/editor/imagens-modal.js` + `#imagens-modal` em `index.html`: grid completo (`.asset-grid-lg`, cards maiores) com o item atualmente selecionado destacado via `box-shadow` azul + card `.active`. Clicar aplica preset e fecha o modal. Sem busca (aguarda volume).
- `app/editor/asset-picker.js`: nova opção `limit` em `renderAssetGrid`.
- `app/canvas/background.js`: `resetBgTransform` agora volta para `fit: 'cover'` além de zerar x/y/scale — "Resetar imagem" restaura composição pristina.
- Botão de reset renomeado para "↺ Resetar imagem" e reordenado o grid de modos para Preencher/Ajustar/Centralizar/Livre (Cover primeiro, alinhado com o default de composição).
- Background continua sendo entidade `background` no estado (não vira Object), mas já compartilhava a UX de seleção/drag/resize via `[data-editable="background"]` no selection system — nada arquitetural mudou aqui.
- Correção pós-validação: no layout Editorial (`split`), trocar para o template/preset ou escolher nova imagem faz o background nascer em `fit:'contain'`, centralizado e escala 1. Arrastar/redimensionar o fundo preserva o fit atual em vez de trocar automaticamente para `free`, então o modo Ajustar continua mostrando a foto inteira durante o pan/zoom.
- O overlay de seleção do fundo em `contain/free` passa a seguir a área visível da foto, não o frame inteiro do slot Editorial; em `cover`, continua representando o frame preenchido.

**O que ficou pendente do Marco 5 original (adiado para o marco formal):**
- Renomear categoria `fundos` → `fotografias` (e mover as 2 imagens do design-system para `fundos` real vs. imagens gerais).
- Chips de subcategoria no painel.
- Extrair `modal-manager.js` genérico e fazer retrofit dos 4 modais (templates/export/settings/imagens).

**Como validar:**
1. `python iniciar.py` a partir de `caetus-studio/`, hard refresh no navegador.
2. Abrir aba lateral "Imagens" (era "Fundo") — confirmar label novo.
3. Confirmar que aparecem só ~6 cards no painel + botão "Ver biblioteca completa →".
4. Clicar no botão — modal abre com grid maior; card da imagem atualmente aplicada aparece com borda + brilho azul.
5. Clicar em outra imagem no modal — modal fecha e canvas atualiza; reabrir o modal e confirmar que o destaque migrou.
6. No layout Editorial (Modelos → Editorial): selecionar uma imagem e confirmar que ela nasce inteira no painel direito (Ajustar/Contain ativo).
7. Selecionar `#bg-img` no canvas (clicar na imagem) — overlay azul acompanha a área real da foto; arrastar o corpo move a foto sem mudar o modo para Livre; a alça SE amplia/reduz mantendo a foto inteira.
8. Clicar "Preencher" — a imagem volta a cobrir o frame. Clicar "↺ Resetar imagem" no Editorial — volta para Ajustar centralizado; nos demais layouts, volta para Preencher centralizado.

## Marco 1.6 — Imagens como objeto (mini-marco antes do 2)

Antecipa uma parte do Marco 6 (objetos-foto) usando só o que já existe hoje — a mesma
entidade Object da aba Elementos, sem viewport próprio ainda. Qualquer imagem da
Biblioteca de Imagens pode ser inserida no canvas como objeto livre, não só aplicada
como fundo, sem duplicar catálogo nem arquivo.

**O que foi feito:**
- `index.html` + `app/editor/imagens-modal.js`: toggle de modo no topo do modal
  ("Aplicar como fundo" | "Inserir no canvas") reaproveitando `.export-format-btn`.
  Clique de card roteia para `bg:preset` (default) ou `object:insert` conforme o modo.
  No modo "inserir" nenhum card é destacado (cada clique cria um objeto novo).
- Sem mudanças em `app/canvas/objects.js` — `insertObject` já resolve qualquer `assetId`
  via `manifest.assetLibrary.getById`, e o `local-assets-provider` já registra as fotos
  de `assets/stock/images/*` como assets categoria `fundos`.

**Como validar:**
1. Hard refresh, abrir aba lateral "Imagens" → "Ver biblioteca completa →".
2. Modo default "Aplicar como fundo" ativo — clicar num card aplica como fundo.
3. Trocar para "Inserir no canvas", clicar num card — modal fecha e a imagem aparece no canvas como objeto livre (seleção/drag/resize/camadas funcionam via mesma barra dos elementos).
4. Reabrir no modo "Inserir": cards não vêm com destaque azul (não faz sentido para inserção).
5. Voltar para "Aplicar como fundo": o card do fundo atual volta a aparecer destacado.

## Status geral (histórico)

| Marco | Descrição | Status |
|---|---|---|
| 1 | Camadas (front/back/forward/backward) | ✅ Validado (Marco 1 v2) |

## Processo acordado com o usuário

- Cada marco: eu implemento → eu faço uma verificação técnica básica (sem UI, só pra garantir que nada quebrou) → **o usuário testa manualmente e me diz o resultado** → só então eu sigo para o próximo marco.
- **Eu não faço mais a validação funcional/visual sozinho.** Depois de implementar um marco, minha responsabilidade é: (1) rodar uma checagem técnica rápida (console sem erros, servidor sobe), e (2) escrever um roteiro de teste claro, passo a passo, para o usuário executar — nunca reportar "validado" sem o usuário ter testado.
- Servidor local: `python iniciar.py` (ou `iniciar.bat`) a partir de `caetus-studio/` — sobe a partir da raiz do projeto (necessário para a Asset Library ler `assets/stock/`). **Sempre dar um hard refresh (Ctrl+Shift+R / Cmd+Shift+R) ao testar depois de uma mudança** — o servidor estático não envia cabeçalhos de no-cache, então o navegador pode servir CSS/JS antigo do cache.

## Contexto

O Caetus Studio (`caetus-studio/`, app estático sem build, ES modules puros) atingiu um nível funcional razoável mas ainda exige muitos cliques e esconde ações que deveriam ser óbvias — a experiência está longe de Canva/Adobe Express/Figma. O pedido original cobre 11 frentes (camadas, edição de imagem estilo Canva, barras flutuantes para imagens e elementos, paleta de marca nos color pickers, edição de texto inline, elemento decorativo editável, evolução da aba Fundo, categorias de texto, templates que nascem preenchidos, e uma auditoria geral de UX).

Arquitetura completa em `docs/ARCHITECTURE.md` (leitura obrigatória antes de mexer em qualquer marco). **Regra de ouro preservada em todo o plano**: `app/canvas/state.js` continua a única fonte da verdade; `app/canvas/renderer.js` continua o único módulo que escreve no DOM do canvas; `app/editor/*` só emite intents no bus. Toda a extensão de estado passa por `setState`, nunca por manipulação direta de DOM.

## Princípios que orientam a extensão do motor (também registrados em `docs/ARCHITECTURE.md`)

1. **Reutilizar antes de criar**: qualquer funcionalidade nova primeiro tenta se encaixar no Selection System (`app/canvas/selection.js`), no Renderer (`app/canvas/renderer.js`) e nos Floating Panels — só criar um mecanismo novo quando nenhum dos três já resolve o problema.
2. **Selection Modes são um conceito de primeira classe, não um efeito colateral de código**: modos nomeados e documentados em `docs/ARCHITECTURE.md` > "Selection Modes".
3. **Barras/painéis flutuantes mostram só o que é pertinente ao tipo selecionado, nunca crescem indefinidamente.** O shell visual (posição, header, largura, animação, cantos, sombra) é UMA implementação só, usada por todos sem exceção.
4. **Toda entrega é perceptível pelo usuário**: nenhum marco é só refatoração interna.
5. **Fundo e objetos-foto usam exatamente o mesmo comportamento de corte/pan/zoom**: mesmos gestos, mesmo Viewport mode, mesmo corpo de painel flutuante. O usuário nunca aprende duas formas diferentes de cortar uma imagem.

## Conflitos de arquitetura encontrados e resolvidos

1. **Bug real no mecanismo de camadas** (corrigido no Marco 1): `applyTexts`/`applyObjects` só faziam `appendChild` na primeira vez que um id aparecia — nunca reposicionavam nós já existentes. Corrigido unificando texto-livre + objetos numa única ordem (`applyFreeNodes`), com `appendChild` incondicional a cada render.
2. **`.post-content` tem `z-index:20`; `#bg-img`/`#watermarks-paral` têm `z-index:1`; nós livres não tinham z-index nenhum** → nós livres ficavam SEMPRE atrás do fundo E do conteúdo fixo. Corrigido no Marco 1 dando `z-index:5` a `.canvas-free-node` (fica acima do fundo/padrão, continua abaixo da faixa diagonal e do conteúdo fixo — "trazer para frente/enviar para trás" continua escopado a "entre nós livres apenas", sem tocar nesses outros dois z-index).
3. **Presets vs. Templates são caminhos diferentes**: o preset "whatsapp" define `bgPreset:'none'` deliberadamente — o preenchimento automático de foto-placeholder (Marco 7) precisa chamar um helper explícito só nos 2 pontos reais de troca de template, nunca um listener passivo de `state:changed` (que reagiria também à troca de preset).
4. **Redundância já existente hoje** (a resolver no Marco 2): o card "Tag de Categoria" na aba Marca já duplica 100% do que `text-style-panel.js` e `texts-panel.js` fazem genericamente.
5. **Renderização de objetos é sempre `<img src="...">`** (a resolver no Marco 4), inclusive para os 55 SVGs em `assets/stock/elements/` (40 já usam `currentColor`). Um `<img>` carregando SVG é opaco para CSS — recolorir de verdade exige inline do SVG como DOM real.

## Selection Modes

- **Select mode** (hoje, desde sempre): clique seleciona, arrastar move `elements[id]`/`logo`/`background`, a alça do canto redimensiona.
- **Text edit mode** (Marco 2): duplo clique (ou Enter com o texto já selecionado) num nó de texto entra aqui — `contentEditable=true`, drag/resize suprimidos nesse nó, Enter confirma e sai (mantendo a seleção ativa), Esc cancela e reverte.
- **Viewport mode** (Marco 6): duplo clique (ou botão "Editar foto") num objeto-foto entra aqui — os mesmos handlers de drag/resize passam a mexer em `object.viewport.{x,y,scale}` em vez de `elements[id]`.

## Nova arquitetura compartilhada: Image Viewport (Marco 6)

Decisão tomada com o usuário: uma única arquitetura de viewport reutilizável por fundo E por objetos-imagem — nunca duas formas diferentes de cortar uma imagem.

- **O que já existe e não muda**: `state.background.{x,y,scale,fit}` + `app/canvas/selection.js` (drag/resize) + `overflow:hidden` (`#post-canvas` e `.split-right`) já implementam pan/zoom/crop-visual para o fundo.
- **Peça nova — `app/canvas/image-viewport.js`**: função pura `applyViewport(mountEl, imgEl, viewport)`, extraída da lógica que `applyBackground` já tem. Objetos-foto passam a chamar a mesma função com `object.viewport`.
- **Dado novo**: objetos cuja `asset.category` seja de foto (`fundos`/`fotografias`) ganham `viewport: { x:0, y:0, scale:1, fit:'cover', blur:0, brightness:100, contrast:100, saturate:100 }` na inserção. Objetos que não são foto continuam com `viewport: null`.
- **Dois conceitos de posição**: "onde o objeto está no canvas" (`elements[id]`, inalterado) e "onde a foto está dentro do próprio frame" (`viewport`, novo). Select mode move o frame; Viewport mode (duplo clique) move a foto dentro dele.
- **Barra flutuante compartilhada**: `app/editor/panels/image-viewport-body.js` — opacidade/desfoque/brilho/contraste/saturação/resetar — usada tanto para o fundo quanto para objetos-foto.
- **Fora de escopo, documentado para depois**: redimensionar o frame de forma independente da foto, ferramenta de Crop com alças próprias, máscaras não retangulares.

## Marcos

Sequenciamento pensado para isolar o Image Viewport (Marco 6) como o maior marco, sozinho — o trabalho de aba Imagens entra antes dele (Marco 5), e a generalização do shell de painel flutuante já acontece no Marco 4 (usando a barra de Elementos como 2ª consumidora).

### Marco 1 — Camadas (#1) — ✅ Implementado, aguardando validação

**O que foi feito:**
- `design-system/config.js`: `defaultState.layerOrder: []`.
- Novo `app/canvas/layers.js`: `insertIntoOrder`/`removeFromOrder`/`moveInOrder` + 4 ações (`bringToFront`/`sendToBack`/`bringForward`/`sendBackward`) + bindings no bus.
- `app/canvas/text.js`, `app/canvas/objects.js`: bookkeeping de `layerOrder` em add/remove/duplicate (duplicar insere logo acima do original).
- `app/canvas/renderer.js`: `applyTexts` (metade livre) + `applyObjects` unificados em `applyFreeNodes` — itera `layerOrder` (autocorretivo) e faz `appendChild` incondicional a cada render, corrigindo o bug de reordenação.
- `app/canvas/selection.js`: 4 botões novos na barra de ações do objeto selecionado, com ícones SVG (antes eram glifos unicode ⇤←→⇥) e visual de pílula (mesmo padrão de `.zoom-controls`) — bem maior que antes. A barra agora detecta se cabe acima da seleção; se não couber (objeto perto do topo do canvas), alterna para abaixo (`.selection-actions-below`) — sem isso ficava cortada pelo `overflow:hidden` do canvas.
- `styles/layout.css`: `.canvas-free-node` ganhou `z-index:5` (ver conflito #2 acima — bug real encontrado durante a validação: objetos inseridos ficavam invisíveis atrás do fundo).
- `app/editor/automation.js`: 4 wrappers novos.
- `docs/ARCHITECTURE.md`: seção "Selection Modes" nova + "Renderização e ordem — camadas" reescrita.

**Bugs relatados pelo usuário e resposta:**
- *"Elementos não passam para frente do outro"* — investiguei com dois objetos totalmente opacos (fotos) sobrepostos: o mecanismo funciona corretamente (testado via clique real nos botões, estado e DOM batendo, e efeito visual claro). Hipótese mais provável: o navegador tinha `layout.css` em cache de ANTES da correção do z-index (item acima) — como o fundo tapava os objetos, parecia que nada acontecia ao clicar. **Ao testar de novo, dar Ctrl+Shift+R (hard refresh) antes.**
- *"A barra está feia e pequena"* — refeita: ícones SVG apropriados (mesmo estilo do resto do app), botões de 34px (antes 26px), formato de pílula com sombra (mesmo padrão visual de `.zoom-controls`), separador entre o grupo de camadas e o grupo duplicar/excluir, e a lógica de virar para baixo quando não cabe em cima.

**Como validar (passo a passo):**
1. Rodar `python iniciar.py` a partir de `caetus-studio/` (se o servidor já estiver rodando, pular).
2. Abrir a URL impressa no terminal, dar **Ctrl+Shift+R** (hard refresh).
3. Ir na aba "Elementos", clicar em 2 ou 3 elementos diferentes para inseri-los no canvas (eles vão se empilhar num canto, levemente deslocados um do outro).
4. Arrastar um por cima do outro para sobrepor de propósito.
5. Selecionar o de baixo (clicar nele — se estiver totalmente coberto, selecionar antes de sobrepor, ou usar o de cima e testar "enviar para trás").
6. Testar os 4 botões novos da barra (agora maior, com ícones): enviar para trás, enviar um nível, avançar um nível, trazer para frente — confirmar visualmente que a ordem de empilhamento muda.
7. Testar duplicar (ícone de copiar) — confirmar que a cópia aparece logo acima do original, não sempre no topo de tudo.
8. Testar excluir (ícone de lixeira) — confirmar que remove de verdade.
9. Ctrl+Z / Ctrl+Shift+Z (undo/redo) depois dessas ações — confirmar que a ordem volta certinho.
10. Conferir visualmente se a barra de ações ficou bonita/legível e se ela vira para baixo quando o objeto selecionado está perto do topo do canvas (não deve ficar cortada).

### Marco 2 — Edição de texto (#6, #9) — ✅ Implementado — aguardando validação

**O que foi feito:**
- `app/canvas/selection.js`: novo **Text edit mode** (Marco 2). Duplo clique num nó de texto (ou Enter com um texto já selecionado) entra no modo: `contentEditable=true`, mostra o valor cru (com `[colchetes]`), foca e seleciona todo o conteúdo. `onPointerDown` faz guard no topo — cliques dentro do nó em edição passam para o contentEditable nativo; cliques fora confirmam a edição antes de processar como seleção nova. Enter (sem Shift) confirma, emite `text:update` e mantém a seleção ativa (overlay + painel voltam). Esc reverte para o valor original. Durante a edição, todos os outros atalhos globais (setas/Delete/[/]) ficam suprimidos por `isTypingTarget()`, que agora reconhece `isContentEditable`. `deselect()` também confirma a edição em andamento. Novo export `isEditingText(id)` — o Selection System é o dono do estado de edição.
- `app/canvas/renderer.js`: `fillTextNode` guarda `isEditingText(text.id)` — não sobrescreve innerText/innerHTML enquanto o caret está lá; estilos (cor/tamanho/fundo) continuam sendo aplicados normalmente.
- `design-system/config.js`: campo `category` em cada `state.texts[]` — valores válidos `'titulo-principal' | 'subtitulo' | 'texto' | 'cta' | 'tag-categoria' | 'selo'`. Defaults corretos nos 5 slots fixos (title→titulo-principal, subtitle→subtitulo, selo→selo, cta→cta, category→tag-categoria). Texto novo nasce em `'texto'`.
- `app/canvas/text.js`: `TEXT_CATEGORIES` (whitelist), `setTextCategory(id, category)` + binding `text:category`. `addText` aceita `category` (com fallback). Exportados.
- `app/editor/texts-panel.js`: cada item da aba Texto ganhou um `<select>` de categoria; `updateItemInPlace` respeita foco.
- `index.html` + `app/editor/controls.js`: card "Tag de Categoria (Eyebrow)" da aba Marca removido (era 100% redundante com a aba Texto). O texto `category` de `state.texts` continua existindo e é editável como qualquer outro item.
- `docs/ARCHITECTURE.md`: seção "Selection Modes" atualizada — Text edit mode agora está implementado.

**Como validar:**
1. `python iniciar.py` a partir da raiz do projeto, hard refresh no navegador.
2. Selecionar o Título no canvas (clique) — a moldura azul aparece. Dar Enter → o título entra em modo de edição (`contentEditable`), o overlay some, o texto mostra o valor cru com `[colchetes]` e todo o conteúdo já vem selecionado.
3. Digitar um novo título. Enter → confirma e a seleção volta (moldura reaparece), o `[highlight]` volta a ser renderizado (span colorido).
4. Voltar a editar (Enter de novo). Alterar. Esc → reverte para o valor anterior.
5. Duplo clique em Subtítulo → entra direto em edição sem precisar selecionar antes. Enter confirma.
6. Enquanto editando um texto, clicar em OUTRO nó do canvas → a edição em andamento é confirmada automaticamente e o novo elemento fica selecionado.
7. Enquanto editando, teclas de seta e Delete NÃO devem mover/apagar o próprio nó (o caret é dono desses atalhos).
8. Ir para a aba Texto na sidebar. Cada item mostra um `<select>` "Categoria" preenchido: Título=Título principal, Subtítulo=Subtítulo, Selo=Selo, CTA=CTA, Categoria=Tag de categoria. Trocar a categoria de algum item — nada visual muda (o campo é semântico), mas Ctrl+Z desfaz e um novo texto criado nasce em "Texto".
9. Confirmar que a aba **Marca** não tem mais o card "Tag de Categoria (Eyebrow)" — o subtítulo/logo/etc. continuam ali; a categoria agora vive só na aba Texto.
10. Ctrl+Z / Ctrl+Shift+Z depois das ações acima — undo/redo devem cobrir alteração de texto, alteração de categoria, e criação/remoção normalmente.


### Marco 3 — Paleta de cores da marca + divisor decorativo (#5, #7) — ⏳ Pendente

- `design-system/config.js` + `manifest.js`: `brandColorTokens` (nomeia os tokens de `tokens.css`, nunca duplica hex).
- Novo `app/editor/color-utils.js` (`cssColorToHex` movido + `getBrandColors()`).
- Novo `app/editor/color-swatches.js` (`renderSwatchRow`).
- Retrofit dos 2 color inputs existentes em `text-style-panel.js`.
- `design-system/config.js`: `components.divider: {enabled:true, color:''}`. `applyComponents` liga/desliga + cor. UI no card "Estilo & Layout" já existente.

### Marco 4 — Barra de elementos + recolorir SVG + shell de painel flutuante (#4) — ⏳ Pendente

- Extrair `text-style-panel.js` → `selection-panel.js` (shell) + `panels/text-body.js`.
- `format: 'svg'|'raster'` nos assets. Novo `svg-sanitize.js` + `svg-cache.js` (detecta `currentColor`).
- `renderer.js`: branch em `applyFreeNodes` para SVG inline.
- Novo `panels/object-body.js` (2º corpo do shell): opacidade sempre, cor só quando recolorível.

### Marco 5 — Evolução da aba Imagens + ModalManager (#8) — ⏳ Pendente

- Renomear categoria `fundos`→`fotografias` para as fotos de `assets/stock/images/*` (as 2 curadas do design-system continuam `fundos`).
- `asset-picker.js`: opção `limit`.
- Renomear `fundo-panel.js` → `imagens-panel.js`: chips de subcategoria, grid limitado a ~12, "Ver biblioteca completa".
- Novo `modal-manager.js` + `asset-library-modal.js` (4º modal); retrofit dos 3 modais existentes.

### Marco 6 — Image Viewport: fundo + objetos-foto (#2, #3) — ⏳ Pendente

Ver seção "Nova arquitetura compartilhada: Image Viewport" acima. Marco isolado de maior risco/tamanho.

### Marco 7 — Templates nascem completos (#10) — ⏳ Pendente

Depende do Marco 5. Helper explícito chamado só nos 2 pontos reais de troca de template — nunca listener passivo. `state.background.isPlaceholder`.

### Marco 8 — Auditoria geral de UX (#11) — ⏳ Pendente

Por último, depois de tudo no ar.

## Fora de escopo (deferido, documentado)

- Sistema completo de frame independente para objetos-foto (resize de frame não-uniforme, ferramenta de Crop com alças próprias, máscaras).
- Painel completo de camadas (lista visual arrastável) — Marco 1 entrega só a mecânica.
- Favoritos/recentes/marketplace de assets.
- Qualquer persistência/salvamento de documento além do que já existe (sessão do navegador + exportar PNG).
