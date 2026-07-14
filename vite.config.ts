import { defineConfig } from "vite";

// Static site: caetus-studio is a plain HTML/CSS/JS app served as-is by Vite.
export default defineConfig({
  server: {
    host: true,
    port: 8080,
    strictPort: true,
    proxy: {
      // A API de Design Documents tem UMA implementação só: server/designs_service.py,
      // servida por server/api_server.py (rodando via `python iniciar.py`, porta fixa
      // 8321). O Vite nunca reimplementa essa lógica — só encaminha. Se estiver usando
      // o dev server do Vite, `python iniciar.py` ainda precisa estar rodando (é ele
      // quem sobe a API), mesmo que você não abra a página pela porta dele.
      "/api": "http://localhost:8321",
    },
  },
  preview: {
    host: true,
    port: 8080,
    strictPort: true,
  },
});
