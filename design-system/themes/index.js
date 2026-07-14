// Loader dos BrandThemes — cada tema é uma pasta em design-system/themes/<key>/ com
// manifest.yaml + colors.yaml + typography.yaml. Este módulo lê tudo via fetch + js-yaml
// (window.jsyaml, CDN em index.html) e devolve uma lista normalizada. Cada tema tem a
// forma:
//
//   { key, label, description, colors: { bg, surface, fg, accent, muted, border },
//     typography: { display, body, mono, googleFontsUrl? } }
//
// TODO ao adicionar tema novo: criar a pasta + entrar em THEME_KEYS abaixo.
// (Um índice em disco — themes/index.yaml — evitaria essa lista, mas ainda temos só três
//  temas; simples-e-explícito ganha por enquanto.)

const THEME_KEYS = ['caetus', 'editorial', 'vibrant', 'joa'];

function yamlLoad(text) {
  const jsyaml = window.jsyaml;
  if (!jsyaml || typeof jsyaml.load !== 'function') {
    throw new Error('js-yaml não carregou (ver <script> em index.html)');
  }
  return jsyaml.load(text);
}

async function fetchYaml(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return yamlLoad(await res.text());
}

async function loadTheme(key) {
  const base = `design-system/themes/${key}`;
  const [manifest, colors, typography] = await Promise.all([
    fetchYaml(`${base}/manifest.yaml`),
    fetchYaml(`${base}/colors.yaml`),
    fetchYaml(`${base}/typography.yaml`),
  ]);
  return {
    key: manifest.key || key,
    label: manifest.label || key,
    description: manifest.description || '',
    colors: colors.tokens || {},
    typography: {
      display: typography.display || {},
      body: typography.body || {},
      mono: typography.mono || {},
      googleFontsUrl: typography.googleFontsUrl || null,
    },
  };
}

let themes = [];

async function load() {
  const results = await Promise.all(
    THEME_KEYS.map((key) => loadTheme(key).catch((err) => {
      console.warn(`[themes] falha ao carregar tema "${key}"`, err);
      return null;
    }))
  );
  themes = results.filter(Boolean);
  return themes;
}

function getAll() { return themes; }
function getById(key) { return themes.find((t) => t.key === key) || null; }

// Lista de tokens semânticos SUPORTADOS — usados pelo swatch UI e como whitelist para
// validar `colorToken` gravado em state (texto/objeto). Manter em sincronia com as
// chaves de colors.yaml de todos os temas.
const TOKEN_KEYS = ['bg', 'surface', 'fg', 'accent', 'muted', 'border'];

export default {
  ready: load(),
  getAll,
  getById,
  TOKEN_KEYS,
};