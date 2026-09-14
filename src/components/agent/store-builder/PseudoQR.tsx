import React from "react";

interface PseudoQRProps {
  seed?: string;
  size?: number;
}

export const PseudoQR: React.FC<PseudoQRProps> = ({ seed = "store", size = 132 }) => {
  // Deterministic grid of squares that reads as a QR (no external libs)
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  const N = 21;
  const cells: boolean[] = [];
  const rng = () => {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    return hash / 0x7fffffff;
  };

  for (let i = 0; i < N * N; i++) {
    cells.push(rng() > 0.5);
  }

  const finder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= N - 7) || (r >= N - 7 && c < 7);

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "grid",
        gridTemplateColumns: `repeat(${N}, 1fr)`,
        background: "#fff",
        padding: 6,
        borderRadius: 10,
        border: "1px solid hsl(var(--border))",
      }}
    >
      {cells.map((on, i) => {
        const r = Math.floor(i / N);
        const c = i % N;
        const f = finder(r, c);
        const ring =
          f &&
          ((r % 6 === 0 || c % 6 === 0) ||
            (r > 1 && r < 5 && c > 1 && c < 5 && (r < N - 7 ? c < 5 : true)));
        const fill =
          f
            ? (r === 0 || c === 0 || r === 6 || c === 6 ||
                (r >= 2 && r <= 4 && c >= 2 && c <= 4) ||
                c === N - 7 ||
                r === N - 7)
            : on;
        return (
          <div
            key={i}
            style={{
              background: fill ? "hsl(var(--foreground))" : "transparent",
            }}
          />
        );
      })}
    </div>
  );
};
