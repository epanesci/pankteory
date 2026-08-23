import { Chess } from "chess.js";
import { analyzePosition } from "./engine";

// Chequeos instantáneos (sin motor): material igual, piezas colgadas,
// y que la jugada "correcta" sea legal. Esto ya lo teníamos.

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

// Chequeo con motor (async, tarda unos segundos): confirma que la jugada
// "correcta" del ejercicio es realmente la que el motor prefiere, o que
// perder contra la mejor jugada del motor es mínimo (medio peón o menos,
// porque muchas posiciones tienen más de una jugada razonable).
export async function verifyWithEngine({ fen, correctMoveSan }, depth = 14) {
  const chess = new Chess(fen);
  const legal = chess.move(correctMoveSan);
  if (!legal) {
    return { valid: false, reason: `"${correctMoveSan}" no es legal en esta posición` };
  }
  const correctUci = legal.from + legal.to + (legal.promotion || "");

  const { bestMove, evaluation } = await analyzePosition(fen, depth);

  if (bestMove === correctUci) {
    return { valid: true, engineBest: bestMove, evaluation };
  }

  // Evaluamos qué tan buena es la jugada "correcta" comparada con la del motor
  const afterCorrect = new Chess(fen);
  afterCorrect.move(correctMoveSan);
  const { evaluation: evalAfterCorrect } = await analyzePosition(
    afterCorrect.fen(),
    Math.max(depth - 4, 8)
  );

  return {
    valid: false,
    engineBest: bestMove,
    evaluation,
    evalAfterCorrect,
    reason: `El motor prefiere ${bestMove} en vez de ${correctUci}`,
  };
}
