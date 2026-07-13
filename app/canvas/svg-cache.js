// Cache de SVGs recolorable. Faz fetch da URL, sanitiza (remove <script> e event
// handlers on*), guarda a string do <svg> raiz e devolve um clone pronto para inserir
// no DOM — com fill/stroke aplicados via setAttribute na raiz (currentColor propaga
// para os filhos que usam `currentColor`; para SVGs com cores hardcoded, o applyColors
// abaixo faz um segundo passe reescrevendo fill/stroke onde necessário).

const cache = new Map(); // url -> Promise<SVGElement | null>

function sanitize(svgEl) {
  svgEl.querySelectorAll('script').forEach((n) => n.remove());
  svgEl.querySelectorAll('*').forEach((n) => {
    [...n.attributes].forEach((attr) => {
      if (attr.name.startsWith('on')) n.removeAttribute(attr.name);
    });
  });
  return svgEl;
}

async function fetchSvg(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`SVG ${url}: HTTP ${res.status}`);
  const text = await res.text();
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const svg = doc.documentElement;
  if (!svg || svg.tagName.toLowerCase() !== 'svg') return null;
  return sanitize(svg);
}

export function getSvg(url) {
  if (!cache.has(url)) {
    cache.set(url, fetchSvg(url).catch((err) => {
      console.warn('[svg-cache]', err);
      return null;
    }));
  }
  return cache.get(url);
}

// Aplica fill/stroke a um <svg> clonado. Para elementos que já usam `currentColor`, o
// atributo `color` na raiz basta (herança CSS). Para SVGs sem currentColor, fazemos
// um passe rewrite: em `paintable` (path/rect/circle/…) que TEM o atributo, trocamos
// só quando o call site pediu recolor (fill != null / stroke != null).
const PAINTABLE = 'path,rect,circle,ellipse,polygon,polyline,line,g,use';

export function applyColors(svgEl, { fill, stroke } = {}) {
  if (fill != null) {
    svgEl.setAttribute('color', fill); // resolve `fill="currentColor"` em toda descendência
    svgEl.querySelectorAll(PAINTABLE).forEach((n) => {
      const cur = n.getAttribute('fill');
      if (cur && cur.toLowerCase() !== 'none' && cur.toLowerCase() !== 'currentcolor') {
        n.setAttribute('fill', fill);
      }
    });
  }
  if (stroke != null) {
    svgEl.querySelectorAll(PAINTABLE).forEach((n) => {
      const cur = n.getAttribute('stroke');
      if (cur && cur.toLowerCase() !== 'none' && cur.toLowerCase() !== 'currentcolor') {
        n.setAttribute('stroke', stroke);
      }
    });
  }
}