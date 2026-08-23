import { Chess } from "chess.js";

// Valida una posición/ejercicio ANTES de que llegue a la pantalla:
// - material igual entre ambos bandos
// - ninguna pieza colgada (atacada y sin defensa suficiente)
// - la jugada marcada como "correcta" es legal en esa posición

const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

export function materialBalance(fen) {
  const chess = new Chess(fen);
  const board = chess.board();
  let white = 0;
  let black = 0;
  for (const row of board) {
    for (const sq of row) {
      if (!sq) continue;
      const val = PIECE_VALUES[sq.type];
      if (sq.color === "w") white += val;
      else black += val;
    }
  }
  return { white, black, equal: white === black };
}

export function hangingPieces(fen) {
  const chess = new Chess(fen);
  const turn = chess.turn();
  const opponent = turn === "w" ? "b" : "w";
  const board = chess.board();
  const hanging = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const sq = board[r][c];
      if (!sq || sq.color !== opponent) continue;
      const square = "abcdefgh"[c] + (8 - r);
      const attackers = chess.attackers(square, turn);
      const defenders = chess.attackers(square, opponent);
      if (attackers.length > defenders.length) {
        hanging.push({ square, piece: sq.type });
      }
    }
  }
  return hanging;
}

export function validateExercise({ fen, correctMoveSan }) {
  const chess = new Chess(fen);
  const errors = [];

  const { equal, white, black } = materialBalance(fen);
  if (!equal) {
    errors.push(`Material desigual: blancas=${white}, negras=${black}`);
  }

  const hanging = hangingPieces(fen);
  if (hanging.length > 0) {
    errors.push(
      `Piezas colgadas detectadas: ${hanging.map((h) => h.square).join(", ")}`
    );
  }

  if (correctMoveSan) {
    const move = chess.move(correctMoveSan);
    if (!move) {
      errors.push(`La jugada "${correctMoveSan}" no es legal en esta posición`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// Pendiente (necesita Stockfish): confirmar que correctMoveSan es
// objetivamente la mejor jugada del motor, no solo legal.
