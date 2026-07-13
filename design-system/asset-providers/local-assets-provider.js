// Provider da Asset Library que lê assets/stock/ — a pasta, na RAIZ DO PROJETO (fora de
// caetus-studio/), onde as skills asset-search/stock-images/stock-elements gravam tudo
// que baixam (ver .caetus/rules/assets.md). É o provider "Local" que o comentário de
// design-system-provider.js já previa: mesma interface ({ id, getAll, getById,
// getByCategory }), plugado em design-system/asset-library.js do mesmo jeito.
//
// `assets/stock/` fica um nível acima de caetus-studio/, por isso só é alcançável
// quando o servidor estático serve a partir da raiz do projeto (ver iniciar.py) — um
// servidor restrito a caetus-studio/ nunca conseguiria servir esses arquivos.
//
// Cada índice (assets/stock/images/index.md, assets/stock/elements/index.md, e o
// index.md de cada categoria dentro deles) segue o formato documentado em
// .caetus/rules/assets.md: uma lista "YAML-like", não YAML de verdade (algumas
// descrições têm aspas internas não escapadas que quebrariam um parser real) — por
// isso o parser abaixo é deliberadamente tolerante, linha a linha, sem validar sintaxe.
//
// getAll/getByCategory/getById são SÍNCRONOS (mesmo contrato do provider estático da
// Caetus), mas a leitura é assíncrona (fetch). O array começa vazio e é populado em
// segundo plano por load() — `ready` (Promise) avisa quando terminou, para quem
// orquestra o bootstrap (app/app.js) decidir redesenhar os painéis já existentes sem
// este módulo precisar conhecer bus/state (que pertencem ao motor, não ao dado de
// marca — ver design-system/manifest.js).

const ROOT = '../assets/stock';

// Pastas de assets/stock/elements/ que já têm uma aba própria na Biblioteca de
// Elementos (ver app/editor/elementos-panel.js: elementos/tracos/icones/texturas).
// Qualquer categoria nova que as skills criarem sem entrar aqui cai em 'elementos' por
// padrão — nunca fica invisível só por falta de mapeamento.
const ELEMENT_CATEGORY_TO_UI = {
  icons: 'icones',
  textures: 'texturas',
};

let assets = [];

function stripQuotes(value) {
  const trimmed = value.trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseValue(raw) {
  const value = raw.trim();
  if (value.startsWith('[') && value.endsWith(']')) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(',').map((item) => stripQuotes(item));
  }
  return stripQuotes(value);
}

// Índice de categoria: sequência de blocos "- chave: valor" com linhas de continuação
// indentadas (2+ espaços). Cada bloco novo começa em uma linha "- chave: valor".
function parseEntries(text) {
  const entries = [];
  let current = null;
  text.split(/\r?\n/).forEach((line) => {
    const itemMatch = line.match(/^-\s+([a-zA-Z_]+):\s*(.*)$/);
    if (itemMatch) {
      if (current) entries.push(current);
      current = { [itemMatch[1]]: parseValue(itemMatch[2]) };
      return;
    }
    const fieldMatch = line.match(/^\s{2,}([a-zA-Z_]+):\s*(.*)$/);
    if (fieldMatch && current) {
      current[fieldMatch[1]] = parseValue(fieldMatch[2]);
    }
  });
  if (current) entries.push(current);
  return entries;
}

// Índice geral (assets/stock/elements/index.md ou assets/stock/images/index.md): só a
// tabela markdown lista as categorias existentes (primeira coluna) — nenhum nome de
// categoria é hardcoded aqui, pastas novas aparecem sozinhas na próxima carga.
function parseCategoryNames(text) {
  const names = [];
  text.split(/\r?\n/).forEach((line) => {
    const row = line.match(/^\|\s*([a-z0-9-]+)\s*\|/i);
    if (!row) return;
    const value = row[1].trim();
    if (value === 'categoria' || /^-+$/.test(value)) return;
    names.push(value);
  });
  return names;
}

async function fetchText(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.text();
}

async function loadElementCategory(folder) {
  const uiCategory = ELEMENT_CATEGORY_TO_UI[folder] || 'elementos';
  const text = await fetchText(`${ROOT}/elements/${folder}/index.md`);
  return parseEntries(text).map((entry) => {
    const path = `${ROOT}/elements/${folder}/${entry.file}`;
    return {
      id: `local-elements-${entry.id || entry.file}`,
      type: 'image',
      category: uiCategory,
      label: entry.title || entry.file,
      preview: path,
      src: path,
      tags: Array.isArray(entry.tags) ? entry.tags : [],
      metadata: {
        source: entry.source,
        author: entry.author,
        license: entry.license,
        style: entry.style,
        colorVariant: entry.color_variant,
      },
    };
  });
}

async function loadImageCategory(folder) {
  const text = await fetchText(`${ROOT}/images/${folder}/index.md`);
  return parseEntries(text).map((entry) => {
    const path = `${ROOT}/images/${folder}/${entry.file}`;
    return {
      id: `local-images-${folder}-${entry.file}`,
      type: 'image',
      // Fotos de assets/stock/images/ entram como fundos — mesmo fluxo de qualquer
      // outro fundo da Asset Library (ver app/editor/fundo-panel.js).
      category: 'fundos',
      label: entry.title || entry.file,
      preview: path,
      src: path,
      tags: Array.isArray(entry.tags) ? entry.tags : [],
      metadata: {
        source: entry.source,
        author: entry.author,
        license: entry.license,
        recommendedFor: entry.recommended_for,
      },
    };
  });
}

async function loadGroup(kind, loader) {
  const results = [];
  let categoryNames = [];
  try {
    categoryNames = parseCategoryNames(await fetchText(`${ROOT}/${kind}/index.md`));
  } catch (err) {
    // assets/stock/<kind>/ ainda não existe neste projeto — biblioteca fica vazia
    // nesta seção, não é erro fatal (mesmo espírito do array vazio documentado em
    // design-system-provider.js para categorias sem asset real ainda).
    return results;
  }
  for (const folder of categoryNames) {
    try {
      results.push(...(await loader(folder)));
    } catch (err) {
      console.warn(`[local-assets-provider] falha ao ler assets/stock/${kind}/${folder}/index.md`, err);
    }
  }
  return results;
}

async function load() {
  const [elements, images] = await Promise.all([
    loadGroup('elements', loadElementCategory),
    loadGroup('images', loadImageCategory),
  ]);
  assets = [...elements, ...images];
  return assets;
}

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
  id: 'local-stock',
  ready: load(),
  getAll,
  getById,
  getByCategory,
};
