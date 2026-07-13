// Event bus mínimo — desacopla o Editor (sidebar) do Canvas (#post-canvas).
// O editor emite intents ("format:set"); o canvas escuta e aplica.
// Sem dependências, sem framework: um Map<string, Set<fn>>.

const listeners = new Map();

function on(event, handler) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(handler);
  return () => off(event, handler);
}

function off(event, handler) {
  const set = listeners.get(event);
  if (set) set.delete(handler);
}

// Cada handler roda isolado: se um lançar uma exceção (ex.: um painel tentando ler um
// asset que ainda não carregou), os handlers seguintes do mesmo evento — registrados
// depois dele, como texts-panel.js/marca-panel.js/fundo-panel.js reagindo a
// 'state:changed' — ainda assim rodam. Sem isso, um erro num único listener trava
// silenciosamente todo o resto da fila só porque o Set os itera na mesma ordem de
// registro; o sintoma percebido é "o estado mudou mas a sidebar não atualizou".
function emit(event, payload) {
  const set = listeners.get(event);
  if (!set) return;
  for (const handler of set) {
    try {
      handler(payload);
    } catch (err) {
      console.error(`[bus] listener de "${event}" lançou um erro:`, err);
    }
  }
}

export default { on, off, emit };
