import { describe, it, expect } from "vitest";
import {
  bellGates,
  generateCode,
  norm,
  probabilities,
  simulate,
} from "@/lib/quantum";
describe("ideal circuit preview", () => {
  it("squares amplitudes for Hadamard probabilities", () => {
    const state = simulate(1, [{ type: "H", target: 0 }]);
    expect(state[0].re).toBeCloseTo(Math.SQRT1_2);
    expect(norm(state[0])).toBeCloseTo(0.5);
  });
  it("recombines H twice with interference", () => {
    expect(
      probabilities(1, [
        { type: "H", target: 0 },
        { type: "H", target: 0 },
      ])["0"],
    ).toBeCloseTo(1);
  });
  it("makes relative phase visible after recombination", () => {
    expect(
      probabilities(1, [
        { type: "H", target: 0 },
        { type: "RZ", target: 0, angle: Math.PI },
        { type: "H", target: 0 },
      ])["1"],
    ).toBeCloseTo(1);
  });
  it("prepares only 00 and 11 in a Bell state", () => {
    const p = probabilities(2, bellGates);
    expect(p["00"]).toBeCloseTo(0.5);
    expect(p["11"]).toBeCloseTo(0.5);
    expect(p["01"]).toBe(0);
    expect(p["10"]).toBe(0);
  });
  it.each([0, Math.PI / 2, Math.PI, 2 * Math.PI])(
    "matches RY analytic probabilities at %s",
    (theta) => {
      expect(
        probabilities(1, [{ type: "RY", target: 0, angle: theta }])["1"],
      ).toBeCloseTo(Math.sin(theta / 2) ** 2);
    },
  );
  it("preserves Qiskit little endian convention", () => {
    expect(probabilities(3, [{ type: "X", target: 0 }])["001"]).toBe(1);
  });
  it("handles complex RX amplitudes and preserves normalization", () => {
    const state = simulate(1, [{ type: "RX", target: 0, angle: Math.PI / 2 }]);
    expect(state[1].im).toBeCloseTo(-Math.SQRT1_2);
    expect(state.reduce((s, a) => s + norm(a), 0)).toBeCloseTo(1);
  });
  it("exports parameter and CX argument order correctly", () => {
    const code = generateCode(2, [
      ...bellGates,
      { type: "RY", target: 1, angle: Math.PI },
    ]);
    expect(code).toContain("qc.cx(0, 1)");
    expect(code).toContain("qc.ry(3.1416, 1)");
    expect(code).toContain("qc.measure_all()");
  });
});
