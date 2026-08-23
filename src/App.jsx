import React, { useState, useMemo, useEffect } from "react";
import { Chessboard } from "react-chessboard";
import { validateExercise, verifyWithEngine } from "./chessLogic";

const EXERCISE = {
  fen: "2rr2k1/pp3ppp/5n2/3PN3/8/8/PP4PP/2RR2K1 w - - 0 1",
  correctMoveSan: "Rc2",
  prompt: "Blancas con IQP y piezas activas, material igual. ¿Cuál es el plan?",
  options: [
    {
      text: "d5-d6, avanzar el peón cuanto antes",
      correct: false,
      feedback: "Entrega la fuerza del peón sin necesidad — mientras no esté amenazado, no hay que apurarlo.",
    },
    {
      text: "Doblar torres en la columna abierta y presionar con las piezas",
      correct: true,
      feedback: "Correcto. Mientras el peón no esté amenazado, usa el tiempo para aumentar la presión.",
    },
    {
      text: "Retirar una pieza a defender el peón preventivamente",
      correct: false,
      feedback: "Pasivo — no hay amenaza real todavía, defender antes de tiempo cede la iniciativa.",
    },
  ],
};

export default function App() {
  const [answered, setAnswered] = useState(null);
  const [engineResult, setEngineResult] = useState(null); // null = cargando

  const validation = useMemo(() => validateExercise(EXERCISE), []);

  useEffect(() => {
    if (!validation.valid) return;
    let cancelled = false;
    verifyWithEngine(EXERCISE)
      .then((result) => {
        if (!cancelled) setEngineResult(result);
      })
      .catch((err) => {
        if (!cancelled) setEngineResult({ valid: false, reason: "Error cargando el motor: " + err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [validation.valid]);

  return (
    <div style={{ maxWidth: 480, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1 style={{ textAlign: "center" }}>Chess Elo App</h1>
      <h3 style={{ textAlign: "center", color: "#555" }}>IQP · Ejercicio 1</h3>

      {!validation.valid && (
        <div style={{ background: "#5a2222", color: "#fff", padding: 10, marginBottom: 10, borderRadius: 6 }}>
          <strong>⚠ Ejercicio no publicable:</strong>
          <ul>
            {validation.errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {validation.valid && engineResult === null && (
        <p style={{ fontSize: 13, color: "#888", textAlign: "center" }}>Verificando con el motor…</p>
      )}

      {validation.valid && engineResult && !engineResult.valid && (
        <div style={{ background: "#5a4a1e", color: "#fff", padding: 10, marginBottom: 10, borderRadius: 6, fontSize: 13, lineHeight: 1.5 }}>
          <strong>⚠ El motor no coincide:</strong>
          <div>Jugada marcada como correcta: {EXERCISE.correctMoveSan}</div>
          {engineResult.engineBest && <div>Jugada preferida por el motor: {engineResult.engineBest}</div>}
          {engineResult.evaluation !== undefined && engineResult.evaluation !== null && (
            <div>Evaluación tras la jugada del motor: {engineResult.evaluation > 0 ? "+" : ""}{engineResult.evaluation}</div>
          )}
          {engineResult.evalAfterCorrect !== undefined && engineResult.evalAfterCorrect !== null && (
            <div>Evaluación tras {EXERCISE.correctMoveSan}: {engineResult.evalAfterCorrect > 0 ? "+" : ""}{engineResult.evalAfterCorrect}</div>
          )}
          {engineResult.reason && !engineResult.engineBest && <div>{engineResult.reason}</div>}
        </div>
      )}

      {validation.valid && engineResult && engineResult.valid && (
        <p style={{ fontSize: 12, color: "#5a9a5a", textAlign: "center" }}>✓ Verificado por el motor</p>
      )}

      <Chessboard position={EXERCISE.fen} arePiecesDraggable={false} />

      <p style={{ marginTop: 16 }}>{EXERCISE.prompt}</p>

      <div style={{ display: "grid", gap: 8 }}>
        {EXERCISE.options.map((opt, i) => {
          const chosen = answered === i;
          const showResult = answered !== null;
          let bg = "#fff";
          let border = "#ccc";
          if (showResult && opt.correct) {
            bg = "#e6f4ea";
            border = "#5a9a5a";
          } else if (showResult && chosen) {
            bg = "#fbeaea";
            border = "#c15a5a";
          }
          return (
            <div key={i}>
              <button
                onClick={() => setAnswered(i)}
                disabled={answered !== null}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: `1px solid ${border}`,
                  background: bg,
                  cursor: answered === null ? "pointer" : "default",
                }}
              >
                {opt.text}
              </button>
              {showResult && chosen && (
                <p style={{ fontSize: 13.5, color: "#666", margin: "6px 4px 0" }}>
                  {opt.feedback}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
