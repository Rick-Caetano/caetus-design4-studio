#!/usr/bin/env python3
"""Sobe um servidor estático local para o Caetus Studio e abre o navegador.

Necessário porque o editor usa ES modules, que o navegador recusa carregar
via file://. Ver README.md > "Rodando localmente".

Serve a partir da RAIZ DO PROJETO (pai de caetus-studio/), não de
caetus-studio/ isolado — é o que permite ao Studio ler assets/stock/ (a
Asset Library produzida pelas skills), que mora fora de caetus-studio/. Um
servidor rodando só dentro de caetus-studio/ nunca conseguiria servir esses
arquivos: SimpleHTTPRequestHandler recusa qualquer ".." que escape do seu
próprio DIRECTORY.
"""
import http.server
import socketserver
import sys
import threading
import urllib.request
import webbrowser
import os

PORT = 8000
MAX_PORT_ATTEMPTS = 20
STUDIO_DIR = os.path.dirname(os.path.abspath(__file__))
DIRECTORY = os.path.dirname(STUDIO_DIR)
STUDIO_FOLDER_NAME = os.path.basename(STUDIO_DIR)

sys.path.insert(0, os.path.join(STUDIO_DIR, 'server'))
from api_server import ApiRoutesMixin, start_api_server  # noqa: E402


class Handler(ApiRoutesMixin, http.server.SimpleHTTPRequestHandler):
    """Serve os arquivos estáticos E a API de Design Documents na MESMA porta
    (dinâmica) — essencial: um fetch('/api/...') feito pela página é sempre
    same-origin, então precisa cair aqui, não só no servidor dedicado de porta fixa
    (server/api_server.py, que só serve de alvo pro proxy do Vite). Sem isso, abrir
    o Studio via `python iniciar.py` (o jeito documentado) nunca conseguia carregar
    nenhum Design Document — o fetch relativo caía nesta porta e virava 404 de
    arquivo estático, já que ninguém aqui sabia responder /api/*."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        pass

    def do_GET(self):
        if self.is_api_path():
            return self.handle_api_get()
        return super().do_GET()

    def do_POST(self):
        if self.is_api_path():
            return self.handle_api_post()
        self.send_error(405)

    def do_PUT(self):
        if self.is_api_path():
            return self.handle_api_put()
        self.send_error(405)

    def do_DELETE(self):
        if self.is_api_path():
            return self.handle_api_delete()
        self.send_error(405)

    def do_OPTIONS(self):
        if self.is_api_path():
            return self.handle_api_options()
        self.send_error(405)


def _responds(url, timeout=1.5):
    """True só se uma requisição de verdade for respondida. bind() sozinho não basta
    para saber se uma porta está realmente livre: em máquinas com WSL2/Docker Desktop
    ligados, o Windows costuma reservar portas comuns (8000 entre elas) para o relay
    de rede da VM (wslrelay.exe) em 127.0.0.1/::1 sem que isso apareça como erro no
    bind() do nosso processo — a porta parece livre, o servidor "sobe" normalmente,
    mas toda requisição do navegador cai no vazio (a página nunca abre). Testando uma
    requisição real antes de declarar a porta utilizável, detectamos esse caso e
    pulamos para a próxima porta em vez de deixar o usuário preso numa porta morta.
    """
    try:
        with urllib.request.urlopen(url, timeout=timeout) as resp:
            return resp.status == 200
    except Exception:
        return False


def main():
    port = PORT
    httpd = None
    thread = None

    try:
        api_httpd, api_port = start_api_server()
        print(f"API de Design Documents rodando em http://localhost:{api_port} (dev-only)")
    except OSError:
        api_httpd = None
        print("Aviso: não consegui subir a API de Design Documents (porta 8321 já em uso).")
        print("Salvar/carregar layouts por empresa não vai funcionar até liberar essa porta.")

    for _ in range(MAX_PORT_ATTEMPTS):
        try:
            httpd = socketserver.TCPServer(("", port), Handler)
        except OSError:
            port += 1
            continue

        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()

        url = f"http://localhost:{port}/{STUDIO_FOLDER_NAME}/index.html"
        if _responds(url):
            break

        httpd.shutdown()
        httpd.server_close()
        httpd = None
        port += 1
    else:
        print(f"Não encontrei nenhuma porta livre de verdade entre {PORT} e {port}.")
        print("Feche outros servidores locais (ou o Docker Desktop/WSL, se estiverem rodando) e tente de novo.")
        return

    threading.Timer(0.3, lambda: webbrowser.open(url)).start()
    print(f"Caetus Studio rodando em {url}")
    print("Pressione Ctrl+C para encerrar.")
    try:
        thread.join()
    except KeyboardInterrupt:
        pass
    finally:
        print("\nEncerrando Caetus Studio...")
        if api_httpd:
            api_httpd.shutdown()
        httpd.shutdown()
        httpd.server_close()


if __name__ == "__main__":
    main()
