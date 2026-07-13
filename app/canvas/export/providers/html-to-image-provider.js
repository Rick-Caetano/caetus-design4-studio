// Único módulo que fala diretamente com a lib html-to-image (window.htmlToImage,
// carregada via CDN em index.html). Nenhum outro módulo deve chamar window.htmlToImage
// diretamente — sempre passar por ExportService.exportDocument().
//
// html-to-image serializa o DOM dentro de um SVG <foreignObject> e deixa o próprio
// motor do browser rasterizar — por isso reproduz fontes, filter (blur), clip-path e
// object-fit com a mesma fidelidade da tela, ao contrário do html2canvas (que
// reimplementa a pintura de CSS em JS/Canvas2D). Ver docs/ARCHITECTURE.md.

// Exporta em alta resolução sem re-fluir o layout: escala o clone via CSS transform
// (padrão recomendado pela própria lib para export em alta DPI) e pede o canvas já no
// tamanho final de pixels, em vez de usar pixelRatio (que reflui o layout).
async function renderToBlob(node, { mimeType, quality, pixelWidth, pixelHeight }) {
  const nativeWidth = node.offsetWidth;
  const nativeHeight = node.offsetHeight;
  const scale = pixelWidth / nativeWidth;

  const canvas = await window.htmlToImage.toCanvas(node, {
    canvasWidth: pixelWidth,
    canvasHeight: pixelHeight,
    pixelRatio: 1,
    backgroundColor: '#FFFFFF',
    style: {
      transform: `scale(${scale})`,
      transformOrigin: 'top left',
      width: nativeWidth + 'px',
      height: nativeHeight + 'px',
    },
    // O overlay de seleção (moldura + alça de resize) é chrome de edição, não faz
    // parte do post — nunca deve aparecer no arquivo exportado.
    filter: (element) => element.id !== 'selection-overlay',
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Falha ao gerar a imagem (blob vazio).'));
        return;
      }
      resolve(blob);
    }, mimeType, quality);
  });
}

export { renderToBlob };
