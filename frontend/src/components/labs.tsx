"use client";
import { useState } from "react";
import {
  Plus,
  RotateCcw,
  Trash2,
  ArrowRight,
  ChevronRight,
  Grip,
  Cpu,
  Cloud,
  Radio,
} from "lucide-react";
import { useRequest } from "@/lib/api";
import {
  bellGates,
  generateCode,
  probabilities,
  simulate,
} from "@/lib/quantum";
import { recordRun } from "@/lib/progress";
import type { Gate, GateType, QuantumResult } from "@/lib/types";
import {
  BlochSphere,
  Button,
  Card,
  CardHeading,
  CircuitDiagram,
  CodeBlock,
  EmptyResult,
  Histogram,
  Notice,
  PageHeading,
  Result,
  RunButton,
  TextLink,
} from "./ui";

const labTabs = [
  ["gates", "Gate Playground"],
  ["measurement", "Measurement"],
  ["cnot", "CNOT"],
  ["entanglement", "Bell States"],
  ["circuit", "Circuit Builder"],
  ["parameters", "Parameters"],
  ["qiskit", "Qiskit Runner"],
  ["ionq", "IonQ Simulator"],
];
export function LabNav({ active }: { active: string }) {
  return (
    <div className="lab-tabs">
      {labTabs.map(([id, title]) => (
        <TextLink key={id} href={`/playground/${id}`}>
          {active === id ? <strong>{title}</strong> : title}
        </TextLink>
      ))}
    </div>
  );
}
function Shots({
  shots,
  onChange,
}: {
  shots: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="field-inline">
      Shots
      <select value={shots} onChange={(e) => onChange(Number(e.target.value))}>
        {[10, 100, 1000, 10000].map((n) => (
          <option key={n} value={n}>
            {n.toLocaleString("en-US")}
          </option>
        ))}
      </select>
    </label>
  );
}
function Rotation({
  angle,
  onChange,
}: {
  angle: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="rotation-control">
      <div>
        <label htmlFor="theta">
          Rotation angle <span className="mono">θ</span>
        </label>
        <strong className="mono">
          {(angle / Math.PI).toFixed(2)}π <span>{angle.toFixed(3)} rad</span>
        </strong>
      </div>
      <input
        id="theta"
        aria-label="Theta"
        type="range"
        min="0"
        max={2 * Math.PI}
        step="0.01"
        value={angle}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="range-labels">
        <button onClick={() => onChange(0)}>0</button>
        <button onClick={() => onChange(Math.PI / 2)}>π/2</button>
        <button onClick={() => onChange(Math.PI)}>π</button>
        <button onClick={() => onChange(2 * Math.PI)}>2π</button>
      </div>
    </div>
  );
}
export function GateLab({
  mode = "gates",
  compact = false,
}: {
  mode?: string;
  compact?: boolean;
}) {
  const parameter = mode === "parameters",
    measurement = mode === "measurement";
  const [gates, setGates] = useState<Gate[]>(
      measurement ? [{ type: "H", target: 0 }] : [],
    ),
    [angle, setAngle] = useState(Math.PI / 2),
    [shots, setShots] = useState(1000);
  const api = useRequest<QuantumResult>();
  const active = parameter
    ? [{ type: "RY" as const, target: 0, angle }]
    : gates;
  const state = simulate(1, active),
    p = probabilities(1, active);
  function apply(type: GateType) {
    api.clear();
    setGates((g) =>
      g.length < 32
        ? [
            ...g,
            { type, target: 0, ...(type.startsWith("R") ? { angle } : {}) },
          ]
        : g,
    );
  }
  async function run() {
    const result = await api.run("quantum/circuit", {
      qubits: 1,
      gates: active,
      shots,
    });
    if (result) recordRun();
  }
  return (
    <div className={compact ? "compact-lab" : "lab-grid"}>
      <Card className="qubit-card">
        <CardHeading
          tag={compact ? "LIVE EXPERIMENT" : "STATE PREVIEW"}
          title={
            parameter
              ? "A parameter. A new possibility."
              : "Meet your first qubit."
          }
          aside={<span className="badge green">1 qubit</span>}
        />
        <div className="qubit-visual">
          <BlochSphere state={state} />
          <div className="state-formula">
            |ψ⟩ = ({state[0].re.toFixed(3)}
            {Math.abs(state[0].im) > 0.001
              ? `${state[0].im >= 0 ? "+" : ""}${state[0].im.toFixed(3)}i`
              : ""}
            )|0⟩ + ({state[1].re.toFixed(3)}
            {Math.abs(state[1].im) > 0.001
              ? `${state[1].im >= 0 ? "+" : ""}${state[1].im.toFixed(3)}i`
              : ""}
            )|1⟩
          </div>
        </div>
        {!parameter && (
          <div className="gate-buttons">
            {(compact ? ["X", "H", "RY"] : ["X", "H", "RX", "RY", "RZ"]).map(
              (type) => (
                <button
                  key={type}
                  disabled={api.busy || gates.length >= 32}
                  className={
                    type === "H" ? "gate-button h-gate" : "gate-button"
                  }
                  onClick={() => apply(type as GateType)}
                  title={`Apply ${type}`}
                >
                  {type}
                </button>
              ),
            )}
            <button
              className="gate-button reset"
              disabled={api.busy}
              aria-label="Reset qubit"
              onClick={() => {
                setGates([]);
                api.clear();
              }}
            >
              <RotateCcw size={15} />
            </button>
          </div>
        )}
        <Histogram values={p} title="Ideal probabilities" />
        {!compact && (
          <Rotation
            angle={angle}
            onChange={(n) => {
              setAngle(n);
              api.clear();
            }}
          />
        )}
        <p className="caption">
          {parameter
            ? "RY(θ) cambia las amplitudes. Ajustar parámetros es la base de VQE, QAOA y QML."
            : "La esfera representa el estado puro antes de medir. Probabilidad = módulo de amplitud al cuadrado."}
        </p>
      </Card>
      {!compact && (
        <div className="lab-stack">
          <Card>
            <CardHeading
              tag="YOUR CIRCUIT"
              title={
                measurement
                  ? "Prepare. Measure. Repeat."
                  : "Small gates, real transformations."
              }
            />
            <CircuitDiagram
              qubits={1}
              gates={[...active, { type: "M", target: 0 }]}
            />
            <div className="run-controls">
              <Shots
                shots={shots}
                onChange={(n) => {
                  setShots(n);
                  api.clear();
                }}
              />
              <RunButton busy={api.busy} onClick={run} />
            </div>
            {api.error && <Notice error>{api.error}</Notice>}
            {api.data ? (
              <Result data={api.data} />
            ) : (
              <EmptyResult busy={api.busy} />
            )}
          </Card>
          <CodeBlock code={generateCode(1, active)} tooltips />
          <Notice>
            {measurement
              ? "Más shots reducen el error estadístico típico. No garantizan exactamente 50/50 ni corrigen errores sistemáticos."
              : "Probá H → H: recuperás |0⟩ por interferencia. Después probá H → RZ(π) → H para ver el efecto de la fase."}
          </Notice>
        </div>
      )}
    </div>
  );
}
export function TwoQubitLab({ bell = false }: { bell?: boolean }) {
  const [initial, setInitial] = useState("00"),
    [applied, setApplied] = useState(false),
    [step, setStep] = useState(0),
    [shots, setShots] = useState(1000);
  const api = useRequest<QuantumResult>();
  const init: Gate[] = initial
    .split("")
    .reverse()
    .flatMap((bit, target) =>
      bit === "1" ? [{ type: "X" as const, target }] : [],
    );
  const gates = bell
    ? bellGates.slice(0, step)
    : [
        ...init,
        ...(applied ? [{ type: "CX" as const, control: 0, target: 1 }] : []),
      ];
  const p = probabilities(2, gates);
  async function run() {
    const result = await api.run("quantum/circuit", {
      qubits: 2,
      gates,
      shots,
    });
    if (result) recordRun();
  }
  return (
    <div className="lab-grid">
      <Card>
        <CardHeading
          tag={bell ? "CORRELATED BY DESIGN" : "CONTROL → TARGET"}
          title={
            bell ? "Two qubits. One shared state." : "The quantum conditional."
          }
        />
        {bell ? (
          <div className="bell-steps">
            {["Before", "After H", "After CNOT"].map((name, i) => (
              <button
                key={name}
                onClick={() => {
                  setStep(i);
                  api.clear();
                }}
                className={i === step ? "active" : ""}
              >
                <span>0{i + 1}</span>
                {name}
                <ChevronRight size={15} />
              </button>
            ))}
          </div>
        ) : (
          <div className="run-controls">
            <label className="field-inline">
              Initial state
              <select
                value={initial}
                onChange={(e) => {
                  setInitial(e.target.value);
                  setApplied(false);
                  api.clear();
                }}
              >
                {["00", "01", "10", "11"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <Button
              onClick={() => {
                setApplied(!applied);
                api.clear();
              }}
              secondary
            >
              {applied ? "Undo CX" : "Apply CX(0, 1)"}
            </Button>
          </div>
        )}
        <CircuitDiagram qubits={2} gates={gates} />
        <div className="formula-box">
          {bell
            ? ["|00⟩", "(|00⟩ + |01⟩) / √2", "(|00⟩ + |11⟩) / √2"][step]
            : `|${Object.entries(p).find(([, v]) => v > 0.99)?.[0]}⟩`}
        </div>
        <Histogram values={p} />
        <Notice>
          Orden de Qiskit: <strong>q1q0</strong>. q0 está a la derecha.{" "}
          {bell
            ? "Un Bell es entrelazado: no se factoriza en dos estados puros individuales."
            : "q0 es control; q1 es target. CX invierte q1 cuando q0=1 en la base computacional."}
        </Notice>
      </Card>
      <div className="lab-stack">
        <Card>
          <CardHeading
            tag="RUN THE EXPERIMENT"
            title="From amplitudes to counts."
          />
          <div className="run-controls">
            <Shots
              shots={shots}
              onChange={(n) => {
                setShots(n);
                api.clear();
              }}
            />
            <RunButton busy={api.busy} onClick={run} />
          </div>
          {api.error && <Notice error>{api.error}</Notice>}
          {api.data ? (
            <Result data={api.data} />
          ) : (
            <EmptyResult busy={api.busy} />
          )}
        </Card>
        <CodeBlock code={generateCode(2, gates)} tooltips />
        {bell && (
          <Notice>
            Mediciones correlacionadas no bastan por sí solas para probar
            entrelazamiento. Este circuito prepara un estado puro conocido. No
            permite enviar información instantáneamente.
          </Notice>
        )}
      </div>
    </div>
  );
}
export function CircuitBuilder() {
  const [qubits, setQubits] = useState(2),
    [gates, setGates] = useState<Gate[]>(bellGates),
    [target, setTarget] = useState(0),
    [control, setControl] = useState(1),
    [angle, setAngle] = useState(Math.PI / 2),
    [shots, setShots] = useState(1000),
    [message, setMessage] = useState("");
  const api = useRequest<QuantumResult>();
  function add(type: string, q = target) {
    if (!["H", "X", "CX", "RX", "RY", "RZ", "M"].includes(type)) return;
    if (type === "CX" && control === q) {
      setMessage("Elegí un control diferente del target.");
      return;
    }
    if (gates.length >= 32) {
      setMessage("Máximo 32 operaciones en este builder.");
      return;
    }
    if (gates.some((g) => g.type === "M") && type !== "M") {
      setMessage(
        "Quitá las mediciones para agregar puertas. La medición debe ser terminal.",
      );
      return;
    }
    setMessage("");
    api.clear();
    if (type === "M") {
      if (!gates.some((g) => g.type === "M"))
        setGates((g) => [
          ...g,
          ...Array.from({ length: qubits }, (_, target) => ({
            type: "M" as const,
            target,
          })),
        ]);
    } else
      setGates((g) => [
        ...g,
        {
          type: type as GateType,
          target: q,
          ...(type === "CX" ? { control } : {}),
          ...(type.startsWith("R") ? { angle } : {}),
        },
      ]);
  }
  async function run() {
    const result = await api.run("quantum/circuit", { qubits, gates, shots });
    if (result) recordRun();
  }
  return (
    <div className="builder-layout">
      <Card>
        <CardHeading
          tag="GATE LIBRARY"
          title="Build something quantum."
          aside={
            <span className="badge">
              {qubits} qubits · {gates.length} gates
            </span>
          }
        />
        <p className="muted">
          Arrastrá una puerta a una línea o elegí target y hacé click. CX usa el
          control seleccionado.
        </p>
        <div className="builder-toolbar">
          <label>
            Target
            <select
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
            >
              {Array.from({ length: qubits }, (_, i) => (
                <option key={i} value={i}>
                  q{i}
                </option>
              ))}
            </select>
          </label>
          <label>
            Control
            <select
              value={control}
              onChange={(e) => setControl(Number(e.target.value))}
            >
              {Array.from({ length: qubits }, (_, i) => (
                <option key={i} value={i}>
                  q{i}
                </option>
              ))}
            </select>
          </label>
          <label>
            Angle (rad)
            <input
              aria-label="Gate angle"
              type="number"
              min="-100"
              max="100"
              step="0.1"
              value={angle}
              onChange={(e) => {
                const a = Number(e.target.value);
                if (Number.isFinite(a)) setAngle(a);
              }}
            />
          </label>
        </div>
        <div className="gate-library">
          {(["H", "X", "CX", "RX", "RY", "RZ", "M"] as GateType[]).map(
            (type) => (
              <button
                draggable
                disabled={api.busy}
                onDragStart={(e) => e.dataTransfer.setData("gate", type)}
                onClick={() => add(type)}
                className="library-gate"
                key={type}
              >
                <Grip size={12} />
                <span>{type === "M" ? "Measure" : type}</span>
              </button>
            ),
          )}
        </div>
        <div className="builder-canvas">
          <CircuitDiagram qubits={qubits} gates={gates} onDrop={add} />
          <div className="canvas-actions">
            <Button
              small
              secondary
              disabled={
                qubits >= 4 || gates.some((g) => g.type === "M") || api.busy
              }
              onClick={() => {
                setQubits((q) => q + 1);
                api.clear();
              }}
            >
              <Plus size={14} />
              Add qubit
            </Button>
            <Button
              small
              secondary
              disabled={api.busy}
              onClick={() => {
                setGates([]);
                api.clear();
                setMessage("");
              }}
            >
              <RotateCcw size={14} />
              Reset
            </Button>
          </div>
        </div>
        <div className="gate-sequence">
          {gates.map((g, i) => (
            <button
              key={i}
              disabled={api.busy}
              onClick={() => {
                setGates((prev) =>
                  g.type === "M"
                    ? prev.filter((item) => item.type !== "M")
                    : prev.filter((_, j) => j !== i),
                );
                api.clear();
              }}
              title="Remove gate"
            >
              {g.type} q{g.target}
              <Trash2 size={11} />
            </button>
          ))}
        </div>
        {message && <Notice error>{message}</Notice>}
        <div className="run-controls">
          <Shots
            shots={shots}
            onChange={(n) => {
              setShots(n);
              api.clear();
            }}
          />
          <RunButton busy={api.busy} onClick={run} />
        </div>
      </Card>
      <div className="lab-grid">
        <Card>
          <CardHeading
            tag="STATE SPACE"
            title={`${qubits} qubits → ${2 ** qubits} basis states`}
          />
          <Histogram values={probabilities(qubits, gates)} />
          <Notice>
            2ⁿ estados de base no significan 2ⁿ respuestas legibles. Cada shot
            devuelve un solo bitstring. q0 es el bit derecho.
          </Notice>
        </Card>
        <Card>
          <CardHeading tag="EXECUTION" title="See what your circuit does." />
          {api.error && <Notice error>{api.error}</Notice>}
          {api.data ? (
            <Result data={api.data} />
          ) : (
            <EmptyResult busy={api.busy} />
          )}
        </Card>
      </div>
      <CodeBlock code={generateCode(qubits, gates)} tooltips />
    </div>
  );
}
export function QiskitRunner() {
  const [code, setCode] = useState(generateCode(2, bellGates)),
    [shots, setShots] = useState(1000);
  const api = useRequest<QuantumResult>();
  async function run() {
    const result = await api.run("quantum/code", { code, shots });
    if (result) recordRun();
  }
  return (
    <div className="lab-grid">
      <Card>
        <CardHeading
          tag="PYTHON-SHAPED, SAFELY PARSED"
          title="Your first quantum program."
        />
        <div className="template-buttons">
          {[
            ["Bell", generateCode(2, bellGates)],
            ["Hadamard", generateCode(1, [{ type: "H", target: 0 }])],
            [
              "Rotation",
              generateCode(1, [{ type: "RY", target: 0, angle: Math.PI / 2 }]),
            ],
          ].map(([name, template]) => (
            <Button
              small
              secondary
              key={name}
              onClick={() => {
                setCode(template);
                api.clear();
              }}
            >
              {name}
            </Button>
          ))}
        </div>
        <label className="sr-only" htmlFor="code-editor">
          Qiskit circuit code
        </label>
        <textarea
          id="code-editor"
          className="code-editor"
          spellCheck={false}
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            api.clear();
          }}
          maxLength={6000}
        />
        <div className="run-controls">
          <Shots
            shots={shots}
            onChange={(n) => {
              setShots(n);
              api.clear();
            }}
          />
          <RunButton busy={api.busy} onClick={run} label="Run with Qiskit" />
        </div>
        <p className="caption">
          Soporta QuantumCircuit(1–8 qubits), h, x, cx, rx, ry, rz y mediciones
          terminales de todos los qubits. Ángulos: números, pi, multiplicación y
          división. Sin loops, funciones ni imports arbitrarios.
        </p>
      </Card>
      <Card>
        <CardHeading
          tag="FASTAPI → QISKIT AER"
          title="Real code. Real results."
        />
        {api.error && <Notice error>{api.error}</Notice>}
        {api.data ? (
          <Result data={api.data} />
        ) : (
          <EmptyResult busy={api.busy} />
        )}
        <Notice>
          El servidor inspecciona la sintaxis y construye un circuito validado.
          Nunca evalúa ni ejecuta el texto como Python.
        </Notice>
      </Card>
    </div>
  );
}
export function IonQLab() {
  const [template, setTemplate] = useState("Bell State"),
    [shots, setShots] = useState(1000);
  const local = useRequest<QuantumResult>(),
    cloud = useRequest<QuantumResult>();
  const gates: Gate[] =
    template === "Bell State"
      ? bellGates
      : template === "Hadamard"
        ? [{ type: "H", target: 0 }]
        : [{ type: "RY", target: 0, angle: Math.PI / 3 }];
  const body = { qubits: template === "Bell State" ? 2 : 1, gates, shots };
  async function run(ionq: boolean) {
    const api = ionq ? cloud : local;
    const result = await api.run(
      ionq ? "quantum/ionq" : "quantum/circuit",
      body,
    );
    if (result) recordRun(ionq);
  }
  return (
    <>
      <Card>
        <CardHeading
          tag="ONE CIRCUIT, TWO BACKENDS"
          title="From your machine to the cloud."
        />
        <div className="run-controls">
          <label className="field-inline">
            Circuit
            <select
              value={template}
              onChange={(e) => {
                setTemplate(e.target.value);
                local.clear();
                cloud.clear();
              }}
            >
              {["Hadamard", "Bell State", "Parameterized Circuit"].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <Shots
            shots={shots}
            onChange={(n) => {
              setShots(n);
              local.clear();
              cloud.clear();
            }}
          />
        </div>
        <CircuitDiagram qubits={body.qubits} gates={gates} />
      </Card>
      <div className="lab-grid spaced">
        <Card>
          <CardHeading
            tag="LOCAL"
            title="Qiskit Aer"
            aside={<Cpu size={20} />}
          />
          <RunButton
            busy={local.busy || cloud.busy}
            onClick={() => run(false)}
          />
          {local.error && <Notice error>{local.error}</Notice>}
          {local.data ? (
            <Result data={local.data} />
          ) : (
            <EmptyResult busy={local.busy} />
          )}
        </Card>
        <Card>
          <CardHeading
            tag="CLOUD"
            title="IonQ Simulator"
            aside={<Cloud size={20} />}
          />
          <RunButton
            busy={cloud.busy || local.busy}
            onClick={() => run(true)}
            label="Run on IonQ Simulator"
          />
          {cloud.error && <Notice error>{cloud.error}</Notice>}
          {cloud.data ? (
            <Result data={cloud.data} />
          ) : (
            <EmptyResult busy={cloud.busy} />
          )}
          <details className="details">
            <summary>Configurar IonQ</summary>
            <p>
              Creá una API key en IonQ Quantum Cloud. Guardala en{" "}
              <code>backend/.env</code> como <code>IONQ_API_KEY</code> y
              reiniciá FastAPI. La key permanece en el servidor.
            </p>
          </details>
        </Card>
      </div>
      <Notice>
        Pequeñas diferencias de counts son normales por muestreo. Aer corre
        localmente; IonQ Simulator corre en la nube sobre hardware clásico. Esta
        comparación no ejecuta una QPU.
      </Notice>
    </>
  );
}
export function LocalSimulator({
  embedded = false,
}: { embedded?: boolean } = {}) {
  const [shots, setShots] = useState(1000);
  const api = useRequest<QuantumResult>();
  async function run() {
    if (await api.run("quantum/bell", { shots })) recordRun();
  }
  return (
    <>
      {!embedded && (
        <PageHeading
          eyebrow="SIMULATORS / LOCAL"
          title="A quantum lab. On your machine."
          description="Seguí el viaje de tu circuito: desde las instrucciones hasta los resultados."
        />
      )}
      <div className={`execution-flow ${api.busy ? "running" : ""}`}>
        {[
          "Circuit",
          "Transpile",
          "AerSimulator",
          "Job",
          "Result",
          "Counts",
        ].map((s, i) => (
          <div key={s}>
            <span>0{i + 1}</span>
            <strong>{s}</strong>
            {i < 5 && <ArrowRight size={16} />}
          </div>
        ))}
      </div>
      <div className="lab-grid">
        <Card>
          <CardHeading tag="IDEAL SIMULATION" title="Prepare a Bell state." />
          <CircuitDiagram qubits={2} gates={bellGates} />
          <div className="run-controls">
            <Shots
              shots={shots}
              onChange={(n) => {
                setShots(n);
                api.clear();
              }}
            />
            <RunButton busy={api.busy} onClick={run} />
          </div>
          {api.error && <Notice error>{api.error}</Notice>}
          {api.data ? (
            <Result data={api.data} />
          ) : (
            <EmptyResult busy={api.busy} />
          )}
        </Card>
        <div className="lab-stack">
          <CodeBlock
            code={
              "from qiskit import QuantumCircuit, transpile\nfrom qiskit_aer import AerSimulator\n\nqc = QuantumCircuit(2)\nqc.h(0)\nqc.cx(0, 1)\nqc.measure_all()\n\nbackend = AerSimulator()\ncompiled = transpile(qc, backend, optimization_level=1)\njob = backend.run(compiled, shots=1000)\ncounts = job.result().get_counts()"
            }
            tooltips
          />
          <Notice>
            Aer calcula el estado con recursos clásicos y muestrea sus
            probabilidades. Simular estados generales requiere memoria que crece
            como 2ⁿ; no es una aceleración cuántica.
          </Notice>
        </div>
      </div>
    </>
  );
}
export function IonQInfo() {
  return (
    <>
      <PageHeading
        eyebrow="QUANTUM INFRASTRUCTURE"
        title="One SDK. A world of backends."
        description="Qiskit construye el programa. El backend decide dónde y cómo se ejecuta."
      />
      <div className="backend-cards">
        {[
          {
            icon: Cpu,
            title: "Local simulator",
            tag: "QISKIT AER",
            text: "Ideal para aprender y depurar. Corre en tu computadora clásica.",
            href: "/simulators/local",
          },
          {
            icon: Cloud,
            title: "Cloud simulator",
            tag: "IONQ SIMULATOR",
            text: "Ejecutá vía API. Incluye autenticación, envío de jobs y espera.",
            href: "/playground/ionq",
          },
          {
            icon: Radio,
            title: "Quantum processor",
            tag: "PHYSICAL QPU",
            text: "Qubits físicos de iones atrapados. Ruido, calibración y colas importan.",
            href: "/learn/12",
          },
        ].map((c) => (
          <Card key={c.title}>
            <c.icon className="feature-icon" />
            <span className="eyebrow">{c.tag}</span>
            <h2>{c.title}</h2>
            <p>{c.text}</p>
            <TextLink href={c.href}>Explore</TextLink>
          </Card>
        ))}
      </div>
      <Card className="spaced">
        <CardHeading tag="THE ARCHITECTURE" title="How IonQ connects." />
        <div className="execution-flow">
          {[
            "Web app",
            "FastAPI",
            "Qiskit",
            "qiskit-ionq",
            "IonQ API",
            "Simulator / QPU",
          ].map((s, i) => (
            <div key={s}>
              <span>0{i + 1}</span>
              <strong>{s}</strong>
              {i < 5 && <ArrowRight size={14} />}
            </div>
          ))}
        </div>
        <p>
          IonQ usa iones atrapados controlados con láser. Para programar, empezá
          por circuitos y resultados; no necesitás dominar física atómica. Esta
          app integra únicamente IonQ Simulator. El diagrama muestra dónde
          encajaría una QPU futura.
        </p>
        <TextLink href="/playground/ionq">Compare local and cloud</TextLink>
      </Card>
    </>
  );
}
export function LabPage({ mode }: { mode: string }) {
  const headings: Record<string, [string, string]> = {
    gates: [
      "Gate Playground",
      "Aplicá puertas, observá amplitudes y explorá interferencia.",
    ],
    measurement: [
      "Measurement Lab",
      "Un estado ideal. Muchos resultados posibles. Experimentá con shots.",
    ],
    cnot: ["CNOT Lab", "Explorá cómo interactúan control y target."],
    entanglement: [
      "Bell State Lab",
      "Construí el entrelazamiento paso a paso.",
    ],
    circuit: [
      "Circuit Builder",
      "Arrastrá puertas. Construí un programa. Ejecutalo con Qiskit.",
    ],
    parameters: [
      "Parameterized Circuits",
      "Un slider conecta parámetros, estado y probabilidades.",
    ],
    qiskit: [
      "Qiskit Code Runner",
      "Escribí circuitos con un subconjunto seguro de sintaxis Qiskit.",
    ],
    ionq: [
      "IonQ Simulator",
      "Ejecutá el mismo circuito localmente y en la nube.",
    ],
  };
  const [title, description] = headings[mode] ?? headings.gates;
  return (
    <>
      <PageHeading
        eyebrow="THE PLAYGROUND"
        title={title}
        description={description}
      />
      <LabNav active={mode} />
      {["gates", "measurement", "parameters"].includes(mode) ? (
        <GateLab key={mode} mode={mode} />
      ) : mode === "cnot" ? (
        <TwoQubitLab />
      ) : mode === "entanglement" ? (
        <TwoQubitLab bell />
      ) : mode === "circuit" ? (
        <CircuitBuilder />
      ) : mode === "qiskit" ? (
        <QiskitRunner />
      ) : (
        <IonQLab />
      )}
    </>
  );
}
