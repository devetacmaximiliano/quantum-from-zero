import type { Gate } from "./types";
export type Complex = { re: number; im: number };
const add = (a: Complex, b: Complex): Complex => ({
  re: a.re + b.re,
  im: a.im + b.im,
});
const mul = (a: Complex, b: Complex): Complex => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re,
});
const c = (re: number, im = 0): Complex => ({ re, im });
export const norm = (a: Complex) => a.re * a.re + a.im * a.im;
/** Exact, ideal browser preview. Runs are separately sent to FastAPI/Qiskit. */
export function simulate(qubits: number, gates: Gate[]): Complex[] {
  const state = Array.from({ length: 2 ** qubits }, (_, i) =>
    c(i === 0 ? 1 : 0),
  );
  for (const gate of gates) {
    if (gate.type === "M") continue;
    if (gate.type === "CX") {
      for (let i = 0; i < state.length; i++)
        if (i & (1 << gate.control!) && !(i & (1 << gate.target))) {
          const j = i | (1 << gate.target);
          [state[i], state[j]] = [state[j], state[i]];
        }
      continue;
    }
    const t = (gate.angle ?? 0) / 2,
      cs = Math.cos(t),
      sn = Math.sin(t),
      h = 1 / Math.sqrt(2);
    const matrices: Record<string, Complex[]> = {
      H: [c(h), c(h), c(h), c(-h)],
      X: [c(0), c(1), c(1), c(0)],
      RX: [c(cs), c(0, -sn), c(0, -sn), c(cs)],
      RY: [c(cs), c(-sn), c(sn), c(cs)],
      RZ: [c(cs, -sn), c(0), c(0), c(cs, sn)],
    };
    const m = matrices[gate.type];
    for (let i = 0; i < state.length; i++)
      if (!(i & (1 << gate.target))) {
        const j = i | (1 << gate.target),
          a = state[i],
          b = state[j];
        state[i] = add(mul(m[0], a), mul(m[1], b));
        state[j] = add(mul(m[2], a), mul(m[3], b));
      }
  }
  return state;
}
export function probabilities(
  qubits: number,
  gates: Gate[],
): Record<string, number> {
  return Object.fromEntries(
    simulate(qubits, gates).map((a, i) => [
      i.toString(2).padStart(qubits, "0"),
      norm(a),
    ]),
  );
}
export function generateCode(qubits: number, gates: Gate[]) {
  return [
    "from qiskit import QuantumCircuit",
    "",
    `qc = QuantumCircuit(${qubits}, ${qubits})`,
    ...gates
      .filter((g) => g.type !== "M")
      .map(
        (g) =>
          `qc.${g.type.toLowerCase()}(${g.type === "CX" ? `${g.control}, ` : g.type.startsWith("R") ? `${(g.angle ?? 0).toFixed(4)}, ` : ""}${g.target})`,
      ),
    "qc.measure_all()",
  ].join("\n");
}
export const bellGates: Gate[] = [
  { type: "H", target: 0 },
  { type: "CX", control: 0, target: 1 },
];
