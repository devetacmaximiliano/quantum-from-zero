"use client";
import { useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  Check,
  Copy,
  LoaderCircle,
  Terminal,
  Lightbulb,
} from "lucide-react";
import Link from "next/link";
import type { Gate, QuantumResult } from "@/lib/types";
import { type Complex, norm } from "@/lib/quantum";

export function Button({
  children,
  onClick,
  secondary = false,
  disabled = false,
  small = false,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  secondary?: boolean;
  disabled?: boolean;
  small?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`button ${secondary ? "secondary" : ""} ${small ? "small" : ""}`}
    >
      {children}
    </button>
  );
}
export function RunButton({
  busy,
  onClick,
  label = "Run locally",
}: {
  busy: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <Button disabled={busy} onClick={onClick}>
      {busy ? (
        <LoaderCircle className="spin" size={16} />
      ) : (
        <span className="play-icon" aria-hidden="true">
          ▶
        </span>
      )}
      {busy ? "Ejecutando…" : label}
    </Button>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`card ${className}`}>{children}</section>;
}
export function CardHeading({
  tag,
  title,
  aside,
}: {
  tag?: string;
  title: string;
  aside?: ReactNode;
}) {
  return (
    <div className="card-heading">
      <div>
        {tag && <span className="eyebrow">{tag}</span>}
        <h3>{title}</h3>
      </div>
      {aside}
    </div>
  );
}
export function Notice({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <div
      className={`notice ${error ? "error" : ""}`}
      role={error ? "alert" : undefined}
    >
      <Lightbulb size={17} />
      <div>{children}</div>
    </div>
  );
}
export function EmptyResult({ busy = false }: { busy?: boolean }) {
  return (
    <div className="empty-result">
      {busy ? (
        <LoaderCircle className="spin" size={27} />
      ) : (
        <Terminal size={27} />
      )}
      <h4>
        {busy
          ? "Tu circuito está en ejecución"
          : "El experimento empieza con vos"}
      </h4>
      <p>
        {busy
          ? "El backend está calculando los resultados reales."
          : "Ejecutá el circuito para ver counts, frecuencias y tiempo."}
      </p>
    </div>
  );
}
export function Histogram({
  values,
  counts,
  title = "Measurement probabilities",
}: {
  values: Record<string, number>;
  counts?: Record<string, number>;
  title?: string;
}) {
  const entries = Object.entries(values).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );
  return (
    <div className="histogram">
      <div className="plot-label">
        {title}
        <span>{counts ? "OBSERVED" : "IDEAL PREVIEW"}</span>
      </div>
      {entries.map(([state, p], i) => (
        <div className="hist-row" key={state}>
          <span className="mono">|{state}⟩</span>
          <div className="hist-track">
            <div
              className={`hist-fill ${i % 2 ? "lavender" : ""}`}
              style={{ width: `${Math.max(0, Math.min(100, p * 100))}%` }}
            />
          </div>
          <strong>{(p * 100).toFixed(1)}%</strong>
          {counts && <small>{counts[state] ?? 0}</small>}
        </div>
      ))}
    </div>
  );
}
export function Result({ data }: { data: QuantumResult }) {
  return (
    <>
      <div className="result-meta">
        <span className="status-dot" />
        <span>{data.backend}</span>
        <span>{data.shots.toLocaleString("en-US")} shots</span>
        <span>{data.execution_ms.toFixed(1)} ms</span>
      </div>
      <Histogram
        values={data.probabilities}
        counts={data.counts}
        title="Observed frequencies"
      />
      {data.exact_probabilities && (
        <p className="caption">
          Counts / shots son frecuencias observadas. La vista previa ideal
          describe el estado antes de medir.
        </p>
      )}
      <details className="details">
        <summary>Ver counts y circuito ejecutado</summary>
        <pre>{JSON.stringify(data.counts, null, 2)}</pre>
        <pre>{data.circuit}</pre>
      </details>
      {data.job_id && <p className="caption">Job: {data.job_id}</p>}
    </>
  );
}
function highlight(line: string) {
  const tokens = line.split(
    /(#[^\n]*|\b(?:from|import|for|in|True|False|None)\b|\b\d+(?:\.\d+)?\b|"[^"\n]*")/g,
  );
  return tokens.map((token, i) => (
    <span
      key={i}
      className={
        token.startsWith("#")
          ? "code-comment"
          : /^(from|import|for|in|True|False|None)$/.test(token)
            ? "code-keyword"
            : /^\d/.test(token)
              ? "code-number"
              : token.startsWith('"')
                ? "code-string"
                : ""
      }
    >
      {token}
    </span>
  ));
}
export function CodeBlock({
  code,
  title = "experiment.py",
  tooltips = false,
}: {
  code: string;
  title?: string;
  tooltips?: boolean;
}) {
  const [copied, setCopied] = useState(false),
    [failed, setFailed] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setFailed(true);
    }
  }
  function tip(line: string) {
    if (line.includes("QuantumCircuit("))
      return "QuantumCircuit(n, n): n qubits y n bits clásicos.";
    if (line.includes("measure"))
      return "Medición: guardar resultados clásicos. q0 corresponde al bit derecho.";
    if (line.includes(".h(")) return "Hadamard: crear o recombinar amplitudes.";
    if (line.includes(".cx("))
      return "CX(control, target): invertir target condicionado al control.";
    if (line.includes("transpile"))
      return "Adaptar las instrucciones al backend.";
    if (line.includes(".run("))
      return "Enviar el circuito al backend con la cantidad de shots.";
    return "Código Python para ejecutar con el SDK local; el editor web admite un subconjunto.";
  }
  return (
    <div className="code-block">
      <div className="code-header">
        <span>
          <span className="file-dot" />
          {title}
        </span>
        <button onClick={copy} aria-label="Copiar código">
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span>
            {copied ? "Copiado" : failed ? "Seleccioná el código" : "Copy"}
          </span>
        </button>
      </div>
      <pre>
        {code.split("\n").map((line, i) => (
          <div
            className="code-line"
            key={i}
            title={tooltips ? tip(line) : undefined}
            tabIndex={tooltips ? 0 : undefined}
            aria-label={tooltips ? `${line}. ${tip(line)}` : undefined}
          >
            <span className="line-no">{i + 1}</span>
            <code>{highlight(line) || " "}</code>
          </div>
        ))}
      </pre>
    </div>
  );
}
export function CircuitDiagram({
  qubits,
  gates,
  onDrop,
}: {
  qubits: number;
  gates: Gate[];
  onDrop?: (type: string, target: number) => void;
}) {
  const width = Math.max(360, 110 + gates.length * 68),
    height = qubits * 64 + 32;
  return (
    <div className="circuit-scroll">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ minWidth: width }}
        role="img"
        aria-label={`Circuito de ${qubits} qubits: ${gates.map((g) => `${g.type} en q${g.target}`).join(", ") || "vacío"}`}
      >
        {Array.from({ length: qubits }, (_, q) => (
          <g
            key={q}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onDrop?.(e.dataTransfer.getData("gate"), q);
            }}
          >
            <rect
              x="50"
              y={q * 64 + 10}
              width={width - 50}
              height="52"
              fill="transparent"
            />
            <text x="8" y={q * 64 + 44} className="circuit-label">
              q{q}
            </text>
            <line
              x1="48"
              x2={width - 16}
              y1={q * 64 + 38}
              y2={q * 64 + 38}
              stroke="#3e4247"
              strokeWidth="1.5"
            />
            <text x={width - 22} y={q * 64 + 42} className="circuit-label">
              →
            </text>
          </g>
        ))}
        {gates.map((gate, i) => {
          const x = 78 + i * 68,
            y = 38 + gate.target * 64;
          return (
            <g key={i}>
              {gate.type === "CX" ? (
                <>
                  <line
                    x1={x}
                    x2={x}
                    y1={38 + gate.control! * 64}
                    y2={y}
                    stroke="#b9a4eb"
                    strokeWidth="2"
                  />
                  <circle
                    cx={x}
                    cy={38 + gate.control! * 64}
                    r="5"
                    fill="#b9a4eb"
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r="15"
                    fill="#24202e"
                    stroke="#b9a4eb"
                  />
                  <line x1={x - 8} x2={x + 8} y1={y} y2={y} stroke="#b9a4eb" />
                  <line x1={x} x2={x} y1={y - 8} y2={y + 8} stroke="#b9a4eb" />
                </>
              ) : (
                <>
                  <rect
                    x={x - 20}
                    y={y - 20}
                    width="40"
                    height="40"
                    rx="8"
                    fill={gate.type === "H" ? "#24362c" : "#23212f"}
                    stroke={gate.type === "H" ? "#8fcba0" : "#9582b3"}
                  />
                  <text
                    x={x}
                    y={y + 5}
                    textAnchor="middle"
                    fill={gate.type === "H" ? "#b0ddbb" : "#c8b7e9"}
                    fontSize="13"
                    fontFamily="monospace"
                  >
                    {gate.type === "M" ? "↗" : gate.type}
                  </text>
                  {gate.angle !== undefined && (
                    <text
                      x={x}
                      y={y + 34}
                      textAnchor="middle"
                      fill="#92969d"
                      fontSize="9"
                    >
                      {gate.angle.toFixed(2)}
                    </text>
                  )}
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
export function BlochSphere({
  state,
  hero = false,
}: {
  state?: Complex[];
  hero?: boolean;
}) {
  const a = state?.[0] ?? { re: 1 / Math.sqrt(2), im: 0 },
    b = state?.[1] ?? { re: 1 / Math.sqrt(2), im: 0 };
  const x = 2 * (a.re * b.re + a.im * b.im),
    y = 2 * (a.re * b.im - a.im * b.re),
    z = norm(a) - norm(b);
  const px = 190 + x * 111 - y * 43,
    py = 178 - z * 132 + y * 27;
  return (
    <svg
      viewBox="0 0 380 360"
      className={`bloch ${hero ? "hero-bloch" : ""}`}
      role="img"
      aria-label={`Esfera de Bloch. Vector x=${x.toFixed(2)}, y=${y.toFixed(2)}, z=${z.toFixed(2)}`}
    >
      <defs>
        <radialGradient
          id={hero ? "sphereHero" : "sphereLab"}
          cx="34%"
          cy="25%"
          r="80%"
        >
          <stop offset="0" stopColor="#9acd9f" stopOpacity=".13" />
          <stop offset=".65" stopColor="#608573" stopOpacity=".03" />
          <stop offset="1" stopColor="#b1dac4" stopOpacity=".09" />
        </radialGradient>
        <linearGradient
          id={hero ? "vectorHero" : "vectorLab"}
          x1="0"
          y1="1"
          x2="1"
          y2="0"
        >
          <stop stopColor="#639975" />
          <stop offset="1" stopColor="#c5f2bb" />
        </linearGradient>
        <filter id={hero ? "glowHero" : "glowLab"}>
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>
      <circle
        cx="190"
        cy="178"
        r="133"
        fill={`url(#${hero ? "sphereHero" : "sphereLab"})`}
        stroke="#74927e"
        strokeOpacity=".35"
      />
      <ellipse
        cx="190"
        cy="178"
        rx="133"
        ry="43"
        fill="none"
        stroke="#89a994"
        strokeOpacity=".4"
      />
      <ellipse
        cx="190"
        cy="178"
        rx="49"
        ry="133"
        fill="none"
        stroke="#89a994"
        strokeOpacity=".25"
        transform="rotate(-28 190 178)"
      />
      <ellipse
        cx="190"
        cy="178"
        rx="87"
        ry="133"
        fill="none"
        stroke="#89a994"
        strokeOpacity=".17"
        transform="rotate(38 190 178)"
      />
      <ellipse
        cx="190"
        cy="118"
        rx="117"
        ry="33"
        fill="none"
        stroke="#89a994"
        strokeOpacity=".12"
      />
      <ellipse
        cx="190"
        cy="238"
        rx="117"
        ry="33"
        fill="none"
        stroke="#89a994"
        strokeOpacity=".12"
      />
      <path
        d="M190 20V331M34 178H343M98 239L279 119"
        stroke="#6b7c71"
        strokeWidth="1"
        strokeDasharray="3 5"
        opacity=".5"
      />
      <text x="178" y="15" fill="#dce4db" fontFamily="monospace" fontSize="15">
        |0⟩
      </text>
      <text x="179" y="352" fill="#a7b3a7" fontFamily="monospace" fontSize="15">
        |1⟩
      </text>
      <text x="345" y="184" fill="#87968b" fontSize="12">
        x
      </text>
      <text x="284" y="118" fill="#87968b" fontSize="12">
        y
      </text>
      <line
        x1="190"
        y1="178"
        x2={px}
        y2={py}
        stroke={`url(#${hero ? "vectorHero" : "vectorLab"})`}
        strokeWidth="2.5"
      />
      <circle
        cx={px}
        cy={py}
        r="10"
        fill="#bef0b8"
        opacity=".4"
        filter={`url(#${hero ? "glowHero" : "glowLab"})`}
      />
      <circle cx={px} cy={py} r="5" fill="#c3edb7" />
      <circle cx="190" cy="178" r="3" fill="#b1c6b8" />
      {hero && (
        <>
          <rect
            x="249"
            y="38"
            width="100"
            height="32"
            rx="8"
            fill="#1a211c"
            stroke="#35463a"
          />
          <text
            x="263"
            y="59"
            fill="#c1dfbd"
            fontSize="12"
            fontFamily="monospace"
          >
            |ψ⟩ = |+⟩
          </text>
          <rect
            x="15"
            y="254"
            width="128"
            height="46"
            rx="9"
            fill="#19201c"
            stroke="#34433a"
          />
          <text x="28" y="273" fill="#879e8d" fontSize="10">
            SUPERPOSITION
          </text>
          <text
            x="28"
            y="289"
            fill="#d3e2d2"
            fontSize="12"
            fontFamily="monospace"
          >
            P(0) = P(1) = ½
          </text>
        </>
      )}
    </svg>
  );
}
export function TextLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className="text-link">
      {children}
      <ArrowUpRight size={15} />
    </Link>
  );
}
