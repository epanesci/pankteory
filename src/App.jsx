import React, { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ maxWidth: 480, margin: "40px auto", fontFamily: "sans-serif", textAlign: "center" }}>
      <h1>Chess Elo App</h1>
      <p>Base funcionando</p>
      <button onClick={() => setCount(count + 1)}>
        Clicks: {count}
      </button>
    </div>
  );
}
