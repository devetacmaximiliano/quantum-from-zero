import math
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Gate(StrictModel):
    type: Literal["H", "X", "CX", "RX", "RY", "RZ", "M"]
    target: int = Field(ge=0, le=7)
    control: int | None = Field(default=None, ge=0, le=7)
    angle: float | None = Field(default=None, ge=-100, le=100, allow_inf_nan=False)

    @model_validator(mode="after")
    def validate_gate(self) -> "Gate":
        if self.type == "CX":
            if self.control is None or self.control == self.target:
                raise ValueError("CX requires different control and target qubits.")
        elif self.control is not None:
            raise ValueError("Only CX accepts a control qubit.")
        if self.type in {"RX", "RY", "RZ"}:
            if self.angle is None or not math.isfinite(self.angle):
                raise ValueError("Rotation gates require a finite angle in radians.")
        elif self.angle is not None:
            raise ValueError("Only rotation gates accept an angle.")
        return self


class ShotsRequest(StrictModel):
    shots: int = Field(default=1000, ge=1, le=10000)
    seed: int | None = Field(default=None, ge=0, le=2147483647)


class CircuitRequest(ShotsRequest):
    qubits: int = Field(default=2, ge=1, le=8)
    gates: list[Gate] = Field(default_factory=list, max_length=64)

    @model_validator(mode="after")
    def validate_circuit(self) -> "CircuitRequest":
        measured: set[int] = set()
        for gate in self.gates:
            if gate.target >= self.qubits or (
                gate.control is not None and gate.control >= self.qubits
            ):
                raise ValueError("Gate references a qubit outside the circuit.")
            if gate.type == "M":
                if gate.target in measured:
                    raise ValueError("A qubit can only be measured once.")
                measured.add(gate.target)
            elif measured:
                raise ValueError("This learning DSL supports terminal measurements only.")
        if measured and measured != set(range(self.qubits)):
            raise ValueError("Measure all qubits, or omit measurements to add them automatically.")
        return self


class ParameterRequest(ShotsRequest):
    theta: float = Field(default=math.pi / 2, ge=-100, le=100, allow_inf_nan=False)


class CodeRequest(ShotsRequest):
    code: str = Field(min_length=1, max_length=6000)


class OptimizationRequest(ShotsRequest):
    costs: list[list[float]] = Field(default_factory=lambda: [[4, 7], [6, 2], [3, 5]])
    penalty: float | None = Field(default=None, gt=0, le=10000, allow_inf_nan=False)
    bitstring: str | None = Field(default=None, pattern=r"^[01]{6}$")
    reps: int = Field(default=1, ge=1, le=3)
    iterations: int = Field(default=40, ge=6, le=100)

    @model_validator(mode="after")
    def validate_costs(self) -> "OptimizationRequest":
        if len(self.costs) != 3 or any(len(row) != 2 for row in self.costs):
            raise ValueError("Provide costs for exactly 3 tasks and 2 servers.")
        if any(not math.isfinite(c) or c < 0 or c > 100 for row in self.costs for c in row):
            raise ValueError("Costs must be finite numbers between 0 and 100.")
        return self
