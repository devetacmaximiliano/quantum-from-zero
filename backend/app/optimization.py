from time import perf_counter
from typing import Any

import numpy as np
from qiskit import QuantumCircuit, transpile
from qiskit.quantum_info import Statevector
from qiskit_aer import AerSimulator
from qiskit_optimization import QuadraticProgram
from scipy.optimize import minimize

from app.models import OptimizationRequest

VARIABLES = [f"x_{task}_{server}" for task in "ABC" for server in [1, 2]]


def penalty_value(request: OptimizationRequest) -> float:
    return request.penalty or sum(c for row in request.costs for c in row) + 1


def evaluate(bitstring: str, request: OptimizationRequest) -> dict[str, Any]:
    # Qiskit returns q5 ... q0; variable i is mapped to qubit i.
    bits = [int(c) for c in reversed(bitstring)]
    cost = sum(bits[i] * request.costs[i // 2][i % 2] for i in range(6))
    violations = sum((bits[2 * i] + bits[2 * i + 1] - 1) ** 2 for i in range(3))
    penalty = violations * penalty_value(request)
    assignments = []
    for i, task in enumerate("ABC"):
        servers = [str(j + 1) for j in range(2) if bits[i * 2 + j]]
        assignments.append(
            f"Task {task} → " + ("Server " + " + ".join(servers) if servers else "unassigned")
        )
    return {
        "bitstring": bitstring,
        "bits": bits,
        "assignment": assignments,
        "valid": violations == 0,
        "cost": cost,
        "penalties": penalty,
        "score": cost + penalty,
    }


def solve_classical(request: OptimizationRequest) -> dict[str, Any]:
    start = perf_counter()
    rows = [evaluate(format(i, "06b"), request) for i in range(64)]
    best = min((row for row in rows if row["valid"]), key=lambda row: row["cost"])
    return {
        "rows": rows,
        "best": best,
        "evaluations": 64,
        "execution_ms": (perf_counter() - start) * 1000,
    }


def make_qubo(request: OptimizationRequest) -> tuple[QuadraticProgram, np.ndarray]:
    penalty = penalty_value(request)
    q = np.zeros((6, 6))
    program = QuadraticProgram("task_assignment")
    for name in VARIABLES:
        program.binary_var(name)
    linear = {}
    quadratic = {}
    for i in range(6):
        q[i, i] = request.costs[i // 2][i % 2] - penalty
        linear[VARIABLES[i]] = float(q[i, i])
    for i in range(0, 6, 2):
        q[i, i + 1] = 2 * penalty
        quadratic[(VARIABLES[i], VARIABLES[i + 1])] = 2 * penalty
    program.minimize(constant=3 * penalty, linear=linear, quadratic=quadratic)
    return program, q


def qubo_result(request: OptimizationRequest) -> dict[str, Any]:
    program, q = make_qubo(request)
    hamiltonian, offset = program.to_ising()
    return {
        "matrix": q.tolist(),
        "variables": VARIABLES,
        "constant": 3 * penalty_value(request),
        "penalty": penalty_value(request),
        "hamiltonian": str(hamiltonian),
        "offset": float(offset),
        "evaluation": evaluate(request.bitstring, request) if request.bitstring else None,
        "convention": "Upper triangular Q; score = xᵀQx + constant; variables map q0 to q5.",
    }


def solve_qaoa(request: OptimizationRequest) -> dict[str, Any]:
    """Explicit QAOA layers make the cost and mixer transformations inspectable.

    This educational optimizer uses exact Statevector expectations, not shot noise,
    during optimization. The final circuit is sampled by Aer with requested shots.
    """
    start = perf_counter()
    program, _ = make_qubo(request)
    hamiltonian, offset = program.to_ising()
    energies = np.array([evaluate(format(i, "06b"), request)["score"] for i in range(64)])
    trace: list[dict[str, Any]] = []

    def circuit_for(params: np.ndarray) -> QuantumCircuit:
        circuit = QuantumCircuit(6)
        circuit.h(range(6))
        for layer in range(request.reps):
            gamma, beta = float(params[2 * layer]), float(params[2 * layer + 1])
            for pauli, coefficient in hamiltonian.to_list():
                targets = [i for i, char in enumerate(reversed(pauli)) if char == "Z"]
                angle = 2 * gamma * float(coefficient.real)
                if len(targets) == 1:
                    circuit.rz(angle, targets[0])
                elif len(targets) == 2:
                    circuit.rzz(angle, *targets)
            circuit.rx(2 * beta, range(6))
        return circuit

    def objective(params: np.ndarray) -> float:
        probabilities = Statevector.from_instruction(circuit_for(params)).probabilities()
        score = float(np.dot(probabilities, energies))
        trace.append(
            {
                "iteration": len(trace) + 1,
                "gamma": float(params[0]),
                "beta": float(params[1]),
                "parameters": params.tolist(),
                "cost": score,
            }
        )
        return score

    initial = np.array([0.05, 0.6] * request.reps)
    optimized = minimize(
        objective,
        initial,
        method="COBYLA",
        options={"maxiter": request.iterations, "rhobeg": 0.1, "tol": 1e-4},
    )
    circuit = circuit_for(optimized.x)
    exact = Statevector.from_instruction(circuit).probabilities()
    circuit.measure_all()
    simulator = AerSimulator(max_parallel_threads=2)
    compiled = transpile(circuit, simulator, optimization_level=1)
    counts = (
        simulator.run(compiled, shots=request.shots, seed_simulator=request.seed)
        .result()
        .get_counts()
    )
    rows = [
        dict(
            evaluate(bitstring, request), count=int(count), probability=float(count / request.shots)
        )
        for bitstring, count in counts.items()
    ]
    rows.sort(key=lambda row: row["probability"], reverse=True)
    valid = [row for row in rows if row["valid"]]
    best = min(valid, key=lambda row: row["cost"]) if valid else None
    return {
        "rows": rows,
        "counts": counts,
        "trace": trace,
        "best": best,
        "most_likely": rows[0],
        "expected_score": float(np.dot(exact, energies)),
        "valid_probability": float(
            sum(exact[i] for i in range(64) if evaluate(format(i, "06b"), request)["valid"])
        ),
        "parameters": optimized.x.tolist(),
        "reps": request.reps,
        "shots": request.shots,
        "evaluations": len(trace),
        "execution_ms": (perf_counter() - start) * 1000,
        "converged": bool(optimized.success),
        "optimizer_message": str(optimized.message),
        "hamiltonian": str(hamiltonian),
        "offset": float(offset),
        "circuit": str(circuit.draw(output="text")),
        "method": "Qiskit QAOA cost/mixer layers + exact Statevector expectations + COBYLA + final Aer shots",
    }
