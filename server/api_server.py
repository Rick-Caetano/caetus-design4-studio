"""Roteamento HTTP da API de Design Documents — UMA implementação só
(ApiRoutesMixin), usada em DOIS lugares:

  1. iniciar.py: mixada direto no Handler do servidor estático (porta dinâmica),
     pra que `fetch('/api/...')` funcione same-origin quando o app é aberto por
     `python iniciar.py` — sem isso, o fetch relativo cai na porta estática errada
     e nunca chega no designs_service (bug: "layouts não carregam, nem os próprios").
  2. ApiHandler abaixo: servidor dedicado numa porta FIXA (8321, dev-only), alvo
     estável do proxy do Vite (vite.config.ts) — usado só quando o app é aberto
     pelo Vite em vez de iniciar.py.

Em ambos os casos a lógica de roteamento/(de)serialização é a mesma classe — só
muda o transporte por trás. Nenhuma lógica de persistência mora aqui, só HTTP;
quem sabe ler/escrever é sempre designs_service.py.
"""
import http.server
import json
import re
import socketserver
from urllib.parse import urlparse, parse_qs

import designs_service as designs

API_PORT = 8321
API_PREFIX = '/api'

ROUTE_COMPANY_DESIGNS = re.compile(r'^/api/companies/([^/]+)/designs/?$')
ROUTE_COMPANY_DESIGN = re.compile(r'^/api/companies/([^/]+)/designs/([^/]+)/?$')
ROUTE_DISCOVER = re.compile(r'^/api/designs/discover/?$')


class ApiRoutesMixin:
    """Espera um host BaseHTTPRequestHandler (self.path/.headers/.rfile/.wfile/
    .send_response/.send_header/.end_headers/.wfile) — mesma interface que
    SimpleHTTPRequestHandler já tem, por isso funciona sem adaptação nos dois usos
    acima."""

    def is_api_path(self):
        return urlparse(self.path).path.startswith(API_PREFIX + '/')

    def _send_json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode('utf-8') if payload is not None else b''
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        if body:
            self.wfile.write(body)

    def _read_json_body(self):
        length = int(self.headers.get('Content-Length', 0) or 0)
        if not length:
            return {}
        return json.loads(self.rfile.read(length).decode('utf-8'))

    def handle_api_options(self):
        self._send_json(204, None)

    def handle_api_get(self):
        parsed = urlparse(self.path)

        match = ROUTE_COMPANY_DESIGNS.match(parsed.path)
        if match:
            return self._send_json(200, designs.list_own(match.group(1)))

        match = ROUTE_COMPANY_DESIGN.match(parsed.path)
        if match:
            doc = designs.get(match.group(1), match.group(2))
            if doc is None:
                return self._send_json(404, {'error': 'not_found'})
            return self._send_json(200, doc)

        if ROUTE_DISCOVER.match(parsed.path):
            qs = parse_qs(parsed.query)
            exclude = (qs.get('excludeCompany') or [None])[0]
            return self._send_json(200, designs.discover(exclude))

        self._send_json(404, {'error': 'not_found'})

    def handle_api_post(self):
        parsed = urlparse(self.path)
        match = ROUTE_COMPANY_DESIGNS.match(parsed.path)
        if match:
            payload = self._read_json_body()
            doc = designs.create(match.group(1), payload)
            return self._send_json(201, doc)
        self._send_json(404, {'error': 'not_found'})

    def handle_api_put(self):
        parsed = urlparse(self.path)
        match = ROUTE_COMPANY_DESIGN.match(parsed.path)
        if match:
            payload = self._read_json_body()
            doc = designs.update(match.group(1), match.group(2), payload)
            if doc is None:
                return self._send_json(404, {'error': 'not_found'})
            return self._send_json(200, doc)
        self._send_json(404, {'error': 'not_found'})

    def handle_api_delete(self):
        parsed = urlparse(self.path)
        match = ROUTE_COMPANY_DESIGN.match(parsed.path)
        if match:
            ok = designs.delete(match.group(1), match.group(2))
            return self._send_json(200 if ok else 404, {'deleted': ok})
        self._send_json(404, {'error': 'not_found'})


class ApiHandler(ApiRoutesMixin, http.server.BaseHTTPRequestHandler):
    """Servidor dedicado, porta fixa — só existe pra dar ao proxy do Vite um alvo
    estável (ver vite.config.ts). Quem abre via iniciar.py usa a mesma lógica
    (ApiRoutesMixin) direto na porta estática, sem precisar deste servidor."""

    def log_message(self, format, *args):
        pass

    def do_OPTIONS(self):
        self.handle_api_options()

    def do_GET(self):
        self.handle_api_get()

    def do_POST(self):
        self.handle_api_post()

    def do_PUT(self):
        self.handle_api_put()

    def do_DELETE(self):
        self.handle_api_delete()


def start_api_server():
    """Sobe o servidor dedicado (porta fixa) numa thread daemon — usado só como
    alvo do proxy do Vite. Levanta OSError se a porta já estiver em uso."""
    import threading

    httpd = socketserver.TCPServer(('', API_PORT), ApiHandler)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    return httpd, API_PORT
