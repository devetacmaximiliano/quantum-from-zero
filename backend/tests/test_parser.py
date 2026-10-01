import math

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.parser import parse_code


def test_parse_qiskit_bell_template():
    request = parse_code(
        "from qiskit import QuantumCircuit\nqc = QuantumCircuit(2, 2)\nqc.h(0)\nqc.cx(0, 1)\nqc.measure([0, 1], [0, 1])"
    )
    assert request.qubits == 2
    assert [g.type for g in request.gates] == ["H", "CX", "M", "M"]


def test_angles_and_measure_all():
    request = parse_code(
        "from math import pi\nqc = QuantumCircuit(1)\nqc.ry(-pi/2, 0)\nqc.measure_all()"
    )
    assert request.gates[0].angle == -math.pi / 2


@pytest.mark.parametrize(
    "code",
    [
        "import os\nos.system('anything')",
        "from os import system",
        "qc = __import__('os')",
        "exec('anything')",
        "eval('anything')",
        "qc = QuantumCircuit(1)\nqc.__class__()",
        "qc = QuantumCircuit(1)\nqc.h(open('secret'))",
        "qc = QuantumCircuit(1)\nfor i in [0]:\n qc.h(i)",
        "qc = QuantumCircuit(1)\nqc.h(0.0)",
        "qc = QuantumCircuit(2, 1)",
        "qc = QuantumCircuit(100)",
        "qc = QuantumCircuit(1)\nqc.ry(1/0, 0)",
        "qc = QuantumCircuit(1)\nqc.h(0, extra=1)",
        "qc = QuantumCircuit(2)\nqc.measure([0,1], [1,0])",
        "qc = QuantumCircuit(1)\nqc.measure_all()\nqc.x(0)",
        "qc = QuantumCircuit(1)\nqc.measure_all()\nqc.measure_all()",
        "qc = QuantumCircuit(1)\nqc = QuantumCircuit(1)",
        "qc = QuantumCircuit(1)\nqc.ry(float('nan'),0)",
    ],
)
def test_unsafe_or_unsupported_source_rejected(code):
    response = TestClient(app).post("/api/quantum/code", json={"code": code})
    assert response.status_code == 422


def test_parser_endpoint_executes_only_validated_gates():
    response = TestClient(app).post(
        "/api/quantum/code",
        json={"code": "qc = QuantumCircuit(1)\nqc.x(0)\nqc.measure_all()", "shots": 100},
    )
    assert response.status_code == 200
    assert response.json()["counts"] == {"1": 100}
