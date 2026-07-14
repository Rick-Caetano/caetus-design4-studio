"""Seed único: migra os 3 templates estáticos que hoje moram em
design-system/templates.js (minimal/cinematic/split, tema Caetus) para Design
Documents reais, donos da empresa caetus_systems — a primeira empresa do sistema.

Isso é o primeiro passo prático da meta "o Studio não é dono de layout, as
empresas são": depois deste seed, o modal de layouts (templates-modal.js) não lê
mais design-system/templates.js como fonte de listagem — só a API.

origin='official' + visibility='shared' aqui é o único lugar do sistema (fora do
seed da Joá) que nasce assim de propósito: são os layouts oficiais da própria
Caetus, usados como semente do "⭐ Oficiais da Caetus" na aba "Mais Layouts".

Rodar com: python server/seed_caetus_systems.py
"""
import copy
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import designs_service as designs  # noqa: E402

COMPANY_ID = 'caetus_systems'

# Mesma forma de design-system/config.js > defaultState — mantido em sincronia
# manualmente (dado estático de seed, não código de produção lido em runtime).
BASE_STATE = {
    'format': '1:1',
    'template': 'minimal',
    'brandTheme': 'caetus',
    'texts': [
        {'id': 'title', 'type': 'heading', 'category': 'titulo-principal', 'label': 'Título',
         'value': 'Enquanto você atende um cliente, outros já esperam no WhatsApp.',
         'style': {'typography': {}, 'background': {}, 'border': {}}},
        {'id': 'subtitle', 'type': 'body', 'category': 'subtitulo', 'label': 'Subtítulo',
         'value': 'Sua empresa pode responder na hora, sem contratar ninguém e sem perder vendas.',
         'style': {'typography': {}, 'background': {}, 'border': {}}},
        {'id': 'selo', 'type': 'body', 'category': 'selo', 'label': 'Selo',
         'value': 'Tecnologia que trabalha nos bastidores para você focar no que importa.',
         'style': {'typography': {}, 'background': {}, 'border': {}}},
        {'id': 'cta', 'type': 'body', 'category': 'cta', 'label': 'Chamada (CTA)',
         'value': 'Fale com a gente.',
         'style': {'typography': {}, 'background': {}, 'border': {}}},
        {'id': 'category', 'type': 'chip', 'category': 'tag-categoria', 'label': 'Categoria',
         'value': 'TECNOLOGIA & EFICIÊNCIA',
         'style': {'typography': {'colorToken': 'fg'}, 'background': {'colorToken': 'surface'}, 'border': {'radius': 0}}},
        {'id': 'brandName', 'type': 'body', 'category': 'texto', 'label': 'Nome da Marca',
         'value': 'CAETUS SYSTEMS',
         'style': {'typography': {'colorToken': 'fg', 'fontSize': 16, 'fontWeight': 700}, 'background': {}, 'border': {}}},
    ],
    'background': {'preset': 'bg-silencio-1', 'customUrl': '', 'opacity': 15, 'blur': 0, 'x': 0, 'y': 0, 'scale': 1, 'fit': 'cover'},
    'logo': {'assetId': 'logo-lockup', 'src': 'design-system/assets/logo-lockup.png', 'x': 0, 'y': 0, 'scale': 1, 'rotation': 0, 'opacity': 1},
    'elements': {
        'title': {'x': 0, 'y': 0, 'scale': 1},
        'subtitle': {'x': 0, 'y': 0, 'scale': 1},
        'selo': {'x': 0, 'y': 0, 'scale': 1},
        'cta': {'x': 0, 'y': 0, 'scale': 1},
        'category': {'x': 0, 'y': 0, 'scale': 1},
        'brandName': {'x': 96, 'y': 990, 'scale': 1},
        'diagonal-band': {'x': 0, 'y': 0, 'scale': 1},
        'divider-bar': {'x': 96, 'y': 475, 'scale': 1},
        'footer-bar': {'x': 0, 'y': 0, 'scale': 1},
        'watermark-pattern': {'x': 0, 'y': 0, 'scale': 1},
    },
    'components': [
        {'id': 'diagonal-band', 'kind': 'diagonalBand', 'visible': True},
        {'id': 'divider-bar', 'kind': 'dividerBar', 'visible': True},
        {'id': 'footer-bar', 'kind': 'footerBar', 'visible': True},
        {'id': 'watermark-pattern', 'kind': 'watermarkPattern', 'visible': True},
    ],
    'objects': [],
    'layerOrder': [],
}

# key, display name, category, template field, component visibility patch
TEMPLATES = [
    ('minimal', 'Clean', 'Minimalista', 'minimal', {}),
    ('cinematic', 'Cinemático', 'Cinemático', 'cinematic', {'watermark-pattern': False}),
    ('split', 'Editorial', 'Editorial', 'split', {'diagonal-band': False, 'watermark-pattern': False}),
]


def build_state(template_key, component_patch):
    state = copy.deepcopy(BASE_STATE)
    state['template'] = template_key
    for component in state['components']:
        if component['id'] in component_patch:
            component['visible'] = component_patch[component['id']]
    return state


def main():
    for key, label, category, template_key, patch in TEMPLATES:
        state = build_state(template_key, patch)
        doc = designs.seed(
            COMPANY_ID,
            design_id=key,
            name=label,
            state=state,
            categories=[category],
            tags=[],
            origin='official',
            visibility='shared',
        )
        print(f"Seed criado: {COMPANY_ID}/{doc['id']} ({label})")


if __name__ == '__main__':
    main()
