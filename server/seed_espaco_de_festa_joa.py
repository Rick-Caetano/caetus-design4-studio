"""Seed único: recria os 3 presets do protótipo avulso da Espaço de Festa Joá
(.claude/skills/open-design/.od/projects/a5024258-98a8-4c43-8684-feec40235437/) como
Design Documents reais, no motor NOVO do caetus-studio (BrandTheme + components-
registry + layers) — a funcionalidade daquele protótipo (a API bespoke
window.CaetusStudio) é descartada por completo; só o conteúdo/design é reaproveitado.

origin='company' + visibility='shared' é uma EXCEÇÃO DE MIGRAÇÃO documentada: designs
de usuário nascem sempre private (ver server/designs_service.py > create()); só este
seed nasce shared, de propósito, para validar a aba "Mais Layouts" de ponta a ponta
com a Caetus Systems (segunda empresa do teste).

Rodar com: python server/seed_espaco_de_festa_joa.py (depois de mover os assets para
empresas/espaco_de_festa_joa/memoria/imagens/, ver plano).
"""
import copy
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import designs_service as designs  # noqa: E402

COMPANY_ID = 'espaco_de_festa_joa'
IMG = '../empresas/espaco_de_festa_joa/memoria/imagens'

BASE_TEXTS_STYLE = {'typography': {}, 'background': {}, 'border': {}}

BASE_COMPONENTS = [
    {'id': 'diagonal-band', 'kind': 'diagonalBand', 'visible': False},
    # 'divider-bar' ("Faixa Principal") não tem equivalente no brand-spec.md da Joá —
    # é um motivo "clean/corporativo" da Caetus, que o próprio brand-spec veta. Fica
    # desligado por padrão (mas continua togglável na aba Modelos > Padrão da marca).
    {'id': 'divider-bar', 'kind': 'dividerBar', 'visible': False},
    # footerBarAccent/dottedDiamondPattern: kinds sob medida pra Joá (ver
    # design-system/components-registry.js), fiéis ao brand-spec.md "Postura de
    # Layout" — nunca os genéricos footerBar/watermarkPattern da Caetus.
    {'id': 'footer-bar', 'kind': 'footerBarAccent', 'visible': True},
    {'id': 'watermark-pattern', 'kind': 'dottedDiamondPattern', 'visible': True},
    {'id': 'zigzag-band', 'kind': 'zigzagBand', 'visible': False},
]

BASE_ELEMENTS = {
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
    'zigzag-band': {'x': 0, 'y': 0, 'scale': 1},
}


def build_texts(title, subtitle, selo, category, light_text=False):
    # BrandTheme Joá tem --bg roxo profundo (não claro como Caetus/Editorial/Vibrant) —
    # title/subtitle/selo usam var(--fg)/var(--muted) por padrão na CSS, pensados pra
    # fundo CLARO. Sobre o roxo profundo isso fica pouco legível (era o bug visto no
    # teste). light_text=True troca pra tokens claros direto no texto, sem precisar de
    # uma classe de canvas nova por template.
    primary_style = {'typography': {'colorToken': 'surface'} if light_text else {}, 'background': {}, 'border': {}}
    muted_style = {'typography': {'customColor': 'oklch(85% 0.03 322)'} if light_text else {}, 'background': {}, 'border': {}}
    return [
        {'id': 'title', 'type': 'heading', 'category': 'titulo-principal', 'label': 'Título',
         'value': title, 'style': primary_style},
        {'id': 'subtitle', 'type': 'body', 'category': 'subtitulo', 'label': 'Subtítulo',
         'value': subtitle, 'style': muted_style},
        {'id': 'selo', 'type': 'body', 'category': 'selo', 'label': 'Selo',
         'value': selo, 'style': primary_style},
        {'id': 'cta', 'type': 'body', 'category': 'cta', 'label': 'Chamada (CTA)',
         'value': 'Faça sua reserva!', 'style': primary_style},
        {'id': 'category', 'type': 'chip', 'category': 'tag-categoria', 'label': 'Categoria',
         'value': category,
         'style': {'typography': {'colorToken': 'fg'}, 'background': {'colorToken': 'surface'}, 'border': {'radius': 999}}},
        {'id': 'brandName', 'type': 'body', 'category': 'texto', 'label': 'Nome da Marca',
         'value': 'ESPAÇO DE FESTA JOÁ',
         'style': {'typography': {'colorToken': 'surface', 'fontSize': 16, 'fontWeight': 700}, 'background': {}, 'border': {}}},
    ]


def build_state(template_key, title, subtitle, selo, category, background, band_on, light_text=False):
    components = copy.deepcopy(BASE_COMPONENTS)
    for c in components:
        if c['id'] == 'zigzag-band':
            c['visible'] = band_on
    return {
        'format': '1:1',
        'template': template_key,
        'brandTheme': 'joa',
        'texts': build_texts(title, subtitle, selo, category, light_text),
        'background': background,
        'logo': {'assetId': 'joa-logo', 'src': f'{IMG}/joa-logo.jpg', 'x': 0, 'y': 0, 'scale': 1, 'rotation': 0, 'opacity': 1},
        'elements': copy.deepcopy(BASE_ELEMENTS),
        'components': components,
        'objects': [],
        'layerOrder': [],
    }


PRESETS = [
    (
        'familiar', 'Familiar', ['Ambiente Familiar'],
        # Reference (index.html do protótipo) usa layout 'vibrante' = foto de fundo
        # + texto claro. No motor novo isso é 'cinematic' (canvasClass
        # 'layout-cinematic' já troca --fg/--muted por --surface — ver
        # design-system/components.css). Antes vinha 'minimal', que renderiza texto
        # roxo-escuro sobre a foto e ficava ilegível.
        'cinematic',
        'Aqui, a festa é [em família].',
        'Um espaço pensado para reunir quem você ama, com estrutura de recreação para as crianças.',
        'Ambiente amplo, familiar e pronto para a sua comemoração.',
        'AMBIENTE FAMILIAR',
        # Os "fundos" disponíveis (memoria/imagens/) são, na real, POSTS JÁ PRONTOS
        # (checklist com texto embutido, logo, moldura) — não fotos soltas. Usados a
        # opacidade cheia, o texto embutido colide com title/subtitle/selo deste
        # documento (era exatamente o bug visto no teste). Baixa opacidade + blur
        # (mesmo espírito do defaultState da Caetus: opacity 15/blur 0) os reduz a
        # uma textura de cor atmosférica, sem o texto embutido ficar legível.
        {'preset': 'custom', 'customUrl': f'{IMG}/beneficios-espaço-joa.jpg', 'opacity': 18, 'blur': 4, 'x': 0, 'y': 0, 'scale': 1.15, 'fit': 'cover'},
        True,
        False,  # light_text — 'cinematic' já resolve pela canvasClass, sem hack no state
    ),
    (
        'versatil', 'Versátil', ['Espaço Versátil'],
        'split',
        'Um espaço [amplo e versátil] para qualquer festa.',
        'Do aniversário infantil à comemoração em família — o espaço se adapta ao seu evento.',
        'Estrutura pronta para recreação e para qualquer estilo de festa.',
        'ESPAÇO VERSÁTIL',
        # split reserva um painel inteiro pra essa imagem (mais peso visual que os
        # outros dois layouts), mas ainda é um post pronto com texto/logo embutidos —
        # blur mais forte pra virar textura de fundo em vez de conteúdo duplicado.
        {'preset': 'custom', 'customUrl': f'{IMG}/espaco-amplo-versatil.jpg', 'opacity': 35, 'blur': 6, 'x': 0, 'y': 0, 'scale': 1.1, 'fit': 'cover'},
        False,
        True,  # light_text — mesmo motivo do familiar
    ),
    (
        'liberdade', 'Liberdade de Decoração', ['Liberdade de Decoração'],
        # 'cinematic' (não 'minimal'): mesma skeleton (standard), mas com a classe
        # .layout-cinematic que já existe pra textos sobre fundo escuro/foto (troca
        # --fg/--muted por --surface na CSS — ver design-system/components.css). Sem
        # isso, o título ficava roxo-quase-preto sobre o fundo roxo profundo desta
        # variante ("convite"), quase ilegível.
        'cinematic',
        'Decore do jeito que [você imaginou].',
        'Liberdade total pra personalizar o tema e o estilo da sua festa, sem restrições.',
        'Liberdade de decoração — a festa fica do seu jeito.',
        'LIBERDADE DE DECORAÇÃO',
        {'preset': 'none', 'customUrl': '', 'opacity': 0, 'blur': 0, 'x': 0, 'y': 0, 'scale': 1, 'fit': 'cover'},
        True,
        False,  # light_text — já resolvido pelo canvasClass 'layout-cinematic' (ver template_key acima)
    ),
]


def main():
    for design_id, label, categories, template_key, title, subtitle, selo, category, background, band_on, light_text in PRESETS:
        state = build_state(template_key, title, subtitle, selo, category, background, band_on, light_text)
        doc = designs.seed(
            COMPANY_ID,
            design_id=design_id,
            name=label,
            state=state,
            categories=categories,
            tags=['festa', 'evento'],
            origin='company',
            visibility='shared',
        )
        print(f"Seed criado: {COMPANY_ID}/{doc['id']} ({label})")


if __name__ == '__main__':
    main()
