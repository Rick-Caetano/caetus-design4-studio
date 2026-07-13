# Arquitetura do Caetus Studio

> O Caetus Studio não é um template HTML. É um **motor (engine)** que interpreta um projeto visual (Design System + Assets + Presets) e renderiza uma interface editável. `index.html` + `app/` são o motor; `design-system/` é o "cartucho" que o motor carrega. Hoje só existe o cartucho da Caetus, mas o motor não sabe nada de Caetus especificamente — ele só sabe interpretar o formato do cartucho.

## Visão geral

O Caetus Studio nasceu como um protótipo gerado pelo Open Design: um único arquivo `index.html` com CSS e JS inline. Essa versão funcionava muito bem, mas misturava três coisas que precisavam ser separadas para o produto evoluir:

1. **O motor do editor** — zoom, formatos, layouts, exportação, campos de texto, sidebar.
2. **Os dados de marca da Caetus** — cores, tipografia, logos, presets de conteúdo, a "faixa diagonal", o "selo".
3. **A marcação HTML fixa** que amarrava as duas coisas junto.

Esta reorganização separa (1) de (2), preservando o comportamento exatamente como estava. Nenhuma funcionalidade nova foi adicionada nesta etapa — só reorganização, modularização e remoção de acoplamento desnecessário.

É uma aplicação estática, sem build: ES modules nativos do navegador + duas dependências via CDN (Tailwind para o chrome da sidebar, html2canvas para exportação PNG). Para rodar localmente é preciso um servidor estático simples (ver `README.md`) — módulos ES não carregam via `file://`.

## Estrutura de pastas

```
caetus-studio/
├── index.html              # HTML do motor: markup da sidebar + do canvas, carrega os módulos
├── styles/                 # CSS genérico do motor (não sabe nada de marca)
│   ├── base.css             # reset (*, body)
│   └── layout.css           # chrome estrutural do editor (#post-canvas, sidebar, .control-*)
├── app/                    # O MOTOR — nunca contém dado de marca hardcoded
│   ├── events/
│   │   └── bus.js            # event bus mínimo (on/off/emit)
│   ├── config/
│   │   └── ConfigService.js    # config de nível de app (hoje só tema) — ver seção "Asset Library e ConfigService"
│   ├── editor/               # Sidebar UI — só emite intents no bus, nunca toca o canvas
│   │   ├── controls.js         # addEventListener nos controles "simples" da sidebar (format/layout/bg-ajustes/export)
│   │   ├── presets.js          # carrega um preset de marca inteiro (um único setState)
│   │   ├── texts-panel.js      # aba Texto: lista dinâmica de state.texts (add/remove/renomear/editar)
│   │   ├── asset-picker.js     # grid de asset picker reutilizável (busca + destaque do ativo)
│   │   ├── marca-panel.js      # aba Marca: grid de logos (asset-picker + categoria 'logos')
│   │   ├── fundo-panel.js      # aba Fundo: grid de fundos (asset-picker + categoria 'fundos')
│   │   ├── settings-modal.js   # modal de Configurações (Tema via ConfigService; Idioma/Preferências placeholder)
│   │   ├── templates-modal.js  # modal "ver todos os modelos": busca, categoria, thumbnails ao vivo
│   │   ├── export-modal.js     # modal "Exportar": monta um ExportOptions, emite export:request (ver seção própria)
│   │   ├── sidebar-reactor.js  # reage a state:changed só para atualizar o PRÓPRIO chrome da sidebar
│   │   └── automation.js       # window.CaetusStudio (API pública de automação)
│   ├── canvas/                # O único lugar que manipula #post-canvas
│   │   ├── state.js             # FONTE ÚNICA DA VERDADE do documento — emite state:changed
│   │   ├── renderer.js          # ÚNICO módulo que escreve no DOM do canvas; render(state) reage a state:changed
│   │   ├── format.js            # ação: setState({ format })
│   │   ├── text.js              # ações genéricas sobre a lista dinâmica: setState({ texts: [...] })
│   │   ├── background.js        # ações: setState({ background: {...} }), incluindo os modos de fit
│   │   ├── logo.js               # ações de logo (preset via Asset Library/custom/upload/drag) + setState({ logo: {...} })
│   │   ├── template-reset.js     # "Restaurar modelo": snapshot do estado quando o template muda + template:reset
│   │   ├── zoom.js               # zoom do preview — exceção deliberada, é estado de viewport, não de documento
│   │   ├── history.js           # undo/redo (pilha de snapshots do state) + emite history:changed
│   │   ├── selection.js         # seleção/drag/resize dos elementos editáveis do canvas
│   │   ├── export.js            # casca fina de bus: export:request -> ExportService (ver seção própria)
│   │   └── export/              # arquitetura de exportação — ver seção "Exportação" abaixo
│   │       ├── ExportService.js         # única porta pública: exportDocument()/exportAndDownload()
│   │       ├── export-options.js        # tipo/validador de ExportOptions + buildFilename()
│   │       ├── resolution-presets.js    # presets de resolução (dado do motor, não de marca)
│   │       ├── export-diagnostics.js    # histórico em memória das últimas exportações
│   │       └── providers/
│   │           └── html-to-image-provider.js  # único módulo que fala com window.htmlToImage
│   ├── ui/                    # Chrome de editor que não é nem sidebar nem canvas
│   │   ├── sidebar.js            # colapsar/redimensionar a sidebar
│   │   ├── sidebar-tabs.js       # abas por ícone (Modelos/Marca/Fundo/Selos/Texto)
│   │   ├── fullscreen.js         # modo tela cheia do preview
│   │   ├── shortcuts.js          # atalhos de teclado gerais
│   │   └── history-toolbar.js    # botões visuais de Undo/Redo (ver app/canvas/history.js)
│   └── app.js                 # bootstrap: liga tudo, faz o render() inicial, carrega o preset padrão
└── design-system/          # O CARTUCHO — só dados, quase nenhuma lógica
    ├── manifest.js            # O CÉREBRO: export default { meta, config, layouts, templates, presets, assets, assetLibrary, capabilities }
    ├── asset-library.js       # fachada da Asset Library (registry de providers) — ver seção própria abaixo
    ├── asset-providers/
    │   └── design-system-provider.js  # único provider hoje: assets reais do cartucho Caetus
    ├── tokens.css             # @font-face + :root (cores OKLch, fontes)
    ├── components.css         # CSS de tudo que só existe dentro do canvas (faixa diagonal, selo, etc.)
    ├── layouts.js             # LAYOUTS: templates HTML brutos (dado — strings estáticas)
    ├── templates.js            # TEMPLATES: layout + capabilities + textSlots + metadados de exibição (ver seção própria abaixo)
    ├── presets.js              # dados dos 3 presets de conteúdo (silencio/whatsapp/tempo)
    ├── config.js               # formatConfig, defaultState (documento inicial), meta
    └── assets/                 # fontes, logos, imagens de preset — 100% específicos da Caetus
```

## Por que cada pasta existe

- **`styles/`** — CSS que qualquer Design System usaria, independente de marca: como a sidebar se organiza, como o canvas se posiciona na tela. Não define nenhuma cor ou fonte própria — só consome `var(--accent)`, `var(--bg)` etc., que vêm de `design-system/tokens.css`.
- **`app/editor/`** — tudo que só existe na sidebar. Um controle aqui nunca manipula o canvas diretamente: ele emite um evento no bus (`bus.emit('format:set', { format: '9:16' })`) e "esquece". Isso é o que vai permitir, no futuro, adicionar outras superfícies de edição (atalhos de teclado, painel de camadas) sem duplicar lógica.
- **`app/canvas/`** — tudo que manipula `#post-canvas`. É o único lugar que sabe como aplicar um layout, trocar uma imagem de fundo, redimensionar o formato. Essa fronteira existe pensando em recursos futuros (seleção de elementos, drag & drop, histórico de undo/redo, guias de alinhamento) — todos vão viver aqui, sem precisar tocar no editor.
- **`app/events/bus.js`** — o único canal de comunicação entre Editor e Canvas. Um módulo de ~20 linhas, sem dependências. Não é um framework de estado nem um sistema de mensageria — é só um `Map` de listeners.
- **`design-system/`** — tudo que é específico da marca Caetus. Por design, é majoritariamente **dados** (objetos JS, strings de template, CSS declarativo), não funções com lógica de decisão. Quem decide "o que fazer com esses dados" é sempre o `app/`.

## Estado como fonte única da verdade, e o canvas como documento

Esta é a regra mais importante do motor, e a que mais rigorosamente separa "app/editor" de "app/canvas":

1. **`app/canvas/state.js` é a única fonte da verdade.** Nenhum outro módulo escreve no
   DOM de `#post-canvas` por conta própria. Todo módulo que precisa mudar alguma coisa
   (texto, fundo, layout, logo, componentes) só chama `setState(patch)`. `setState`
   atualiza o objeto de estado e emite `bus.emit('state:changed', state)`.
2. **`app/canvas/renderer.js` é o único módulo que escreve no canvas.** Ele escuta
   `state:changed` e roda `render(state)`, que reflete o estado inteiro no DOM — nunca lê
   o payload do evento que disparou a mudança, sempre `getState()` completo. Isso é o que
   torna undo/redo, autosave, salvar/carregar e edição por IA possíveis no futuro sem
   reescrever o motor: qualquer um desses recursos só precisa produzir um `state` válido
   e chamar `render(state)` (ou deixar o `setState` fazer isso).
3. **O fluxo de uma ação do usuário é sempre**: `editor/controls.js` emite um intent no
   bus (`bus.emit('text:title', { value })`) → um módulo de ação em `app/canvas/`
   (`text.js`, `background.js`, `logo.js`, `format.js`, ou os toggles em `renderer.js`)
   escuta o intent e só chama `setState(...)` → `renderer.js` reage a `state:changed` e
   atualiza o DOM. Nenhum módulo de ação toca o DOM do canvas diretamente.
4. **O documento** (`getState()`) tem sempre esta forma — é a mesma forma que, no
   futuro, vira o JSON salvo/exportado/importado de um post:
   ```js
   {
     format: '1:1',                 // chave de manifest.config.formatConfig
     template: 'minimal',           // chave de manifest.templates
     texts: [                       // lista dinâmica (Sprint 3A) — ver seção própria abaixo
       { id: 'title', type: 'heading', label: 'Título', value, style: { typography, background, border } },
       // ...subtitle, selo, cta, category (type: 'chip'), e quaisquer textos criados pelo usuário
     ],
     background: { preset, customUrl, opacity, blur },  // preset: id de asset da Asset Library, ou 'custom'/'none'
     logo: { assetId, src, x, y, scale, rotation, opacity },  // assetId: id da Asset Library, ou null (custom/upload)
     elements: { title: { x, y, scale }, ... },  // transform por id — texto E asset livre (ver Selection System)
     components: { diagonalBand, watermark, seals: [...] },
   }
   ```
   Objetos são estruturados (ex.: `logo` inteiro, não `currentLogo`/`logoOffset`
   espalhados) justamente para que, quando um desses elementos crescer (múltiplas
   camadas de logo, mais propriedades de fundo), o documento não precise ser
   redesenhado — só ganha mais campos dentro do mesmo objeto.
5. **Exceção deliberada: zoom.** `app/canvas/zoom.js` manipula `#post-canvas`
   diretamente (fora do ciclo `setState` → `render`) porque zoom é estado de
   **viewport**, não de conteúdo — não faria sentido salvar/exportar/versionar junto
   com o post. É a única exceção consciente à regra 1, e só porque não é dado.
6. **`manifest.js` continua sendo a única porta de entrada do Design System** (ver seção
   abaixo) — nenhum módulo novo (`logo.js`, `zoom.js`, `templates-modal.js`,
   `sidebar-reactor.js`) importa `design-system/config.js`/`layouts.js`/`templates.js`/
   `presets.js` diretamente.

## O `manifest.js` é o cérebro do Design System

`design-system/manifest.js` exporta um único objeto:

```js
export default {
  meta,          // { displayName, filePrefix }
  config,        // { formatConfig, defaultState }
  layouts,       // { standard, split } — esqueletos HTML brutos (strings)
  templates,     // [{ key, label, category, layoutKey, canvasClass, capabilities, textSlots, featured }] — ver seção "Layout vs Template"
  presets,       // { silencio, whatsapp, tempo }
  assets,        // { fonts: {...}, images: {...} } — caminhos brutos (uso interno do cartucho/bootstrap)
  assetLibrary,  // serviço de assets navegáveis pela UI (logos/fundos/elementos/traços/ícones/texturas) — ver seção própria abaixo
  capabilities,  // { components: [...] } — catálogo de componentes visuais disponíveis
};
```

Nenhum módulo de `app/` importa `layouts.js`/`templates.js`/`presets.js`/`config.js`/`asset-library.js` diretamente — sempre passa por `manifest.js`. Isso mantém um único ponto de entrada estável: `manifest.layouts.standard`, `manifest.templates`, `manifest.presets.whatsapp`, `manifest.meta.displayName`, `manifest.capabilities.components`, `manifest.assetLibrary.getByCategory(...)`. Trocar de Design System no futuro é trocar o que `app/app.js` e os módulos de `canvas/`/`editor/` importam — sem redesenhar mais nada.

`capabilities.components` é hoje só uma lista plana (`headline`, `subtitle`, `footer`, `seal`, `logo`, `background`, `diagonal-band`) — um catálogo, sem lógica de renderização registrada. É o ponto de extensão natural quando surgirem componentes de verdade novos (timeline, depoimento, card, tabela, comparativo, mockup, ícones, QR code, botão, CTA...); não foi construído um sistema de plugins de componente agora porque não há um segundo componente real para validar o desenho ainda.

## Como adicionar um novo componente visual

1. Adicionar o CSS do componente em `design-system/components.css`.
2. Se o componente aparece dentro de um layout, adicionar sua marcação HTML nos templates relevantes em `design-system/layouts.js`.
3. Registrar o nome do componente em `manifest.js` → `capabilities.components`.
4. Se o componente precisa de controles próprios na sidebar, adicionar o HTML do controle em `index.html` e o binding correspondente em `app/editor/controls.js` (emitindo um evento novo no bus), e o handler que aplica a mudança no módulo apropriado de `app/canvas/`.

## Layout vs Template

Duas entidades diferentes de propósito, que o protótipo original misturava:

- **Layout** (`design-system/layouts.js`) é só o esqueleto HTML — `standard`, `split`.
  Não carrega nome de exibição, categoria, nem regras de negócio.
- **Template** (`design-system/templates.js`) é uma combinação nomeada de layout +
  `capabilities` + metadados de exibição (`label`, `category`, `featured`). É o que
  aparece nos botões rápidos da sidebar e no modal "Ver todos os modelos". Hoje
  `minimal`/`cinematic` reaproveitam o mesmo layout `standard` com capabilities
  diferentes — é exatamente o caso que essa separação existe para suportar sem
  duplicar HTML.
- **`capabilities`** descreve o que é ativável pelo usuário para aquele template —
  `{ background, watermark, diagonalBand, logo, seals }` — em vez de booleans soltos
  (`supportsPattern`, `showBgImage`) espalhados por condicionais. `background` e
  `watermark` já são aplicados de verdade por `renderer.js`; os demais existem para o
  futuro (hoje valem `true` nos três templates, sem alterar comportamento).
- Um terceiro conceito, **Tema** (light/dark, por exemplo), ainda não existe — de
  propósito. Quando surgir, entra como um eixo a mais no Template, sem precisar
  redesenhar Layout nem Template.

### Como adicionar um Template novo (reaproveitando um Layout existente)

1. Adicionar uma entrada em `design-system/templates.js`: `key`, `label`, `category`,
   `layoutKey` (apontando para um layout já existente em `layouts.js`), `canvasClass`,
   `capabilities`, `textSlots` (ver seção "Textos dinâmicos" abaixo — os
   `id`s de `state.texts` que já existem como `data-editable` fixo no HTML desse layout).
2. Pronto — o modal de templates e (se `featured: true`) os botões rápidos da sidebar
   já mostram o novo template automaticamente. Nenhuma mudança em `renderer.js` é
   necessária para o caso comum.

### Como adicionar um Layout novo (esqueleto HTML novo)

1. Escrever o template HTML como uma nova `export const` em `design-system/layouts.js`
   (string estática, com os mesmos `id`s que `renderer.js` espera: `canvas-title`,
   `canvas-subtitle`, `canvas-selo-text`, `canvas-cta-text`, `post-category-tag`). Se o
   layout tiver seu próprio slot de imagem de fundo embutido no HTML — só parte do
   canvas, não o full-bleed padrão, como o `split` — marque UM elemento vazio com o
   atributo `data-bg-slot` (ex.: `<div class="split-right" data-bg-slot></div>`). Não é
   preciso interpolar nenhum caminho de imagem à mão: `app/canvas/renderer.js`
   (`applyBackground`) reparenta a ÚNICA imagem de fundo compartilhada do motor
    (`#bg-img`, `index.html`) para dentro desse slot sempre que o template ativo tiver
    um, e de volta para `#post-canvas` (full-bleed) quando não tiver — o mesmo nó
    `[data-editable="background"]` nos dois casos, então drag/resize
    (`app/canvas/selection.js`) funciona com a mesma experiência dos objetos, mas o
    fundo continua uma entidade própria (`state.background`), não um Object. No layout
    Editorial (`split`), o fundo nasce em `fit:'contain'` para a foto aparecer inteira;
    nos demais layouts, o padrão de composição segue `fit:'cover'`. Um
   layout sem nenhum `data-bg-slot` (como `standard`) simplesmente não tem slot próprio;
   o fundo aparece full-bleed atrás dele.
2. Registrar a nova chave em `manifest.js` → `layouts: { standard, split, meuNovoLayout }`.
3. Adicionar pelo menos um Template em `templates.js` apontando `layoutKey: 'meuNovoLayout'`.
4. Só é preciso tocar em `app/canvas/renderer.js` se o layout precisar de um
   comportamento genuinamente novo que os campos de `templates.js` não descrevem hoje
   (ex.: mais de um `data-bg-slot` no mesmo layout — hoje só o primeiro é usado).

## Textos dinâmicos (Sprint 3A)

Antes da Sprint 3A, `state.texts` era um objeto fixo (`title`, `subtitle`, `selo`, `cta`,
`category`). Virou uma lista: `[{ id, type, label, value, style }]`, com
`style: { typography: {}, background: {}, border: {} }` — grupos vazios por padrão, mas
já organizados para não precisar remodelar o estado quando entrar sombra/stroke/
opacidade/rotação depois. `type` (`'heading'`/`'body'`/`'chip'` hoje) descreve o papel do
texto para uso futuro (citação, lista, rich text), sem lógica pesada em cima disso ainda
— só decide se o valor vira `innerHTML` com highlight (`heading`) ou texto puro, e se
ganha o padding de chip (`chip`).

Cada `template` declara `textSlots: [...]` — os `id`s que já existem como
`data-editable="id"` fixo no HTML do layout (`design-system/layouts.js`). No render
(`app/canvas/renderer.js` → `applyTexts`):
- Um `id` presente em `textSlots` preenche o nó fixo correspondente (ou o esvazia/oculta,
  se o usuário removeu esse texto do array).
- Um `id` ausente de `textSlots` (texto novo, criado na aba Texto) ganha um nó próprio
  (`.canvas-free-node`), criado pelo renderer e injetado em `#post-content-container`.

**A peça chave: ambos os casos reaproveitam `state.elements[id]`** para posição/escala —
o mesmo mecanismo genérico que `app/canvas/selection.js` já usava antes da Sprint 3A
(fallback para `state.elements[key]` em qualquer chave que não seja `logo`/`background`).
Nenhuma linha de `selection.js` mudou. Isso é o que permite "adicionar um texto → arrastar
→ redimensionar" funcionar de graça, sem um segundo sistema de transformação, e é o
mesmo mecanismo que a Sprint 3B vai reaproveitar para elementos gráficos inseridos no
canvas (ver nota no fim desta seção).

Renomear só edita `label` — o `id` é a chave estável usada por `data-editable`/
`state.elements` e nunca muda. Reordenar é só arquitetura preparada nesta sprint (a
ordem do array já é a ordem "natural"; não há UI de drag-to-reorder ainda).

**Fora de escopo desta sprint:** um editor tipográfico completo (fonte/tamanho/
alinhamento/cor por texto) na aba Texto — ela só expõe label/valor/adicionar/remover. A
estrutura `style` já existe e já é aplicada pelo renderer quando presente; só falta a UI
genérica para editá-la. A exceção que já existia antes e continua funcionando são os
controles de estilo do chip de Categoria (cor de fundo/texto, raio) na aba Marca —
escrevem em `style.background.color`/`style.typography.color`/`style.border.radius` do
item `category` em vez dos campos soltos de antes.

**Nota da Sprint 3A, resolvida na Sprint 3B:** elementos gráficos inseridos no canvas
precisariam de uma coleção genérica de objetos posicionáveis, que coexistiria com
`state.elements` (a store de transform por id). A decisão de nomenclatura ficou
registrada aqui pendente — ver a seção "Objetos do Canvas (Sprint 3B)" logo abaixo para
como foi resolvida.

## Objetos do Canvas (Sprint 3B)

A Aba Elementos permite inserir objetos gráficos (hoje só imagens — ver "Categorias" mais
abaixo) da Asset Library diretamente no canvas, reaproveitando o Selection System
existente sem nenhuma reescrita.

### Decisão de nomenclatura: `elements` vs `objects`

A Sprint 3A registrou o conflito e deixou a decisão pendente. Resolução:

- **`state.elements`** continua sendo exatamente o que já era: um *store de transform*
  (`{ x, y, scale }`) por id, mecanismo puro, sem significado de domínio próprio. Qualquer
  node com `[data-editable="id"]` que tenha uma entrada aqui pode ser selecionado,
  arrastado e redimensionado — texto fixo, texto livre, e agora objeto gráfico.
- **`state.objects`** é a lista de identidade nova (Sprint 3B): `[{ id, assetId, type,
  category, src, opacity }]` — o que de fato *existe* no documento como objeto inserido
  pelo usuário. `id` é a mesma chave usada em `state.elements[id]`.

Os dois nomes não competem porque descrevem coisas diferentes: `elements` é mecanismo
("como isso se move"), `objects` é dado de domínio ("o que isso é"). Um texto (`state.
texts`) tem uma entrada em `elements` mas nunca em `objects`; um objeto inserido tem
entrada nos dois. Essa distinção é estável para crescer (múltiplos tipos de objeto,
propriedades visuais por tipo) sem precisar renomear nada de novo.

### Como o Selection System foi reaproveitado sem mudança de mecanismo

`app/canvas/objects.js` segue exatamente o padrão de `app/canvas/text.js` (`addText`):
inserir um objeto sempre grava, no mesmo `setState`, a entrada em `state.objects` **e**
a entrada correspondente em `state.elements[id]`. A partir daí, mover/redimensionar já
funcionam de graça — `app/canvas/selection.js` não precisou de nenhuma mudança nesse
mecanismo (`getTransform`/`patchTransform` já caem no `else` genérico para qualquer id
que não seja `logo`/`background`).

As únicas duas exceções deliberadas em `selection.js`, só para objetos:
- **Delete/Backspace remove de verdade** (`removeObject`) — para texto/logo/fundo,
  continua só resetando o transform (`x:0, y:0, scale:1`), comportamento pré-existente
  intocado.
- **Ctrl+D duplica** (`duplicateObject`) — sem efeito para qualquer outra chave editável.

Um pequeno grupo de botões (duplicar/excluir) aparece flutuando sobre o overlay de
seleção só quando o item selecionado é um objeto — mesmo elemento de overlay que já
existia (moldura + alça de resize), sem UI nova fora dele.

**Rotação:** `state.elements` continua com a forma `{ x, y, scale }`, sem `rotation` —
de propósito. O Selection System não tem (e esta sprint não adiciona) um mecanismo de
arrastar para rotacionar; o único precedente de rotação no app é `state.logo.rotation`,
um campo numérico sem alça de UI. Criar uma alça de rotação seria um mecanismo de
transformação genuinamente novo, fora do que foi pedido ("reaproveitar exatamente o
Selection System existente"). Fica registrado como extensão futura, não implementada.

### Camadas unificadas (Marco 1 v2 — substitui a Sprint 4A)

O Marco 1 v2 revisou uma regra explícita da Sprint 4A ("slots fixos do template
nunca entram em layerOrder"). Motivo: com aquele escopo, "trazer para frente" num
objeto não tinha efeito visual quando o objeto estava sob o título/CTA — o
`.post-content { z-index: 20 }` era um teto absoluto que layerOrder nenhum vencia.
O usuário percebia como "camadas não funcionam", mesmo com o mecanismo interno
correto. A revisão unifica o modelo: `state.layerOrder` agora ordena **todos** os
elementos editáveis do canvas — texto fixo (title/subtitle/selo/cta/category),
logo, background, texto livre e objetos gráficos — no mesmo array, back-to-front.

**Modelo de empilhamento (todo dentro de #post-canvas):**

```
z-index (CSS fixo — chrome do template, não participa de layerOrder):
   1     #bg-img.watermark-bg               ← pinado pela CSS + layerOrder[0]
   5     .diagonal-band                     ← decoração de template
   5     .watermark-paral                   ← decoração de template
z-index (computado por applyLayerZIndex — Z_LAYER_BASE + posição em layerOrder):
 100+n   qualquer [data-editable="id"]      ← TODO elemento editável, exceto bg
```

Slots fixos (`h1[data-editable="title"]`, etc.) recebem `position: relative`
idempotente no renderer para que o `z-index` calculado tenha efeito — sem sair do
fluxo, sem mudar o layout. `.post-content` deixou de ter `z-index: 20` explícito
(agora `z-index: auto`) para não criar mais um stacking context próprio: assim
seus filhos participam do mesmo stacking context de `#post-canvas` que os nós
livres (`.canvas-free-node`), permitindo `z-index` unificado entre os dois grupos.

**Limites estruturais (por design, para impedir estados que quebram o layout):**

- **`background` fica pinado no índice 0.** É sempre o elemento mais atrás.
  `moveInOrder` rejeita qualquer pedido de reordenar o background (as 4 ações
  viram no-op silencioso); `insertIntoOrder`/`ensureOrder` chamam `pinBottom` para
  garantir a posição zero mesmo após inserções/reordenações. Na UI, a barra de
  ações mostra os 4 botões de camada desabilitados quando o background está
  selecionado, com tooltip explicando o motivo. O bg continua totalmente editável
  em posição/escala/opacidade/blur pela seleção — arrastar/redimensionar preserva
  o fit atual (`cover`, `contain` ou `free`) em vez de trocar modo automaticamente.
  Em `contain/free`, a moldura de seleção segue a área visível da foto; em `cover`,
  segue o frame preenchido. O único direito que ele NÃO tem é o de subir na pilha.
- **Decorações (`.diagonal-band`, `.watermark-paral`) não são editáveis.** Não
  têm `data-editable`, não entram em `layerOrder`, ficam com `z-index` fixo em
  CSS (5, entre o background e o topo da pilha editável). São chrome do template,
  não conteúdo; um usuário não seleciona nem reordena essas peças por design.
- **Logo e slots fixos de texto (`title`/`subtitle`/`selo`/`cta`/`category`)**
  são livremente reordenáveis. Podem passar por trás de um objeto, um objeto pode
  passar por cima do título — é uma decisão do usuário, não do motor.

**Restauração da ordem padrão:** dois caminhos convergem em `layers:reset`, que
recomputa `computeParticipants(state, entry)` — a ordem canônica: `background` no
0, slots fixos do template ativo na ordem em que aparecem no HTML, `logo`, textos
livres e objetos por ordem de nascimento. É disparado por:

1. **"Restaurar modelo"** (`app/canvas/template-reset.js`) — junto com o snapshot
   completo do estado. Cobrindo o caso "empilhei tudo errado, quero começar de
   novo esse post" sem precisar de undo passo a passo.
2. **`window.CaetusStudio.resetLayerOrder()`** — para automação/testes.

**Autocorreção sem migração de estado:** `ensureOrder(order, participants)` roda
a cada `render` — IDs órfãos (dado legado, undo parcial) somem, IDs novos entram
no topo mantendo a customização do usuário nos demais. Nenhum estado antigo
precisa ser migrado: um `layerOrder: []` num documento salvo antes do Marco 1 v2
é preenchido no primeiro render com a ordem canônica.

**Namespaces no bus:** `layers:bringToFront` / `layers:sendToBack` /
`layers:bringForward` / `layers:sendBackward` / `layers:reset` são o namespace
preferido. Os antigos `object:bringToFront` etc. seguem escutados por
`layers.js` para não quebrar chamadas de código legado (mesma ação, nome antigo).

**Atalhos de teclado:** `[` = enviar um nível, `]` = trazer um nível,
`Ctrl+[` = enviar para trás (tudo), `Ctrl+]` = trazer para frente (tudo). Só
disparam para elementos movíveis (background é ignorado). `Alt+clique` no canvas
cicla pelos elementos empilhados sob o cursor — resolve o caso de selecionar um
elemento coberto por outro sem precisar mexer em camadas primeiro.



## Selection Modes (Sprint 4A+)

Princípio novo, deliberado (ver também a seção "Como adicionar um novo componente
visual" para o princípio irmão de reaproveitar antes de criar): o Selection System
(`app/canvas/selection.js`) não é "um clique seleciona, um arraste move" só por
acidente de implementação — é um conceito de primeira classe, com modos nomeados,
exclusivos (nunca dois ativos ao mesmo tempo), sempre saindo por Esc ou por selecionar
outra coisa. Qualquer sprint futura que adicionar um modo novo deve estendê-los aqui,
não só em código:

- **Select mode** (o único que existe até a Sprint 4A): comportamento padrão já
  documentado nas seções acima — clique seleciona, arrastar move
  `elements[id]`/`logo`/`background`, a alça do canto redimensiona.
- **Text edit mode** (Marco 2, implementado): duplo clique — ou Enter com o texto já
  selecionado — num nó de texto entra aqui. `contentEditable=true`, mostra o valor cru
  (com `[colchetes]`), overlay some para não interceptar seleção nativa. Enter confirma
  (emite `text:update`, mantém a seleção); Esc reverte; clicar fora confirma. O
  Selection System é o dono do estado — `isEditingText(id)` é o único ponto de leitura
  externo (o renderer usa para não sobrescrever o innerText enquanto o caret está lá).
- **Viewport mode** (planejado): duplo clique num objeto-foto entraria aqui, para
  ajustar a foto dentro do próprio frame sem mexer no frame.

### Biblioteca de Elementos: pontos de extensão

`app/editor/elementos-panel.js` consome exclusivamente `manifest.assetLibrary` (nunca um
array cru), com categoria (chips) e busca (substring) já funcionais nesta sprint,
reaproveitando `app/editor/asset-picker.js` (o mesmo grid de Marca/Fundo, como já previsto
na Sprint 3A). Preparado para crescer sem redesenho:
- **Busca/categoria**: já reais.
- **Favoritos/recentes/marketplace**: não implementados. `AssetLibrary.getRecent()` já
  existe (ver seção abaixo) mas não é consumido pela UI ainda; um provider de
  Marketplace só precisa implementar a mesma interface `{ id, getAll, getById,
  getByCategory }` e ser registrado via `AssetLibrary.registerProvider`.
- **Conteúdo real das categorias `elementos`/`tracos`/`icones`/`texturas`**: continuam
  vazias nesta sprint (nenhum asset fictício foi criado — mesmo princípio da Sprint 3A).
  A aba já funciona com estado vazio (mensagem "Nenhum elemento cadastrado..."); quando
  um pipeline de assets externo popular `design-system/asset-providers/` (ou registrar
  um novo provider) com conteúdo real, a Aba Elementos passa a mostrar esse conteúdo sem
  nenhuma mudança de código, porque nunca lê nada além de `manifest.assetLibrary`.

## Asset Library e ConfigService (Sprint 3A)

Antes da Sprint 3A, logo e fundo eram `<select>` com `<option value="caminho/literal.png">`
hardcoded no HTML — qualquer UI que precisasse desses dados tinha que conhecer o caminho
físico do arquivo. A Asset Library elimina isso: **nenhuma parte da UI conhece caminho de
arquivo — tudo passa por `manifest.assetLibrary`.**

`design-system/asset-library.js` é uma fachada sobre **providers registráveis**, mesmo
padrão de registry já usado por `app/canvas/export/ExportService.js` (hoje um só
provider, trocável/extensível sem mudar quem chama):
```js
AssetLibrary.getAll()
AssetLibrary.getById(id)
AssetLibrary.getByCategory(category)
AssetLibrary.search(query)          // Sprint 3A: substring simples em label/categoria/tags
AssetLibrary.getRecent()            // Sprint 3A: aproximação simples, sem tracking de uso ainda
AssetLibrary.registerProvider(provider)  // preparado para múltiplos providers, não usado ainda
```
Um provider implementa `{ id, getAll(), getById(id), getByCategory(category) }`. Hoje só
existe `design-system/asset-providers/design-system-provider.js`, servindo os assets
reais do cartucho Caetus. Isso é o ponto de extensão que permite, no futuro, registrar um
provider "Local" (`assets/stock/`), um de API/CDN, ou um de Marketplace — a UI
(`app/editor/asset-picker.js` e os painéis que o usam) nunca precisa saber a diferença,
só continua chamando `manifest.assetLibrary.getByCategory(...)`.

Cada asset segue `{ id, type, category, label, preview, src, tags: [], metadata: {} }`.
`metadata` é uma sacola deliberadamente extensível — nenhuma chave é lida ainda nesta
sprint, mas o formato já reserva espaço para, por exemplo: `autor`, `licenca`,
`corDominante`, `empresa`, `premium`.

Categorias: `logos`, `fundos`, `elementos`, `tracos`, `icones`, `texturas`. Até a Sprint
3B, só `logos`/`fundos` têm asset real (os arquivos que já existiam em
`design-system/assets/`) — **nenhum asset fictício foi criado** só para preencher a
biblioteca. As outras 4 categorias continuam respondendo `[]` normalmente; a Aba
Elementos (Sprint 3B, ver seção "Objetos do Canvas" acima) já consome exclusivamente
`manifest.assetLibrary` e mostra esse conteúdo automaticamente assim que existir, sem
nenhuma mudança de código na aba.

`app/config/ConfigService.js` é o ponto único de configuração de nível de aplicação
(diferente de `state.js`, que é o documento — mesma lógica de exceção já documentada para
`zoom.js`: preferência do editor, não conteúdo do post). Nesta sprint só expõe
`getTheme()`/`setTheme(theme)` (único tema funcional: `'caetus'`) e emite `config:changed`
no bus — `app/editor/settings-modal.js` lê/escreve exclusivamente por aqui, nunca
`localStorage`/globals direto. É o lugar onde idioma/preferências entram depois.

## Modais: padrão comum (Templates, Exportação, Configurações)

Os 3 modais do Studio (`templates-modal.js`, `export-modal.js`, `settings-modal.js`)
seguem exatamente o mesmo padrão: um backdrop (`.hidden` toggle) + um panel (header com
título e botão fechar + corpo + rodapé opcional), fechado por clique no backdrop ou tecla
Escape, e um `openModal()`/`closeModal()` exportado para quem precisar abrir
programaticamente (`app/editor/automation.js`). Cada um hoje reimplementa esse esqueleto
de forma independente.

Com um 3º modal real existindo (e um 4º provável quando a Aba Elementos da Sprint 3B
precisar de algum diálogo), a evolução natural é um `ModalManager` central — registro de
modais + uma única implementação de backdrop/Escape/foco — **não implementado nesta
sprint**, só registrado aqui como direção. Critério prático para quando valer a pena:
quando o 4º modal for escrito, ou quando o padrão divergir entre os 3 existentes.

## Como trocar o Design System inteiro no futuro

Hoje existe uma única pasta `design-system/` (singular) — decisão deliberada de MVP, para não construir infraestrutura de múltiplas marcas sem uma segunda marca real para validar o desenho.

Quando isso for necessário:

1. Duplicar a pasta `design-system/` com a mesma forma de peças (`manifest.js`, `tokens.css`, `components.css`, `layouts.js`, `templates.js`, `presets.js`, `config.js`, `assets/`) para a nova marca, por exemplo `design-systems/empresa-x/`.
2. Renomear `design-system/` para `design-systems/caetus/`.
3. Introduzir um ponto único de seleção (ex.: `design-systems/active.js` re-exportando o manifest da marca ativa, ou um seletor em runtime) — só nesse momento, quando há uma segunda marca de verdade para justificar o mecanismo.
4. Nenhum módulo de `app/` deveria precisar mudar, já que todos só conhecem o *formato* do manifest, nunca o conteúdo específico da Caetus.

## Exportação: ExportService, ExportOptions e providers

A exportação (Sprint 2) foi desenhada para que **nenhuma UI conheça a lib de exportação usada por baixo** — nem o modal (`app/editor/export-modal.js`), nem a casca de bus (`app/canvas/export.js`).

O contrato entre as duas pontas é o `ExportOptions` (`app/canvas/export/export-options.js`):
```js
{ format: 'png' | 'jpg' | 'webp', width, height, quality, filename? }
```
`quality` (0–1) só é usado por jpg/webp; `filename` é opcional — quando omitido, `buildFilename()` gera um nome automático (`<prefixo da marca>_<formato do canvas>_<início do título>_<largura>x<altura>.<extensão>`).

Fluxo: `export-modal.js` monta um `ExportOptions` e emite `bus.emit('export:request', options)` → `canvas/export.js` (casca fina) delega a `ExportService.exportAndDownload(options, { onProgress })` → o modal reage a `export:status` (`start`/`success`/`error`) para mostrar loading/sucesso/erro, sem nunca travar a interface (é só um `await` assíncrono).

`ExportService.js` resolve o provider certo por um registry (`{ png: ..., jpg: ..., webp: ... }`) — hoje todos apontam para `providers/html-to-image-provider.js`, o único módulo que importa `window.htmlToImage` (CDN, carregado em `index.html`). **Trocar de lib de exportação no futuro é escrever um novo provider com a mesma assinatura (`renderToBlob(node, opts) -> Promise<Blob>`) e apontar o registry para ele** — nenhuma outra parte do sistema muda.

Pontos de extensão já preparados, não implementados (sem caso de uso real ainda):
- **PDF/SVG**: outro provider no mesmo registry, roteado por `options.format`.
- **Export em lote**: `exportDocument(options)` já é chamável em loop com múltiplos `ExportOptions` — cada chamada é independente e não compartilha estado mutável.
- **Diagnóstico**: `export/export-diagnostics.js` guarda as últimas 20 tentativas de exportação (provider, duração, tamanho do arquivo, sucesso/erro), exposto em `window.CaetusStudio.getExportDiagnostics()` — usado para comparar provedores sem precisar instrumentar de novo.

### Por que html-to-image em vez de html2canvas

`html2canvas` reimplementa a pintura de CSS em JS/Canvas2D (rasterizador próprio), o que produzia divergências visíveis entre o editor e o PNG exportado — fontes mais grossas/borradas, `filter: blur()` aproximado, bordas de `clip-path` mais serrilhadas, e pequenos desalinhamentos em imagens com `object-fit: cover` + `transform`. `html-to-image` serializa o DOM dentro de um SVG `<foreignObject>` e deixa o próprio motor do browser rasterizar — herda a mesma fidelidade da tela para todos esses casos.

**Comparação objetiva (Sprint 2, validada via `agent-browser` + `export-diagnostics.js`):**

| | html2canvas (antes) | html-to-image (depois) |
|---|---|---|
| Fidelidade de fonte | Reimplementada, mais grossa/borrada | Idêntica à tela (rasterização nativa) |
| `filter: blur()` (fundo) | Aproximado | Idêntico à tela |
| `clip-path` (faixa diagonal, watermarks) | Bordas mais serrilhadas | Bordas limpas, iguais à tela |
| `oklch()` nos tokens | Não suportado (forçava hex) | Suportado nativamente |
| Tempo de exportação — 1080×1080 | ~1–2s (não recontado nesta sprint) | 2,2s (primeira exportação, fontes/imagens ainda não em cache do provider) |
| Tempo de exportação — 800×800 | — | 1,4s |
| Tempo de exportação — 800×800 (repetição) | — | 0,9s |
| Tempo de exportação — 2160×3840 (Stories Alta) | — | 2,6s |
| Tamanho de arquivo — 1080×1080 PNG | — | ~1,33 MB |
| Tamanho de arquivo — 2160×3840 PNG | — | ~5,49 MB |
| Erro em imagem de fundo inacessível (URL quebrada/CORS) | `alert()` bloqueante | Mensagem amigável no modal, sem travar a UI; `err.message` do evento de erro de imagem chega vazio (cai no fallback "erro desconhecido") — melhoria futura possível: capturar `img.onerror` e propagar uma mensagem mais específica |

Não foi possível medir os tempos/tamanhos do html2canvas retroativamente (a lib foi removida após a validação confirmar a migração), então a comparação de performance é qualitativa para ele e quantitativa (medida de verdade, via `getExportDiagnostics()`) para o html-to-image. A fidelidade visual foi comparada olho a olho (screenshots do editor vs. PNG exportado, mesma sessão) e não apresentou nenhuma regressão — pelo contrário, resolveu os 4 problemas de fidelidade listados no início desta seção.

## Documento → Páginas → Canvas → Elementos (preparação futura, não implementada)

Hoje `app/canvas/state.js` guarda um único documento (um post = um canvas). A evolução planejada é:
```
Document { id, pages: Page[] }
Page { id, state: <exatamente a forma que state.js já tem hoje> }
```
`state.js` já tem, hoje, exatamente a forma que `Page.state` vai ter no futuro — a evolução é envolver o `state` atual em `document.pages[0].state`, sem mudar a assinatura de `getState()`/`setState()` nem `renderer.js`: só o módulo que hoje é "a página única" precisa aprender que pode existir mais de uma. Nenhum código foi escrito para isso ainda — fica registrado aqui como direção, não como TODO ativo.

## Débito técnico conhecido do MVP (intencional, não escondido)

- **Cores hardcoded na sidebar via classes Tailwind** (`bg-[#0F50E2]`, `border-[#3b82f6]`, etc.) — o chrome da sidebar usa valores de cor literais em vez de `var(--accent)` em ~15 lugares. Já existia no protótipo original; não foi tocado nesta extração para não introduzir mudança de comportamento fora de escopo.
- **`.control-input:focus` hardcoda `#0F50E2`** em `styles/layout.css`, mesmo sendo um arquivo "genérico" — mesmo motivo acima.
- ~~As opções dos `<select>` de logo/preset de fundo são estáticas no HTML~~ — **resolvido na Sprint 3A**: viraram grids dinâmicos (`app/editor/marca-panel.js`/`fundo-panel.js`) gerados a partir de `manifest.assetLibrary`, sem nenhum caminho de arquivo hardcoded na UI.
- **O `<select>` de preset de *conteúdo*** (`#preset-selector`, os 3 presets prontos silencio/whatsapp/tempo) continua estático no HTML — não faz parte da Asset Library (não é um asset navegável, é um conjunto de textos+configuração inteiro) e está fora do escopo desta sprint. Um Design System diferente que quisesse mais/menos presets de conteúdo ainda precisaria editar `index.html`.
- **ES modules não carregam via `file://`** — é preciso um servidor estático local para rodar (ver `README.md`).
- ~~Exportação PNG falha com os tokens de cor `oklch()`~~ — **resolvido na Sprint 2**: a exportação migrou de `html2canvas` para `html-to-image` (ver seção "Exportação" acima), que rasteriza com o motor do próprio browser em vez de reimplementar CSS — `oklch()` funciona nativamente. Os tokens em `design-system/tokens.css`/`components.css` foram revertidos de hex para `oklch()`, validado tanto no editor quanto no PNG exportado.
- **Um único Design System ativo por vez** — ver seção acima sobre como evoluir para múltiplos.
- **Modal de exportação só oferece presets de resolução para canvas 1:1 e 9:16** (Instagram Feed/Alta, Stories/Alta) — formatos 4:5, 16:9 e 1.91:1 caem sempre em "Tamanho atual" ou "Personalizado", já que não há presets 4:5/16:9/1.91:1 definidos ainda em `export/resolution-presets.js`. Fácil de estender: só adicionar entradas na lista.
- **JPG/WEBP aparecem desabilitados no modal de exportação** ("em breve") — `ExportService`/o provider já suportam os dois de verdade (só muda o `mimeType`), só não foram expostos na UI nesta sprint por pedido explícito.
- **Fit de fundo `'stretch'`/`'tile'` não implementados** — `state.background.fit` já aceita `'free'`/`'contain'`/`'cover'` de verdade (ver `app/canvas/background.js`/`renderer.js`); `'stretch'` seria só `object-fit: fill`, e `'tile'` exigiria trocar `#bg-img` de `<img>` para um elemento com `background-image` + `background-repeat` (object-fit não tem valor de tile). Ficam para quando houver um segundo caso de uso real.
- **Zoom é a única exceção documentada à regra "só `renderer.js` escreve no canvas"** (`app/canvas/zoom.js`) — de propósito, porque é estado de viewport, não de documento (ver seção "Estado como fonte única da verdade").
- **A aba Selos foi removida (pós Sprint 3B)** — o conceito de "selo" deixou de ser um painel próprio; hoje é só mais um item de `state.texts` (id `selo`), editável pela aba Texto como qualquer outro. `state.components.seals` (`design-system/config.js`) continua declarado como ponto de extensão para um futuro componente visual "[Ícone] Texto" (selo = texto + ícone da Biblioteca de Elementos), mas não tem UI nem renderização própria ainda.
- **BACKLOG — Publicar um manifesto único de assets na raiz do projeto**: hoje `design-system/asset-providers/local-assets-provider.js` conhece a estrutura interna de `assets/stock/` na unha (descobre categorias pelas tabelas dos `index.md` gerais de `elements/` e `images/`, e faz parse linha a linha do formato "YAML-like" de cada `index.md` de categoria — ver `.caetus/rules/assets.md`). Funciona, mas acopla o Studio ao formato de arquivo que as skills usam internamente; qualquer mudança de formato nos índices (novo campo, nova pasta de tipo de mídia tipo `videos/`/`models/`, mudança na sintaxe) exige tocar neste provider. Não é urgente — só vale a pena quando o ecossistema de skills crescer o suficiente para esse acoplamento doer de verdade. Direção natural: uma skill (`asset-search` ou uma nova) publicar um `assets/manifest.json` único e já achatado (lista plana de `{ id, type, category, label, preview, src, tags }`) toda vez que grava algo novo em `assets/stock/`; o provider do Studio passaria a só ler esse JSON, sem parsear `index.md` nem conhecer a árvore de pastas.
