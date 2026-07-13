# Caetus Studio

Editor visual para criação de posts, carrosséis e banners de redes sociais. Extraído de um protótipo gerado pelo Open Design, reorganizado como um motor reutilizável que interpreta um Design System plugável — ver [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) para o detalhe completo da arquitetura.

Hoje o único Design System disponível é o da Caetus Systems, em `design-system/`.

## Rodando localmente

É uma aplicação estática (sem build, sem `package.json`), mas usa ES modules — que o navegador não carrega via `file://`. É preciso servir os arquivos com um servidor estático simples.

A forma recomendada é `python iniciar.py` (ou `iniciar.bat` no Windows) a partir desta pasta: ele já sobe o servidor a partir da **raiz do projeto** (pai de `caetus-studio/`), abre o navegador na URL certa e imprime tudo pronto. Isso importa porque a Asset Library do Studio lê `assets/stock/` (ver `design-system/asset-providers/local-assets-provider.js`), que fica fora de `caetus-studio/` — um servidor que serve só esta pasta nunca alcançaria esses arquivos.

Se preferir subir manualmente, rode o servidor **a partir da raiz do projeto** (uma pasta acima desta), não daqui de dentro:

```bash
cd ..

# Node
npx serve .

# Python
python -m http.server 8000
```

Depois abra `http://localhost:8000/caetus-studio/index.html` (ajuste a porta conforme o que o servidor imprimir).

## O que é isto

- **`index.html`** — o shell do editor (markup da sidebar + do canvas).
- **`app/`** — o motor: lógica do editor e do canvas, agnóstica de marca.
- **`design-system/`** — os dados de marca da Caetus (cores, tipografia, layouts, presets, assets).
- **`styles/`** — CSS estrutural genérico do editor.
- **`docs/ARCHITECTURE.md`** — por que cada pasta existe, como estender.

## Débito técnico conhecido

Ver a seção final de [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — inclui um bug pré-existente na exportação PNG (herdado do protótipo original, não introduzido por esta reorganização).
