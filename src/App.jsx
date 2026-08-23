import React from "react";
import { Chessboard } from "react-chessboard";

const IQP_POSITION = "2r3k1/pp3ppp/5n2/3PN3/8/8/PP3PPP/2R3K1 w - - 0 1";

export default function App() {
  return (
    <div style={{ maxWidth: 480, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1 style={{ textAlign: "center" }}>Chess Elo App</h1>
      <p style={{ textAlign: "center", color: "#555" }}>
        Blancas con IQP y piezas activas. ¿Cuál es el plan?
      </p>
      <Chessboard position={IQP_POSITION} arePiecesDraggable={false} />
    </div>
  );
}
