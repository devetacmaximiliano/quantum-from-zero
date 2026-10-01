import os
from time import perf_counter
from typing import Any

from qiskit import QuantumCircuit, transpile
from qiskit.quantum_info import Statevector
from qiskit_aer import AerSimulator

from app.models import CircuitRequest


def build_circuit(request: CircuitRequest) -> QuantumCircuit:
    """Unitary circuit; terminal measurements are added by the execution backend."""
    circuit = QuantumCircuit(request.qubits)
    for gate in request.gates:
        if gate.type == "H":
            circuit.h(gate.target)
        elif gate.type == "X":
            circuit.x(gate.target)
        elif gate.type == "CX":
            circuit.cx(gate.control, gate.target)
        elif gate.type == "RX":
            circuit.rx(gate.angle, gate.target)
        elif gate.type == "RY":
            circuit.ry(gate.angle, gate.target)
        elif gate.type == "RZ":
            circuit.rz(gate.angle, gate.target)
    return circuit


def run_local(request: CircuitRequest) -> dict[str, Any]:
    start = perf_counter()
    circuit = build_circuit(request)
    state = Statevector.from_instruction(circuit)
    exact = {
        format(i, f"0{request.qubits}b"): float(p) for i, p in enumerate(state.probabilities())
    }
    circuit.measure_all()
    simulator = AerSimulator(max_parallel_threads=2)
    compiled = transpile(circuit, simulator, optimization_level=1, seed_transpiler=42)
    result = simulator.run(compiled, shots=request.shots, seed_simulator=request.seed).result()
    counts = {str(k): int(v) for k, v in result.get_counts().items()}
    return {
        "backend": "Qiskit Aer · local",
        "counts": counts,
        "probabilities": {k: counts.get(k, 0) / request.shots for k in exact},
        "exact_probabilities": exact,
        "statevector": [{"real": float(a.real), "imag": float(a.imag)} for a in state.data],
        "shots": request.shots,
        "execution_ms": (perf_counter() - start) * 1000,
        "circuit": str(circuit.draw(output="text")),
        "depth": compiled.depth(),
        "bit_order": "q[n-1] … q[0] (q0 is the rightmost bit)",
    }


def run_ionq(request: CircuitRequest) -> dict[str, Any]:
    from qiskit_ionq import IonQProvider

    token = os.getenv("IONQ_API_KEY")
    if not token:
        raise ValueError("IonQ integration not configured. Set IONQ_API_KEY in backend/.env.")
    start = perf_counter()
    backend = IonQProvider(token=token).get_backend("ionq_simulator")
    circuit = build_circuit(request)
    circuit.measure_all()
    compiled = transpile(circuit, backend, optimization_level=1)
    job = backend.run(compiled, shots=request.shots)
    result = job.result(timeout=120, wait=2)
    counts = {str(k): int(v) for k, v in result.get_counts().items()}
    return {
        "backend": "IonQ Simulator · cloud",
        "job_id": job.job_id(),
        "counts": counts,
        "probabilities": {k: v / request.shots for k, v in counts.items()},
        "shots": request.shots,
        "execution_ms": (perf_counter() - start) * 1000,
        "circuit": str(circuit.draw(output="text")),
        "bit_order": "q[n-1] … q[0] (q0 is the rightmost bit)",
    }
