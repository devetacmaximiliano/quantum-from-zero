import math

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import app
from app.models import CircuitRequest, Gate
from app.quantum import run_local

client = TestClient(app)


def test_hadamard_distribution():
    response = client.post("/api/quantum/hadamard", json={"shots": 10000, "seed": 42})
    assert response.status_code == 200
    result = response.json()
    assert sum(result["counts"].values()) == 10000
    assert result["exact_probabilities"]["0"] == pytest.approx(0.5)
    assert result["probabilities"]["0"] == pytest.approx(0.5, abs=0.025)


def test_bell_state_and_relative_phase():
    result = client.post("/api/quantum/bell", json={"shots": 1000, "seed": 42}).json()
    assert set(result["counts"]) == {"00", "11"}
    assert result["exact_probabilities"]["00"] == pytest.approx(0.5)
    assert result["statevector"][0]["real"] == pytest.approx(math.sqrt(0.5))
    assert result["statevector"][3]["real"] == pytest.approx(math.sqrt(0.5))
    assert sum(result["counts"].values()) == 1000


def test_phase_interference():
    result = run_local(
        CircuitRequest(
            qubits=1,
            gates=[
                Gate(type="H", target=0),
                Gate(type="RZ", target=0, angle=math.pi),
                Gate(type="H", target=0),
            ],
            shots=100,
            seed=42,
        )
    )
    assert result["counts"] == {"1": 100}


@pytest.mark.parametrize("theta,p1", [(0, 0), (math.pi / 2, 0.5), (math.pi, 1), (2 * math.pi, 0)])
def test_ry_probabilities(theta, p1):
    result = client.post("/api/quantum/parameterized", json={"theta": theta}).json()
    assert result["exact_probabilities"]["1"] == pytest.approx(p1, abs=1e-10)


@pytest.mark.parametrize(
    "initial,expected", [("00", "00"), ("01", "11"), ("10", "10"), ("11", "01")]
)
def test_cnot_and_qiskit_bit_order(initial, expected):
    gates = [Gate(type="X", target=i) for i, bit in enumerate(reversed(initial)) if bit == "1"]
    gates.append(Gate(type="CX", control=0, target=1))
    result = run_local(CircuitRequest(qubits=2, gates=gates, shots=20))
    assert result["counts"] == {expected: 20}


@pytest.mark.parametrize(
    "payload",
    [
        {"qubits": 9},
        {"shots": 10001},
        {"qubits": 1, "gates": [{"type": "X", "target": 1}]},
        {"gates": [{"type": "CX", "control": 0, "target": 0}]},
        {"gates": [{"type": "RY", "target": 0}]},
        {"gates": [{"type": "M", "target": 0}, {"type": "H", "target": 1}]},
        {"gates": [{"type": "M", "target": 0}]},
        {"gates": [{"type": "X", "target": 0}] * 65},
        {"evil": "ignored?"},
    ],
)
def test_invalid_circuits_rejected(payload):
    assert client.post("/api/quantum/circuit", json=payload).status_code == 422


def test_rotations_reject_nan():
    with pytest.raises(ValidationError):
        Gate(type="RY", target=0, angle=float("nan"))


def test_ionq_missing_key(monkeypatch):
    monkeypatch.delenv("IONQ_API_KEY", raising=False)
    response = client.post("/api/quantum/ionq", json={"qubits": 1})
    assert response.status_code == 503
    assert "not configured" in response.json()["detail"]


def test_ionq_provider_errors_do_not_leak_credentials(monkeypatch):
    monkeypatch.setenv("IONQ_API_KEY", "private-token")

    def fail(_):
        raise RuntimeError("provider failure with private-token")

    monkeypatch.setattr("app.main.run_ionq", fail)
    response = client.post("/api/quantum/ionq", json={"qubits": 1})
    assert response.status_code == 502
    assert "private-token" not in response.text


def test_health_versions_without_key(monkeypatch):
    monkeypatch.delenv("IONQ_API_KEY", raising=False)
    result = client.get("/api/health").json()
    assert result["status"] == "ok"
    assert result["ionq_configured"] is False
    assert "qiskit" in result["versions"]
