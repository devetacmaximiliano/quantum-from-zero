"""Run reproducible examples. Remote submission only with --ionq and a configured key."""

import argparse
import json
import os

from app.models import CircuitRequest, Gate, OptimizationRequest
from app.optimization import qubo_result, solve_classical, solve_qaoa
from app.quantum import run_ionq, run_local


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--ionq", action="store_true", help="Also submit Bell to IonQ Simulator")
    args = parser.parse_args()
    bell = CircuitRequest(
        qubits=2,
        gates=[Gate(type="H", target=0), Gate(type="CX", control=0, target=1)],
        shots=1000,
        seed=42,
    )
    print(
        "Hadamard:",
        run_local(CircuitRequest(qubits=1, gates=[Gate(type="H", target=0)], seed=42))["counts"],
    )
    print("Bell:", run_local(bell)["counts"])
    request = OptimizationRequest(seed=42)
    print("Classical optimum:", json.dumps(solve_classical(request)["best"], ensure_ascii=True))
    qubo = qubo_result(request)
    print("QUBO matrix:", qubo["matrix"], "constant:", qubo["constant"])
    result = solve_qaoa(request)
    print(
        "QAOA:",
        json.dumps(
            {
                k: result[k]
                for k in [
                    "best",
                    "expected_score",
                    "valid_probability",
                    "evaluations",
                    "execution_ms",
                ]
            },
            ensure_ascii=True,
        ),
    )
    if args.ionq:
        from dotenv import load_dotenv

        load_dotenv()
        if os.getenv("IONQ_API_KEY"):
            print("IonQ:", json.dumps(run_ionq(bell), ensure_ascii=True))
        else:
            print("IonQ skipped: IONQ_API_KEY is not configured.")


if __name__ == "__main__":
    main()
