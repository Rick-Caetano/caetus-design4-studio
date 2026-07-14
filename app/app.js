// Bootstrap do motor Caetus Studio: importa o design system ativo, liga o
// Editor e o Canvas via event bus + state.js, e inicializa a página com o preset
// padrão (equivalente ao window.onload do protótipo original).

import manifest from '../design-system/manifest.js';
import bus from './events/bus.js';
import { initControls } from './editor/controls.js';
import { initContentPresets, loadContentPresets } from './editor/content-presets.js';
import { initAutomation } from './editor/automation.js';
import { initTemplatesModal } from './editor/templates-modal.js';
import { initSaveDesignPanel } from './editor/save-design-panel.js';
import { initExportModal } from './editor/export-modal.js';
import { initSidebarReactor } from './editor/sidebar-reactor.js';
import { initTextsPanel } from './editor/texts-panel.js';
import { initTextStylePanel } from './editor/text-style-panel.js';
import { initMarcaPanel } from './editor/marca-panel.js';
import { initFundoPanel } from './editor/fundo-panel.js';
import { initImagensModal } from './editor/imagens-modal.js';
import { initElementosPanel } from './editor/elementos-panel.js';
import { initSettingsModal } from './editor/settings-modal.js';
import { initTemaPanel } from './editor/tema-panel.js';
import { initObjectStylePanel } from './editor/object-style-panel.js';
import { initBrandTheme } from './canvas/brand-theme.js';
import { showEmpresaGate } from './editor/empresa-gate.js';
import { getActiveCompany, hasEmpresaInUrl } from './canvas/empresa-context.js';

// Módulos do canvas se registram no bus (ações → setState) como efeito colateral da
// importação. render() em renderer.js é o único que escreve no DOM do canvas.
import './canvas/format.js';
import './canvas/renderer.js';
import './canvas/text.js';
import './canvas/background.js';
import './canvas/logo.js';
import './canvas/objects.js';
import './canvas/layers.js';
import './canvas/components.js';
import './canvas/export.js';

import { getState, setState } from './canvas/state.js';
import { render } from './canvas/renderer.js';
import { initSelection } from './canvas/selection.js';
import { initZoomControls } from './canvas/zoom.js';
import { initHistory } from './canvas/history.js';
import { initTemplateReset } from './canvas/template-reset.js';
import { initDesignLoad } from './canvas/design-load.js';
import { initSidebarChrome } from './ui/sidebar.js';
import { initFullscreen } from './ui/fullscreen.js';
import { initShortcuts } from './ui/shortcuts.js';
import { initSidebarTabs } from './ui/sidebar-tabs.js';
import { initHistoryToolbar } from './ui/history-toolbar.js';

async function bootstrap() {
  // Ambiente ativo (ver app/canvas/empresa-context.js): nome no header e BrandTheme
  // inicial vêm da empresa da URL (?empresa=), escolhida no gate de abertura
  // (empresa-gate.js) — trocar de empresa depois disso significa voltar pro gate.
  const activeCompany = getActiveCompany();
  document.getElementById('brand-company-name').innerText = activeCompany.label;
  document.getElementById('brand-header-logo').src = manifest.assets.images.caetusLogoNoBg;
  document.title = `${activeCompany.label} — Caetus Studio`;

  initControls();
  initContentPresets();
  initAutomation();
  initTemplatesModal();
  initSaveDesignPanel();
  initExportModal();
  initSidebarReactor();
  initTextsPanel();
  initTextStylePanel();
  initMarcaPanel();
  initFundoPanel();
  initImagensModal();
  initElementosPanel();
  initSettingsModal();
  initTemaPanel();
  initObjectStylePanel();
  initBrandTheme();
  initSidebarChrome();
  initFullscreen();
  initShortcuts();
  initSidebarTabs();
  initTemplateReset();
  initDesignLoad();

  // BrandTheme inicial = o tema próprio da empresa ativa, já selecionado como padrão
  // na aba "Tema da marca" — antes da primeira pintura, pra não haver flash do tema
  // Caetus seguido de troca.
  setState({ brandTheme: activeCompany.theme });

  // "Presets de conteúdo" (ver content-presets.js) = os Design Documents da própria
  // empresa. O primeiro deles vira o estado inicial completo — textos, tema E
  // componentes de marca (Faixa Diagonal/Principal/Footer, Padrão de Marca…) juntos,
  // porque cada empresa tem sua própria versão desses componentes (ver seeds em
  // server/seed_*.py). Sem isso, toda empresa nova nascia com o "esqueleto" genérico
  // da Caetus só recolorido — o motivo do bug relatado.
  const ownDesigns = await loadContentPresets();
  if (ownDesigns.length) {
    setState(structuredClone(ownDesigns[0].state));
    const select = document.getElementById('preset-selector');
    if (select) select.value = ownDesigns[0].id;
  }

  render(getState()); // pintura inicial a partir do estado (já específico da empresa)
  initSelection(); // seleção/drag/resize dos elementos do canvas — depende do DOM já pintado
  initZoomControls(); // faz o fit inicial e passa a reagir a mudanças de formato

  // Depois de tudo carregado (preset padrão incluso), para que o histórico de
  // undo/redo (Ctrl+Z / Ctrl+Shift+Z, e os botões visuais) comece a contar só a partir daqui.
  initHistory();
  initHistoryToolbar();

  // A Asset Library local (design-system/asset-providers/local-assets-provider.js) lê
  // assets/stock/ via fetch e só termina depois de um round-trip de rede — os painéis
  // que a consomem (marca/fundo/elementos) já reagem a 'state:changed', então só
  // reemitir o evento quando ela terminar já os redesenha com os assets recém-chegados,
  // sem precisar de um canal de eventos novo.
  manifest.assetLibrary.ready.then(() => bus.emit('state:changed', getState()));
}

// Primeira página: se a URL ainda não escolheu uma empresa, mostra o gate de
// seleção (empresa-gate.js) e para por aí — bootstrap só roda depois que o usuário
// escolher (o que recarrega a página já com ?empresa=).
function start() {
  if (!hasEmpresaInUrl()) {
    showEmpresaGate();
    return;
  }
  bootstrap();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}
