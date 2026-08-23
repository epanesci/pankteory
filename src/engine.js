// Motor de ajedrez (Stockfish) corriendo en el navegador vía Web Worker.
// Se carga desde un CDN como texto y se instancia como Blob para evitar
// problemas de "cross-origin worker" que algunos navegadores bloquean.

const STOCKFISH_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js";

let workerPromise = null;

function getWorker() {
  if (!workerPromise) {
    workerPromise = fetch(STOCKFISH_URL)
      .then((res) => res.text())
      .then((code) => {
        const blob = new Blob([code], { type: "application/javascript" });
        return new Worker(URL.createObjectURL(blob));
      });
  }
  return workerPromise;
}

// Analiza una posición (FEN) hasta cierta profundidad y devuelve la
// mejor jugada del motor (en notación UCI, ej. "e2e4") y la evaluación
// en peones (positivo = mejor para blancas).
export async function analyzePosition(fen, depth = 14) {
  const worker = await getWorker();

  return new Promise((resolve) => {
    let lastEval = null;

    function onMessage(e) {
      const line = typeof e.data === "string" ? e.data : e.data?.data;
      if (!line) return;

      if (line.startsWith("info") && line.includes("score cp")) {
        const match = line.match(/score cp (-?\d+)/);
        if (match) lastEval = parseInt(match[1], 10) / 100;
      }

      if (line.startsWith("bestmove")) {
        const bestMove = line.split(" ")[1];
        worker.removeEventListener("message", onMessage);
        resolve({ bestMove, evaluation: lastEval });
      }
    }

    worker.addEventListener("message", onMessage);
    worker.postMessage("uci");
    worker.postMessage(`position fen ${fen}`);
    worker.postMessage(`go depth ${depth}`);
  });
}
