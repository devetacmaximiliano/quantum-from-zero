import numpy as np
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models import OptimizationRequest
from app.optimization import evaluate, make_qubo, solve_classical, solve_qaoa


def test_classical_optimum_and_feasibility():
    result = solve_classical(OptimizationRequest())
    assert len(result["rows"]) == 64
    assert sum(row["valid"] for row in result["rows"]) == 8
    assert result["best"]["cost"] == 9
    assert result["best"]["bitstring"] == "011001"
    assert result["best"]["assignment"] == [
        "Task A → Server 1",
        "Task B → Server 2",
        "Task C → Server 1",
    ]


def test_qubo_matrix_and_ising_match_every_bitstring():
    request = OptimizationRequest()
    program, matrix = make_qubo(request)
    hamiltonian, offset = program.to_ising()
    diagonal = np.real(np.diag(hamiltonian.to_matrix())) + offset
    for i in range(64):
        row = evaluate(format(i, "06b"), request)
        x = np.array(row["bits"])
        assert float(x @ matrix @ x + program.objective.constant) == pytest.approx(row["score"])
        assert program.objective.evaluate(x) == pytest.approx(row["score"])
        assert diagonal[i] == pytest.approx(row["score"])


def test_decode_unassigned_double_assigned_and_valid():
    request = OptimizationRequest()
    empty = evaluate("000000", request)
    assert not empty["valid"] and empty["cost"] == 0 and empty["penalties"] > 0
    assert not evaluate("111111", request)["valid"]
    all_first = evaluate("010101", request)
    assert all_first["valid"] and all_first["cost"] == 13


def test_custom_costs_change_optimum():
    result = solve_classical(OptimizationRequest(costs=[[9, 1], [8, 2], [7, 3]]))
    assert result["best"]["cost"] == 6
    assert result["best"]["bitstring"] == "101010"


@pytest.mark.parametrize(
    "payload",
    [
        {"costs": [[1, 2]]},
        {"costs": [[-1, 2], [3, 4], [5, 6]]},
        {"penalty": 0},
        {"reps": 4},
        {"iterations": 101},
        {"bitstring": "abc123"},
    ],
)
def test_invalid_optimization_request(payload):
    assert TestClient(app).post("/api/optimization/qubo", json=payload).status_code == 422


def test_qubo_endpoint():
    response = TestClient(app).post("/api/optimization/qubo", json={"bitstring": "011001"})
    assert response.status_code == 200
    assert response.json()["evaluation"]["score"] == 9
    assert response.json()["matrix"][0][1] == 56


def test_qaoa_output_is_measured_normalized_and_reproducible():
    request = OptimizationRequest(shots=1000, seed=42, iterations=20)
    result = solve_qaoa(request)
    assert sum(result["counts"].values()) == 1000
    assert sum(row["probability"] for row in result["rows"]) == pytest.approx(1)
    assert result["evaluations"] <= 20
    assert 0 <= result["valid_probability"] <= 1
    assert np.isfinite(result["expected_score"])
    assert len(result["parameters"]) == 2
    assert result["best"] is None or result["best"]["valid"]
    for row in result["rows"]:
        assert row["score"] == evaluate(row["bitstring"], request)["score"]
    # Returned parameters give the expected cost recorded in the actual trace.
    optimum_entries = [
        item for item in result["trace"] if np.allclose(item["parameters"], result["parameters"])
    ]
    assert optimum_entries
    assert optimum_entries[-1]["cost"] == pytest.approx(result["expected_score"])


def test_three_layer_qaoa_has_six_parameters():
    result = solve_qaoa(OptimizationRequest(reps=3, iterations=12, shots=100, seed=42))
    assert len(result["parameters"]) == 6
    assert sum(result["counts"].values()) == 100
