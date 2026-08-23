import React, { useState, useMemo, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { verifyWithEngine } from "./chessLogic";

// Partida real (Botvinnik - Vidmar, Nottingham 1936), un ejemplo clásico
// de IQP citado en la literatura de ajedrez. En vez de escribir un FEN a
// mano, reproducimos las jugadas reales con chess.js: si alguna jugada
// estuviera mal tipeada, chess.js tira un error acá mismo (en vez de
// generar una posición rota en silencio, que es lo que nos pasó antes).
const GAME_MOVES = [
  "c4", "e6", "Nf3", "d5", "d4", "Nf6", "Nc3", "Be7", "Bg5", "O-O",
  "e3", "Nbd7", "Bd3", "c5", "O-O", "cxd4", "exd4", "dxc4", "Bxc4", "Nb6",
];

function buildPosition() {
  const chess = new Chess();
  for (const san of GAME_MOVES) {
    const move = chess.move(san);
    if (!move) {
      throw new Error(`Jugada ilegal al reproducir la partida: "${san}"`);
    }
  }
  return chess.fen();
}

const EXERCISE = {
  fen: buildPosition(),
  prompt:
    "Posición real (Botvinnik–Vidmar, 1936) después de 10 jugadas. Blancas tienen IQP en d4. ¿Qué jugaron las blancas acá?",
  source: "Botvinnik vs. Vidmar, Nottingham 1936",
};

export default function App() {
  const [engineResult, setEngineResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      // No tenemos una "jugada correcta" preescrita por mí — le preguntamos
      // directamente al motor qué recomienda en esta posición real, y esa
      // es la respuesta de referencia.
      const chess = new Chess(EXERCISE.fen);
      const legalMoves = chess.moves();
      // Usamos la primera jugada legal como placeholder solo para poder
      // llamar a verifyWithEngine y obtener bestMove/evaluation; lo que
      // de verdad importa es el resultado, no si ese placeholder "gana".
      verifyWithEngine({ fen: EXERCISE.fen, correctMoveSan: legalMoves[0] })
        .then((result) => setEngineResult(result))
        .catch((err) => setError(err.message));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  return (
    <div style={{ maxWidth: 480, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1 style={{ textAlign: "center" }}>Chess Elo App</h1>
      <h3 style={{ textAlign: "center", color: "#555" }}>IQP · Posición real</h3>

      {error && (
        <div style={{ background: "#5a2222", color: "#fff", padding: 10, marginBottom: 10, borderRadius: 6 }}>
          ⚠ {error}
        </div>
      )}

      <Chessboard position={EXERCISE.fen} arePiecesDraggable={false} />

      <p style={{ marginTop: 16 }}>{EXERCISE.prompt}</p>
      <p style={{ fontSize: 12, color: "#888" }}>Fuente: {EXERCISE.source}</p>

      {engineResult && (
        <div style={{ background: "#eef", padding: 10, borderRadius: 6, fontSize: 13, marginTop: 12 }}>
          <div>Jugada que prefiere el motor acá: <strong>{engineResult.engineBest}</strong></div>
          {engineResult.evaluation !== null && (
            <div>Evaluación: {engineResult.evaluation > 0 ? "+" : ""}{engineResult.evaluation}</div>
          )}
        </div>
      )}
    </div>
  );
}
