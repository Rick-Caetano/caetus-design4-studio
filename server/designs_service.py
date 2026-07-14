"""Toda a lógica de persistência dos Design Documents multiempresa — módulo puro,
sem depender de nenhum framework web. iniciar.py (servidor Python, canônico) chama
essas funções diretamente; o proxy do Vite dev server encaminha para o mesmo
processo Python em vez de reimplementar qualquer coisa aqui (ver vite.config.ts).

Um Design Document é o envelope descrito em design-system/design-document.js:
{ documentVersion, id, companyId, metadata: {...}, state: {...} }.

Cada empresa dona seus próprios arquivos em
empresas/<companyId>/memoria/caetus-studio/designs/<id>.json — um arquivo por
design, seguindo a mesma convenção de memoria/posts/ e memoria/apresentacoes/<tema>/
(ver .caetus/rules/slides.md). Nada aqui separa "designs privados" de "designs
compartilhados" no armazenamento — é um único arquivo com metadata.visibility,
filtrado na leitura.
"""
import json
import os
import uuid
from datetime import datetime, timezone

SERVER_DIR = os.path.dirname(os.path.abspath(__file__))
STUDIO_DIR = os.path.dirname(SERVER_DIR)
ROOT_DIR = os.path.dirname(STUDIO_DIR)
EMPRESAS_DIR = os.path.join(ROOT_DIR, 'empresas')


def _designs_dir(company_id, create=False):
    path = os.path.join(EMPRESAS_DIR, company_id, 'memoria', 'caetus-studio', 'designs')
    if create:
        os.makedirs(path, exist_ok=True)
    return path


def _now():
    return datetime.now(timezone.utc).isoformat()


def _read_doc(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def _write_doc(path, doc):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(doc, f, ensure_ascii=False, indent=2)


def list_own(company_id):
    """Todos os designs de UMA empresa, qualquer visibility — é a dona, vê tudo."""
    directory = _designs_dir(company_id)
    if not os.path.isdir(directory):
        return []
    docs = []
    for name in os.listdir(directory):
        if not name.endswith('.json'):
            continue
        try:
            docs.append(_read_doc(os.path.join(directory, name)))
        except (json.JSONDecodeError, OSError):
            continue
    docs.sort(key=lambda d: d.get('metadata', {}).get('updatedAt', ''), reverse=True)
    return docs


def get(company_id, design_id):
    path = os.path.join(_designs_dir(company_id), f'{design_id}.json')
    if not os.path.isfile(path):
        return None
    return _read_doc(path)


def create(company_id, payload):
    """Cria um Design Document. Por regra, nasce sempre origin=company +
    visibility=private — quem quiser outra combinação (seed/migração) escreve o
    arquivo diretamente via script, não por esta rota."""
    design_id = payload.get('id') or f'design_{uuid.uuid4().hex[:12]}'
    now = _now()
    metadata = payload.get('metadata', {})
    doc = {
        'documentVersion': 1,
        'id': design_id,
        'companyId': company_id,
        'metadata': {
            'name': metadata.get('name', 'Sem título'),
            'categories': metadata.get('categories', []),
            'tags': metadata.get('tags', []),
            'origin': 'company',
            'visibility': 'private',
            'version': 1,
            'createdBy': None,
            'createdAt': now,
            'updatedAt': now,
            'preview': {'thumbnail': metadata.get('preview', {}).get('thumbnail'), 'cover': None},
        },
        'state': payload.get('state', {}),
    }
    _write_doc(os.path.join(_designs_dir(company_id, create=True), f'{design_id}.json'), doc)
    return doc


def update(company_id, design_id, payload):
    existing = get(company_id, design_id)
    if existing is None:
        return None
    if 'state' in payload:
        existing['state'] = payload['state']
    metadata_patch = payload.get('metadata', {})
    for key in ('name', 'categories', 'tags'):
        if key in metadata_patch:
            existing['metadata'][key] = metadata_patch[key]
    if 'preview' in metadata_patch:
        existing['metadata']['preview'].update(metadata_patch['preview'])
    existing['metadata']['version'] = existing['metadata'].get('version', 1) + 1
    existing['metadata']['updatedAt'] = _now()
    _write_doc(os.path.join(_designs_dir(company_id), f'{design_id}.json'), existing)
    return existing


def delete(company_id, design_id):
    path = os.path.join(_designs_dir(company_id), f'{design_id}.json')
    if not os.path.isfile(path):
        return False
    os.remove(path)
    return True


def seed(company_id, design_id, name, state, categories=None, tags=None, origin='company', visibility='private'):
    """Só para scripts de seed/migração (ver server/seed_*.py) — grava um Design
    Document com origin/visibility explícitos, algo que a rota HTTP normal
    (create()) nunca permite (lá é sempre origin=company + visibility=private).
    Toda exceção a essa regra deve vir por aqui, nunca pela API pública."""
    now = _now()
    doc = {
        'documentVersion': 1,
        'id': design_id,
        'companyId': company_id,
        'metadata': {
            'name': name,
            'categories': categories or [],
            'tags': tags or [],
            'origin': origin,
            'visibility': visibility,
            'version': 1,
            'createdBy': None,
            'createdAt': now,
            'updatedAt': now,
            'preview': {'thumbnail': None, 'cover': None},
        },
        'state': state,
    }
    _write_doc(os.path.join(_designs_dir(company_id, create=True), f'{design_id}.json'), doc)
    return doc


def discover(exclude_company_id=None):
    """Designs de OUTRAS empresas com metadata.visibility == 'shared' — é a única
    função que varre empresas/*/ inteiro. Nenhum client faz esse scan sozinho (ver
    app/data/designs-api.js): só fala com esta rota."""
    if not os.path.isdir(EMPRESAS_DIR):
        return []
    results = []
    for company_id in os.listdir(EMPRESAS_DIR):
        if company_id == exclude_company_id:
            continue
        directory = _designs_dir(company_id)
        if not os.path.isdir(directory):
            continue
        for name in os.listdir(directory):
            if not name.endswith('.json'):
                continue
            try:
                doc = _read_doc(os.path.join(directory, name))
            except (json.JSONDecodeError, OSError):
                continue
            if doc.get('metadata', {}).get('visibility') == 'shared':
                results.append(doc)
    results.sort(key=lambda d: d.get('metadata', {}).get('updatedAt', ''), reverse=True)
    return results
