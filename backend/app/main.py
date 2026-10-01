import os
from importlib.metadata import version
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.models import (
    CircuitRequest,
    CodeRequest,
    Gate,
    OptimizationRequest,
    ParameterRequest,
    ShotsRequest,
)
from app.optimization import qubo_result, solve_classical, solve_qaoa
from app.parser import parse_code
from app.quantum import run_ionq, run_local

load_dotenv(Path(__file__).resolve().parents[1] / ".env")
app = FastAPI(title="Quantum from Zero", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(
        ","
    ),
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/api/health")
def health() -> dict:
    return {
        "status": "ok",
        "ionq_configured": bool(os.getenv("IONQ_API_KEY")),
        "versions": {
            p: version(p) for p in ["qiskit", "qiskit-aer", "qiskit-ionq", "qiskit-optimization"]
        },
    }


@app.post("/api/quantum/hadamard")
def hadamard(request: ShotsRequest) -> dict:
    return run_local(
        CircuitRequest(qubits=1, gates=[Gate(type="H", target=0)], **request.model_dump())
    )


@app.post("/api/quantum/bell")
def bell(request: ShotsRequest) -> dict:
    return run_local(
        CircuitRequest(
            qubits=2,
            gates=[Gate(type="H", target=0), Gate(type="CX", control=0, target=1)],
            **request.model_dump(),
        )
    )


@app.post("/api/quantum/circuit")
def circuit(request: CircuitRequest) -> dict:
    return run_local(request)


@app.post("/api/quantum/parameterized")
def parameterized(request: ParameterRequest) -> dict:
    return run_local(
        CircuitRequest(
            qubits=1,
            gates=[Gate(type="RY", target=0, angle=request.theta)],
            shots=request.shots,
            seed=request.seed,
        )
    )


@app.post("/api/quantum/code")
def code(request: CodeRequest) -> dict:
    try:
        parsed = parse_code(request.code, request.shots, request.seed)
    except (ValueError, RecursionError, OverflowError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return run_local(parsed)


@app.post("/api/quantum/ionq")
def ionq(request: CircuitRequest) -> dict:
    if not os.getenv("IONQ_API_KEY"):
        raise HTTPException(
            status_code=503,
            detail="IonQ integration not configured. Set IONQ_API_KEY in backend/.env.",
        )
    try:
        return run_ionq(request)
    except Exception as exc:
        # Provider exceptions can contain credentials or upstream response details.
        raise HTTPException(
            status_code=502,
            detail="IonQ could not complete the job. Check credentials, connectivity and your IonQ console.",
        ) from exc


@app.post("/api/optimization/classical")
def classical(request: OptimizationRequest) -> dict:
    return solve_classical(request)


@app.post("/api/optimization/qubo")
def qubo(request: OptimizationRequest) -> dict:
    return qubo_result(request)


@app.post("/api/optimization/qaoa")
def qaoa(request: OptimizationRequest) -> dict:
    return solve_qaoa(request)
