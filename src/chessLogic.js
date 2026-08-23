import { Chess } from "chess.js";
import { analyzePosition } from "./engine";

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

// Cuánta diferencia de evaluación (en peones) toleramos antes de decir
// "esta jugada también es razonable, no hace falta que sea LA única".
const ACCEPTABLE_MARGIN = 0.3;

export async function verifyWithEngine({ fen, correctMoveSan }, depth = 14) {
  const chess = new Chess(fen);
  const sideToMove = chess.turn(); // 'w' o 'b'
  const legal = chess.move(correctMoveSan);
  if (!legal) {
    return { valid: false, reason: `"${correctMoveSan}" no es legal en esta posición` };
  }
  const correctUci = legal.from + legal.to + (legal.promotion || "");
  const fenAfterCorrect = chess.fen();

  // Evaluación de la posición jugando la mejor jugada del motor
  const { bestMove, evaluation: evalBest } = await analyzePosition(fen, depth);

  if (bestMove === correctUci) {
    return { valid: true, engineBest: bestMove, evaluation: evalBest };
  }

  // Evaluación de la posición después de jugar la jugada "correcta" marcada.
  // Esa búsqueda queda desde el punto de vista del OTRO bando (que ahora
  // mueve), así que invertimos el signo para comparar todo desde la misma
  // perspectiva (el bando que estaba por mover originalmente).
  const { evaluation: evalRaw } = await analyzePosition(
    fenAfterCorrect,
    Math.max(depth - 4, 8)
  );
  const evalAfterCorrect = evalRaw === null ? null : -evalRaw;

  const diff =
    evalBest !== null && evalAfterCorrect !== null
      ? Math.abs(evalBest - evalAfterCorrect)
      : null;

  if (diff !== null && diff <= ACCEPTABLE_MARGIN) {
    return {
      valid: true,
      engineBest: bestMove,
      evaluation: evalBest,
      evalAfterCorrect,
      note: `Diferencia de solo ${diff.toFixed(2)} peones — ambas jugadas son razonables.`,
    };
  }

  return {
    valid: false,
    engineBest: bestMove,
    evaluation: evalBest,
    evalAfterCorrect,
    diff,
    reason: `El motor prefiere ${bestMove} en vez de ${correctUci}`,
  };
}
