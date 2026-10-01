export type GateType = "H" | "X" | "CX" | "RX" | "RY" | "RZ" | "M";
export type Gate = {
  type: GateType;
  target: number;
  control?: number;
  angle?: number;
};
export type Circuit = { qubits: number; gates: Gate[]; shots: number };
export type QuantumResult = {
  backend: string;
  counts: Record<string, number>;
  probabilities: Record<string, number>;
  exact_probabilities?: Record<string, number>;
  statevector?: { real: number; imag: number }[];
  shots: number;
  execution_ms: number;
  circuit: string;
  job_id?: string;
};
export type Assignment = {
  bitstring: string;
  bits: number[];
  assignment: string[];
  valid: boolean;
  cost: number;
  penalties: number;
  score: number;
  probability?: number;
  count?: number;
};
export type ClassicalResult = {
  rows: Assignment[];
  best: Assignment;
  execution_ms: number;
  evaluations: number;
};
export type QuboResult = {
  matrix: number[][];
  variables: string[];
  constant: number;
  penalty: number;
  hamiltonian: string;
  offset: number;
  evaluation: Assignment | null;
};
export type QaoaResult = {
  rows: Assignment[];
  counts: Record<string, number>;
  trace: {
    iteration: number;
    beta: number;
    gamma: number;
    cost: number;
    parameters: number[];
  }[];
  best: Assignment | null;
  most_likely: Assignment;
  expected_score: number;
  valid_probability: number;
  parameters: number[];
  reps: number;
  shots: number;
  evaluations: number;
  execution_ms: number;
  converged: boolean;
  optimizer_message: string;
  method: string;
  circuit: string;
};
