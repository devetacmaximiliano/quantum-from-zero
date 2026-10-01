"use client";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  Play,
  Pause,
  SlidersHorizontal,
} from "lucide-react";
import { useRequest } from "@/lib/api";
import { recordRun } from "@/lib/progress";
import type {
  Assignment,
  ClassicalResult,
  QaoaResult,
  QuboResult,
} from "@/lib/types";
import {
  Button,
  Card,
  CardHeading,
  EmptyResult,
  Histogram,
  Notice,
  PageHeading,
  RunButton,
  TextLink,
} from "./ui";

const variables = ["x_A_1", "x_A_2", "x_B_1", "x_B_2", "x_C_1", "x_C_2"];
function decode(
  bitstring: string,
  costs: number[][],
  penalty: number,
): Assignment {
  const bits = bitstring.split("").reverse().map(Number);
  const valid = bits.length === 6 && bits.every(Number.isFinite);
  const cost = valid
    ? bits.reduce((s, b, i) => s + b * costs[Math.floor(i / 2)][i % 2], 0)
    : 0;
  const violations = valid
    ? [0, 1, 2].reduce(
        (s, i) => s + (bits[i * 2] + bits[i * 2 + 1] - 1) ** 2,
        0,
      )
    : 3;
  return {
    bits,
    bitstring,
    valid: valid && violations === 0,
    cost,
    penalties: violations * penalty,
    score: cost + violations * penalty,
    assignment: ["A", "B", "C"].map(
      (t, i) =>
        `Task ${t} → ${bits[i * 2] && bits[i * 2 + 1] ? "Both servers" : bits[i * 2] ? "Server 1" : bits[i * 2 + 1] ? "Server 2" : "Unassigned"}`,
    ),
  };
}
function AssignmentView({ data }: { data: Assignment }) {
  return (
    <div className="assignment-result">
      <div className="assignment-top">
        <code>{data.bitstring}</code>
        <span className={`badge ${data.valid ? "green" : "orange"}`}>
          {data.valid ? "Valid assignment" : "Invalid assignment"}
        </span>
      </div>
      {data.assignment.map((a) => (
        <div className="assignment-line" key={a}>
          <span className="assignment-node" />
          {a}
        </div>
      ))}
      <div className="mini-metrics">
        <div>
          <span>Business cost</span>
          <strong>{data.cost.toFixed(1)}</strong>
        </div>
        <div>
          <span>Penalties</span>
          <strong>{data.penalties.toFixed(1)}</strong>
        </div>
        <div>
          <span>QUBO score</span>
          <strong>{data.score.toFixed(1)}</strong>
        </div>
      </div>
    </div>
  );
}
function CostEditor({
  costs,
  onChange,
  disabled,
}: {
  costs: number[][];
  onChange: (c: number[][]) => void;
  disabled: boolean;
}) {
  return (
    <Card>
      <CardHeading
        tag="THE BUSINESS PROBLEM"
        title="Three tasks. Two servers."
        aside={<SlidersHorizontal size={18} />}
      />
      <p className="muted">
        Cada tarea debe asignarse exactamente una vez. Modificá el costo de
        ejecutarla en cada servidor. Este modelo no tiene límites de capacidad.
      </p>
      <div className="cost-grid">
        <div />
        <span>Server 1</span>
        <span>Server 2</span>
        {costs.map((row, i) => (
          <div className="cost-row" key={i}>
            <strong>
              <span className="task-icon">{String.fromCharCode(65 + i)}</span>
              Task {String.fromCharCode(65 + i)}
            </strong>
            {row.map((cost, j) => (
              <label key={j}>
                <span className="sr-only">
                  Task {String.fromCharCode(65 + i)} Server {j + 1} cost
                </span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={cost}
                  disabled={disabled}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (Number.isFinite(value) && value >= 0 && value <= 100)
                      onChange(
                        costs.map((r, k) =>
                          k === i ? r.map((v, l) => (l === j ? value : v)) : r,
                        ),
                      );
                  }}
                />
              </label>
            ))}
          </div>
        ))}
      </div>
      <div className="formula-box small-formula">
        min Σ cₜₛxₜₛ <span>subject to xₜ₁ + xₜ₂ = 1</span>
      </div>
    </Card>
  );
}
function ClassicalTable({ result }: { result: ClassicalResult }) {
  const [onlyValid, setOnlyValid] = useState(true);
  return (
    <>
      <div className="table-toolbar">
        <label>
          <input
            type="checkbox"
            checked={onlyValid}
            onChange={(e) => setOnlyValid(e.target.checked)}
          />{" "}
          Only valid assignments
        </label>
        <span>
          {result.evaluations} evaluated · {result.execution_ms.toFixed(2)} ms
        </span>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Bitstring q5…q0</th>
              <th>Assignment (A / B / C)</th>
              <th>Valid</th>
              <th>Cost</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {result.rows
              .filter((r) => !onlyValid || r.valid)
              .map((r) => (
                <tr
                  key={r.bitstring}
                  className={
                    r.bitstring === result.best.bitstring ? "best-row" : ""
                  }
                >
                  <td className="mono">
                    {r.bitstring}
                    {r.bitstring === result.best.bitstring && (
                      <Check size={13} />
                    )}
                  </td>
                  <td>
                    {r.assignment
                      .map((s) => s.split("→")[1].trim())
                      .join(" / ")}
                  </td>
                  <td>
                    <span className={`badge ${r.valid ? "green" : "orange"}`}>
                      {r.valid ? "Valid" : "Invalid"}
                    </span>
                  </td>
                  <td>{r.cost.toFixed(1)}</td>
                  <td>{r.score.toFixed(1)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
function QuboExplorer({
  costs,
  penalty,
  verified,
}: {
  costs: number[][];
  penalty: number;
  verified: QuboResult | null;
}) {
  const [selected, setSelected] = useState([0, 0]),
    [bitstring, setBitstring] = useState("010101");
  const matrix =
    verified?.matrix ??
    Array.from({ length: 6 }, (_, i) =>
      Array.from({ length: 6 }, (_, j) =>
        i === j
          ? costs[Math.floor(i / 2)][i % 2] - penalty
          : i % 2 === 0 && j === i + 1
            ? 2 * penalty
            : 0,
      ),
    );
  const [row, col] = selected,
    decoded = /^[01]{6}$/.test(bitstring)
      ? decode(bitstring, costs, penalty)
      : null;
  return (
    <div className="lab-grid">
      <Card>
        <CardHeading
          tag="QUADRATIC UNCONSTRAINED BINARY OPTIMIZATION"
          title="A matrix with meaning."
        />
        <div className="formula-box">F(x) = xᵀQx + {3 * penalty}</div>
        <div className="matrix-scroll">
          <div className="matrix-grid">
            <span />
            {variables.map((v) => (
              <span className="matrix-label" key={v}>
                {v}
              </span>
            ))}
            {matrix.map((r, i) => (
              <div className="matrix-row" key={i}>
                <span className="matrix-label">{variables[i]}</span>
                {r.map((value, j) => (
                  <button
                    key={j}
                    className={`${value ? "nonzero" : ""} ${selected[0] === i && selected[1] === j ? "selected" : ""}`}
                    onClick={() => setSelected([i, j])}
                    aria-label={`Q row ${i + 1} column ${j + 1}: ${value}`}
                  >
                    {value.toFixed(0)}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="cell-explanation">
          <code>
            Q[{row},{col}] = {matrix[row][col]}
          </code>
          <p>
            {row === col
              ? `Término lineal de ${variables[row]}. Es su costo ${costs[Math.floor(row / 2)][row % 2]} menos la penalidad ${penalty}; x²=x para variables binarias.`
              : matrix[row][col] !== 0
                ? `Acoplamiento 2P entre ${variables[row]} y ${variables[col]}. Penaliza elegir ambos servidores para la misma tarea.`
                : "Sin acoplamiento directo entre estas variables en este modelo."}
          </p>
        </div>
        <p className="caption">
          Q es triangular superior. La constante 3P conserva el valor del
          objetivo. La matriz se calcula a partir de F = Σcx + PΣ(xₜ₁+xₜ₂−1)².
        </p>
      </Card>
      <div className="lab-stack">
        <Card>
          <CardHeading
            tag="BITSTRING EXPLORER"
            title="Decode the quantum answer."
          />
          <label className="field-block">
            Bitstring · q5 q4 q3 q2 q1 q0
            <input
              className="bitstring-input"
              maxLength={6}
              value={bitstring}
              onChange={(e) => setBitstring(e.target.value)}
              placeholder="010101"
              aria-label="Bitstring"
            />
          </label>
          <div className="bit-labels">
            {[...variables].reverse().map((v) => (
              <code key={v}>{v}</code>
            ))}
          </div>
          {decoded ? (
            <AssignmentView data={decoded} />
          ) : (
            <Notice error>Ingresá exactamente 6 bits (0 o 1).</Notice>
          )}
          <Notice>
            q0 está a la derecha y corresponde a x_A_1. En 010101 cada tarea
            elige Server 1. 000000 deja todas sin asignar.
          </Notice>
        </Card>
        <Card>
          <CardHeading tag="THE BRIDGE" title="From QUBO to a Hamiltonian." />
          <p>
            Qiskit Optimization sustituye xᵢ=(1−Zᵢ)/2. El operador resultante
            asigna la misma energía a cada bitstring, incluyendo un offset
            constante.
          </p>
          {verified ? (
            <pre className="hamiltonian">
              {verified.hamiltonian}
              <br />
              Offset: {verified.offset.toFixed(2)}
            </pre>
          ) : (
            <p className="caption">
              Usá Verify QUBO para obtener el Hamiltoniano real desde Qiskit
              Optimization.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
function Trace({ result }: { result: QaoaResult }) {
  const [index, setIndex] = useState(0),
    [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(
      () =>
        setIndex((i) => {
          if (i >= result.trace.length - 1) {
            return 0;
          }
          return i + 1;
        }),
      600,
    );
    return () => clearInterval(timer);
  }, [playing, result.trace.length]);
  const current = result.trace[Math.min(index, result.trace.length - 1)],
    costs = result.trace.map((t) => t.cost),
    min = Math.min(...costs),
    max = Math.max(...costs);
  const points = costs
    .map(
      (c, i) =>
        `${15 + (i * 490) / Math.max(1, costs.length - 1)},${125 - ((c - min) / Math.max(1, max - min)) * 105}`,
    )
    .join(" ");
  return (
    <Card>
      <CardHeading
        tag="THE CLASSICAL FEEDBACK LOOP"
        title="Follow each evaluation."
        aside={
          <Button secondary small onClick={() => setPlaying(!playing)}>
            {playing ? <Pause size={13} /> : <Play size={13} />}{" "}
            {playing ? "Pause" : "Play"}
          </Button>
        }
      />
      <div className={`qaoa-loop ${playing ? "running" : ""}`}>
        {[
          "QUBO",
          "Hamiltonian",
          "Circuit",
          "Measurements",
          "Cost",
          "Optimizer",
          "Parameters",
        ].map((s, i) => (
          <div key={s}>
            <span>{s}</span>
            {i < 6 && <ArrowRight size={12} />}
          </div>
        ))}
      </div>
      <p className="caption">
        En esta demo las evaluaciones usan expectativas exactas; los shots se
        toman al final. La animación reproduce el trace real ya calculado.
      </p>
      <svg
        viewBox="0 0 520 145"
        className="trace-chart"
        role="img"
        aria-label="Costo esperado por evaluación"
      >
        <path
          d="M15 20H505 M15 72H505 M15 125H505"
          stroke="#303438"
          strokeDasharray="3 5"
        />
        <polyline
          points={points}
          fill="none"
          stroke="#acd2a0"
          strokeWidth="2"
        />
        <circle
          cx={15 + (index * 490) / Math.max(1, costs.length - 1)}
          cy={125 - ((current.cost - min) / Math.max(1, max - min)) * 105}
          r="4"
          fill="#d2e9b9"
        />
      </svg>
      <input
        type="range"
        aria-label="QAOA evaluation"
        min="0"
        max={result.trace.length - 1}
        value={index}
        onChange={(e) => setIndex(Number(e.target.value))}
      />
      <div className="mini-metrics">
        <div>
          <span>Evaluation</span>
          <strong>
            {current.iteration} / {result.trace.length}
          </strong>
        </div>
        <div>
          <span>γ / β · layer 1</span>
          <strong className="mono">
            {current.gamma.toFixed(3)} / {current.beta.toFixed(3)}
          </strong>
        </div>
        <div>
          <span>Expected score</span>
          <strong>{current.cost.toFixed(2)}</strong>
        </div>
      </div>
      {result.reps > 1 && (
        <p className="caption mono">
          All parameters [γ₁, β₁, …]:{" "}
          {current.parameters.map((v) => v.toFixed(3)).join(", ")}
        </p>
      )}
    </Card>
  );
}
function QaoaOutput({ result }: { result: QaoaResult }) {
  const top = result.rows.slice(0, 8);
  return (
    <>
      <div className="lab-grid spaced">
        <Trace key={`${result.execution_ms}`} result={result} />
        <Card>
          <CardHeading
            tag="FINAL AER MEASUREMENTS"
            title="A distribution, not a promise."
          />
          <Histogram
            values={Object.fromEntries(
              top.map((r) => [r.bitstring, r.probability!]),
            )}
            counts={result.counts}
            title="Top 8 observed bitstrings"
          />
          <p className="caption">
            {result.shots} shots · {result.execution_ms.toFixed(1)} ms ·{" "}
            {result.evaluations} evaluations. Resto de resultados:{" "}
            {(100 - top.reduce((s, r) => s + r.probability! * 100, 0)).toFixed(
              1,
            )}
            %.
          </p>
          <div className="mini-metrics">
            <div>
              <span>Expected QUBO score</span>
              <strong>{result.expected_score.toFixed(2)}</strong>
            </div>
            <div>
              <span>Ideal validity</span>
              <strong>{(result.valid_probability * 100).toFixed(1)}%</strong>
            </div>
          </div>
          <Notice>
            {result.converged
              ? "COBYLA cumplió su criterio de terminación. Eso no garantiza un óptimo global."
              : `COBYLA finalizó sin convergencia confirmada: ${result.optimizer_message}`}
          </Notice>
        </Card>
      </div>
      <Card className="spaced">
        <CardHeading
          tag="READ THE RESULT CORRECTLY"
          title="Best valid sample vs. most likely sample."
        />
        <div className="lab-grid">
          <div>
            <span className="eyebrow">BEST VALID OBSERVED</span>
            {result.best ? (
              <AssignmentView data={result.best} />
            ) : (
              <Notice>
                No hubo una muestra válida. Aumentá shots, evaluaciones o reps y
                repetí; no hay garantía de éxito.
              </Notice>
            )}
          </div>
          <div>
            <span className="eyebrow">MOST LIKELY OBSERVED</span>
            <AssignmentView data={result.most_likely} />
            <p className="caption">
              Frecuencia: {(result.most_likely.probability! * 100).toFixed(1)}%.
              Puede ser inválida o no ser la más barata.
            </p>
          </div>
        </div>
        <details className="details">
          <summary>Todos los samples, parámetros y circuito</summary>
          <pre>
            {JSON.stringify(
              { parameters: result.parameters, rows: result.rows },
              null,
              2,
            )}
          </pre>
          <pre>{result.circuit}</pre>
        </details>
      </Card>
    </>
  );
}
export function OptimizationLab({
  mode = "classical",
  embedded = false,
}: {
  mode?: string;
  embedded?: boolean;
}) {
  const [costs, setCosts] = useState([
      [4, 7],
      [6, 2],
      [3, 5],
    ]),
    [customPenalty, setCustomPenalty] = useState(0),
    [reps, setReps] = useState(1),
    [iterations, setIterations] = useState(40),
    [shots, setShots] = useState(1000);
  const classical = useRequest<ClassicalResult>(),
    qubo = useRequest<QuboResult>(),
    qaoa = useRequest<QaoaResult>();
  const busy = classical.busy || qubo.busy || qaoa.busy,
    penalty = customPenalty || costs.flat().reduce((a, b) => a + b, 0) + 1;
  const body = { costs, penalty, reps, iterations, shots, seed: 42 };
  function clear() {
    classical.clear();
    qubo.clear();
    qaoa.clear();
  }
  async function run() {
    if (mode === "qubo")
      await qubo.run("optimization/qubo", { ...body, bitstring: "010101" });
    else if (mode === "qaoa") {
      if (await qaoa.run("optimization/qaoa", body)) recordRun();
    } else if (mode === "compare") {
      const result = await Promise.all([
        classical.run("optimization/classical", body),
        qaoa.run("optimization/qaoa", body),
      ]);
      if (result[1]) recordRun();
    } else await classical.run("optimization/classical", body);
  }
  const title =
    mode === "qubo"
      ? "QUBO Explorer"
      : mode === "qaoa"
        ? "QAOA Explorer"
        : mode === "compare"
          ? "Classical vs Quantum"
          : "The Optimization Lab";
  return (
    <>
      {!embedded && (
        <PageHeading
          eyebrow="FROM SOFTWARE PROBLEMS TO QUANTUM PROGRAMS"
          title={title}
          description="Modelá decisiones binarias, ejecutá un baseline y descubrí cómo funciona la optimización híbrida."
        />
      )}
      <div className="lab-tabs">
        {[
          ["classical", "Classical solver"],
          ["qubo", "QUBO & bitstrings"],
          ["qaoa", "QAOA explorer"],
          ["compare", "Compare results"],
        ].map(([id, t]) => (
          <TextLink
            key={id}
            href={id === "classical" ? "/optimization" : `/optimization/${id}`}
          >
            {mode === id ? <strong>{t}</strong> : t}
          </TextLink>
        ))}
      </div>
      <div className="lab-grid">
        <CostEditor
          costs={costs}
          disabled={busy}
          onChange={(c) => {
            setCosts(c);
            clear();
          }}
        />
        <Card>
          <CardHeading
            tag="EXPERIMENT SETTINGS"
            title="Make the model explicit."
          />
          <div className="optimization-settings">
            <label>
              Penalty P <span>(0 = automatic)</span>
              <input
                disabled={busy}
                type="number"
                min="0"
                max="10000"
                value={customPenalty}
                onChange={(e) => {
                  const p = Number(e.target.value);
                  if (p >= 0 && p <= 10000) {
                    setCustomPenalty(p);
                    clear();
                  }
                }}
              />
            </label>
            <label>
              Layers · p / reps
              <select
                disabled={busy}
                value={reps}
                onChange={(e) => {
                  setReps(Number(e.target.value));
                  clear();
                }}
              >
                {[1, 2, 3].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <label>
              Max evaluations
              <select
                disabled={busy}
                value={iterations}
                onChange={(e) => {
                  setIterations(Number(e.target.value));
                  clear();
                }}
              >
                {[20, 40, 80, 100].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <label>
              Final shots
              <select
                disabled={busy}
                value={shots}
                onChange={(e) => {
                  setShots(Number(e.target.value));
                  clear();
                }}
              >
                {[100, 1000, 10000].map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
          </div>
          <p className="caption">
            P = {penalty}. Automático: suma de los costos + 1. Seed = 42 para
            reproducibilidad. QAOA usa Qiskit, expectativas exactas, COBYLA y
            muestreo final con Aer.
          </p>
          <RunButton
            busy={busy}
            onClick={run}
            label={
              mode === "qubo"
                ? "Verify QUBO with Qiskit"
                : mode === "qaoa"
                  ? "Run QAOA"
                  : mode === "compare"
                    ? "Run both solvers"
                    : "Run classical solver"
            }
          />
          {(classical.error || qubo.error || qaoa.error) && (
            <Notice error>{classical.error || qubo.error || qaoa.error}</Notice>
          )}
        </Card>
      </div>
      {mode === "qubo" ? (
        <div className="spaced">
          <QuboExplorer costs={costs} penalty={penalty} verified={qubo.data} />
        </div>
      ) : mode === "qaoa" ? (
        qaoa.data ? (
          <QaoaOutput result={qaoa.data} />
        ) : (
          <Card className="spaced">
            <EmptyResult busy={busy} />
          </Card>
        )
      ) : mode === "compare" ? (
        <>
          <Notice>
            For small problems, classical solvers will generally be faster and
            more accurate. This demo is educational. Las evaluaciones de ambos
            métodos tienen costos distintos; sus números no son directamente
            equivalentes.
          </Notice>
          <div className="lab-grid spaced">
            <Card>
              <CardHeading tag="EXACT BASELINE" title="Classical brute force" />
              {classical.data ? (
                <>
                  <AssignmentView data={classical.data.best} />
                  <div className="mini-metrics">
                    <div>
                      <span>Total runtime</span>
                      <strong>
                        {classical.data.execution_ms.toFixed(2)} ms
                      </strong>
                    </div>
                    <div>
                      <span>Enumerated states</span>
                      <strong>64</strong>
                    </div>
                    <div>
                      <span>Exact optimum</span>
                      <strong>Yes</strong>
                    </div>
                  </div>
                  <p className="caption">
                    No shots: enumeración exhaustiva. Calidad de solución
                    exacta; no es una probabilidad de muestreo.
                  </p>
                </>
              ) : (
                <EmptyResult busy={busy} />
              )}
            </Card>
            <Card>
              <CardHeading
                tag="APPROXIMATE · SIMULATED"
                title="Quantum / QAOA"
              />
              {qaoa.data ? (
                <>
                  {qaoa.data.best ? (
                    <AssignmentView data={qaoa.data.best} />
                  ) : (
                    <Notice>No valid samples.</Notice>
                  )}
                  <div className="mini-metrics">
                    <div>
                      <span>Total runtime</span>
                      <strong>{qaoa.data.execution_ms.toFixed(1)} ms</strong>
                    </div>
                    <div>
                      <span>Evaluations</span>
                      <strong>{qaoa.data.evaluations}</strong>
                    </div>
                    <div>
                      <span>Best sample frequency</span>
                      <strong>
                        {((qaoa.data.best?.probability ?? 0) * 100).toFixed(1)}%
                      </strong>
                    </div>
                  </div>
                  <p className="caption">
                    {qaoa.data.shots} final shots. Runtime incluye circuito,
                    optimización clásica, transpilation y muestreo. No demuestra
                    quantum advantage.
                  </p>
                </>
              ) : (
                <EmptyResult busy={busy} />
              )}
            </Card>
          </div>
        </>
      ) : (
        <Card className="spaced">
          <CardHeading
            tag="ENUMERATE. VALIDATE. MINIMIZE."
            title="Every possibility on the table."
          />
          {classical.data ? (
            <>
              <AssignmentView data={classical.data.best} />
              <ClassicalTable result={classical.data} />
            </>
          ) : (
            <EmptyResult busy={busy} />
          )}
        </Card>
      )}
    </>
  );
}
