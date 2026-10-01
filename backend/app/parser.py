"""Read a tiny Qiskit-shaped language with AST inspection, never execute Python."""

import ast
import math

from app.models import CircuitRequest, Gate


def number(node: ast.AST) -> float | int:
    if isinstance(node, ast.Constant) and type(node.value) in {int, float}:
        return node.value
    if isinstance(node, ast.UnaryOp) and isinstance(node.op, (ast.UAdd, ast.USub)):
        value = number(node.operand)
        return -value if isinstance(node.op, ast.USub) else value
    if isinstance(node, ast.Name) and node.id == "pi":
        return math.pi
    if isinstance(node, ast.BinOp) and isinstance(node.op, (ast.Mult, ast.Div)):
        a, b = number(node.left), number(node.right)
        if isinstance(node.op, ast.Div):
            if b == 0:
                raise ValueError("Division by zero in angle.")
            return a / b
        return a * b
    raise ValueError("Only numeric literals, pi, multiplication and division are allowed.")


def index(node: ast.AST) -> int:
    value = number(node)
    if type(value) is not int:
        raise ValueError("Qubit indices must be integer literals.")
    return value


def indices(node: ast.AST) -> list[int]:
    if isinstance(node, (ast.List, ast.Tuple)):
        return [index(item) for item in node.elts]
    return [index(node)]


def parse_code(code: str, shots: int = 1000, seed: int | None = None) -> CircuitRequest:
    if len(code) > 6000:
        raise ValueError("Code exceeds 6000 characters.")
    try:
        tree = ast.parse(code)
    except (SyntaxError, RecursionError) as exc:
        raise ValueError("Invalid syntax in the circuit DSL.") from exc
    if sum(1 for _ in ast.walk(tree)) > 1000:
        raise ValueError("Circuit source is too complex.")
    qubits: int | None = None
    gates: list[Gate] = []
    for statement in tree.body:
        if isinstance(statement, ast.ImportFrom):
            names = [(a.name, a.asname) for a in statement.names]
            if statement.level == 0 and (
                (statement.module == "qiskit" and names == [("QuantumCircuit", None)])
                or (statement.module == "math" and names == [("pi", None)])
            ):
                continue
            raise ValueError("Only QuantumCircuit from qiskit and pi from math may be imported.")
        if isinstance(statement, ast.Assign) and qubits is None:
            if len(statement.targets) != 1 or not isinstance(statement.targets[0], ast.Name):
                raise ValueError("Use qc = QuantumCircuit(n, n).")
            call = statement.value
            if statement.targets[0].id != "qc" or not isinstance(call, ast.Call):
                raise ValueError("Use qc = QuantumCircuit(n, n).")
            if not isinstance(call.func, ast.Name) or call.func.id != "QuantumCircuit":
                raise ValueError("Only QuantumCircuit construction is permitted.")
            if call.keywords or len(call.args) not in {1, 2}:
                raise ValueError("QuantumCircuit accepts one or two integer arguments.")
            qubits = index(call.args[0])
            if len(call.args) == 2 and index(call.args[1]) != qubits:
                raise ValueError("Use one classical bit per qubit.")
            if not 1 <= qubits <= 8:
                raise ValueError("Use 1 to 8 qubits.")
            continue
        if not isinstance(statement, ast.Expr) or not isinstance(statement.value, ast.Call):
            raise ValueError("Only qc gate calls are allowed; Python statements are not executed.")
        call = statement.value
        if qubits is None or not isinstance(call.func, ast.Attribute):
            raise ValueError("Declare qc before applying gates.")
        if not isinstance(call.func.value, ast.Name) or call.func.value.id != "qc":
            raise ValueError("Only calls on qc are allowed.")
        if call.keywords:
            raise ValueError("Keyword arguments are not supported.")
        name = call.func.attr
        args = call.args
        if name in {"h", "x"} and len(args) == 1:
            gates.append(Gate(type=name.upper(), target=index(args[0])))
        elif name in {"rx", "ry", "rz"} and len(args) == 2:
            gates.append(Gate(type=name.upper(), angle=number(args[0]), target=index(args[1])))
        elif name == "cx" and len(args) == 2:
            gates.append(Gate(type="CX", control=index(args[0]), target=index(args[1])))
        elif name == "measure_all" and not args:
            gates.extend(Gate(type="M", target=i) for i in range(qubits))
        elif name == "measure" and len(args) == 2:
            targets, classical = indices(args[0]), indices(args[1])
            if targets != classical or len(set(targets)) != len(targets):
                raise ValueError("Measurements must map qi to ci without duplicates.")
            gates.extend(Gate(type="M", target=i) for i in targets)
        else:
            raise ValueError("Supported calls: h, x, cx, rx, ry, rz, measure, measure_all.")
    if qubits is None:
        raise ValueError("Declare qc = QuantumCircuit(n, n).")
    return CircuitRequest(qubits=qubits, gates=gates, shots=shots, seed=seed)
