// O manifest é o CÉREBRO do Design System: um único objeto de dados que o motor
// (app/) consulta para saber tudo sobre a marca ativa. Nenhum módulo de app/ importa
// config.js/layouts.js/presets.js diretamente — sempre passa por este manifest.
//
// Trocar de Design System no futuro = importar outro manifest.js equivalente aqui.

import { formatConfig, defaultState, meta } from './config.js';
import { standard, split } from './layouts.js';
import { silencio, whatsapp, tempo } from './presets.js';
import { templates } from './templates.js';
import { componentsRegistry, componentDefaults } from './components-registry.js';
import assetLibrary from './asset-library.js';
import brandThemes from './themes/index.js';

export default {
  meta,
  config: { formatConfig, defaultState },
  layouts: { standard, split },
  templates,
  presets: { silencio, whatsapp, tempo },
  // Registry dos componentes reutilizáveis (faixas, padrões, futuros crachás/QR/etc).
  // O motor consulta `componentsRegistry[kind].render(node, instance)` para pintar cada
  // instância de state.components. Nada específico por peça vaza para o motor.
  componentsRegistry,
  componentDefaults,
  assetLibrary,
  // BrandThemes (Marco 3): pastas em design-system/themes/<key>/ carregadas via YAML.
  // Ver app/canvas/brand-theme.js para aplicação e app/editor/tema-panel.js para UI.
  brandThemes,
  assets: {
    fonts: {
      bricolageBold: 'design-system/assets/fonts/BricolageGrotesque-Bold.ttf',
      instrumentRegular: 'design-system/assets/fonts/InstrumentSans-Regular.ttf',
      instrumentBoldItalic: 'design-system/assets/fonts/InstrumentSans-BoldItalic.ttf',
      plexMonoRegular: 'design-system/assets/fonts/IBMPlexMono-Regular.ttf',
    },
    images: {
      logoLockup: 'design-system/assets/logo-lockup.png',
      caetusLogo: 'design-system/assets/images/caetus_logo.png',
      caetusLogoNoBg: 'design-system/assets/images/caetus_logo_no_bg.png',
      silencioPreset1: 'design-system/assets/images/silencio_produtivo_preset_1.jpg',
      silencioPreset2: 'design-system/assets/images/silencio_produtivo_preset_2.jpg',
    },
  },
  capabilities: {
    // Componentes visuais que este Design System conhece — só uma lista (dado), não
    // usada como restrição em nenhum lugar. Ver componentsRegistry para a fonte real.
    components: ['headline', 'subtitle', 'footer', 'seal', 'logo', 'background', 'diagonal-band', 'divider-bar', 'footer-bar', 'watermark-pattern'],
  },
};
