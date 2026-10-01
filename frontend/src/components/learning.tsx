"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Search,
  BookOpen,
  FlaskConical,
  Trophy,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import { groups, lessons, glossary, type Lesson } from "@/lib/curriculum";
import {
  completeLesson,
  recordRun,
  updateProgress,
  useProgress,
} from "@/lib/progress";
import { useRequest } from "@/lib/api";
import { generateCode } from "@/lib/quantum";
import type { QuantumResult } from "@/lib/types";
import {
  Button,
  Card,
  CardHeading,
  CodeBlock,
  Notice,
  PageHeading,
  RunButton,
  Result,
  TextLink,
} from "./ui";
import {
  CircuitBuilder,
  GateLab,
  IonQLab,
  LocalSimulator,
  QiskitRunner,
  TwoQubitLab,
} from "./labs";
import { OptimizationLab } from "./optimization";

export function LessonRow({ lesson }: { lesson: Lesson }) {
  const progress = useProgress(),
    done = progress.completed.includes(lesson.id);
  return (
    <Link
      href={`/learn/${lesson.id}`}
      className={`lesson-row ${done ? "complete" : ""}`}
    >
      <span className="lesson-number">
        {done ? <Check size={17} /> : String(lesson.id).padStart(2, "0")}
      </span>
      <div className="lesson-info">
        <h4>{lesson.title}</h4>
        <div>
          {lesson.concepts.slice(0, 3).map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
      </div>
      <span className="lesson-time">
        <Clock size={12} />
        {lesson.minutes} min
      </span>
      <span className="lesson-difficulty">
        {lesson.group === 0
          ? "Beginner"
          : lesson.group === 3
            ? "Applied"
            : "Intermediate"}
      </span>
      <span className={`lesson-status ${done ? "done" : ""}`}>
        {done
          ? "Completed"
          : lesson.id === progress.current
            ? "Up next"
            : "Not started"}
      </span>
      <ChevronRight className="row-chevron" size={17} />
    </Link>
  );
}
export function LearningPath() {
  const [filter, setFilter] = useState("All lessons"),
    [query, setQuery] = useState("");
  const p = useProgress();
  const shown = lessons.filter(
    (l) =>
      (l.title + " " + l.concepts.join(" "))
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter === "All lessons" ||
        (filter === "Completed" && p.completed.includes(l.id)) ||
        (filter === "To learn" && !p.completed.includes(l.id))),
  );
  return (
    <>
      <PageHeading
        eyebrow="YOUR LEARNING PATH"
        title="Start with a bit. Build something quantum."
        description="18 lecciones progresivas. Primero la intuición, después el circuito. Sin asumir conocimientos de física."
      />
      <div className="path-progress">
        <div>
          <strong>
            {p.completed.length}{" "}
            <span>/ {lessons.length} lessons completed</span>
          </strong>
          <span>
            {Math.round((p.completed.length / lessons.length) * 100)}%
          </span>
        </div>
        <div className="progress-track">
          <div
            style={{ width: `${(p.completed.length / lessons.length) * 100}%` }}
          />
        </div>
      </div>
      <div className="list-toolbar">
        <div className="filter-tabs">
          {["All lessons", "To learn", "Completed"].map((t) => (
            <button
              key={t}
              className={filter === t ? "active" : ""}
              onClick={() => setFilter(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <label className="search-field">
          <Search size={15} />
          <input
            aria-label="Search lessons"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a lesson…"
          />
        </label>
      </div>
      {groups.map((g, i) => {
        const rows = shown.filter((l) => l.group === i);
        return rows.length ? (
          <section className="path-group" key={g.title}>
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  CHAPTER 0{i + 1} · {g.range}
                </span>
                <h2>{g.title}</h2>
                <p>{g.subtitle}</p>
              </div>
              <span className="badge">{rows.length} lessons</span>
            </div>
            <div className="lesson-list">
              {rows.map((l) => (
                <LessonRow lesson={l} key={l.id} />
              ))}
            </div>
          </section>
        ) : null;
      })}
      {!shown.length && (
        <Card>
          <p>No hay lecciones que coincidan con la búsqueda.</p>
        </Card>
      )}
    </>
  );
}
function Quiz({ lesson }: { lesson: Lesson }) {
  const [selected, setSelected] = useState<number | null>(null),
    [submitted, setSubmitted] = useState(false);
  const progress = useProgress(),
    correct = selected === lesson.answer;
  return (
    <Card className="quiz-card">
      <CardHeading tag="CHECK YOUR UNDERSTANDING" title={lesson.question} />
      <div className="quiz-options">
        {lesson.options.map((option, i) => (
          <button
            key={option}
            onClick={() => {
              setSelected(i);
              setSubmitted(false);
            }}
            className={`${selected === i ? "selected" : ""} ${submitted && selected === i ? (correct ? "correct" : "incorrect") : ""}`}
          >
            <span>{String.fromCharCode(65 + i)}</span>
            {option}
            {submitted && i === selected && correct && (
              <CheckCircle2 size={18} />
            )}
          </button>
        ))}
      </div>
      <Button
        disabled={selected === null}
        secondary
        onClick={() => {
          setSubmitted(true);
          updateProgress((p) => ({
            ...p,
            quizzes: {
              ...p.quizzes,
              [lesson.id]: selected === lesson.answer ? 1 : 0,
            },
          }));
        }}
      >
        Check answer
      </Button>
      {submitted && (
        <Notice error={!correct}>
          <strong>{correct ? "Correct. " : "Todavía no. "}</strong>
          {lesson.feedback}
          {!correct && " Podés elegir otra respuesta y volver a intentar."}
        </Notice>
      )}
      <div className="lesson-complete-action">
        <p>
          {progress.completed.includes(lesson.id)
            ? "Lección completada. Podés volver a experimentar cuando quieras."
            : "Explorá el experimento y aprobá el quiz para guardar tu progreso."}
        </p>
        <Button
          disabled={!submitted || !correct}
          onClick={() => completeLesson(lesson.id, 1)}
        >
          <Check size={16} />
          {progress.completed.includes(lesson.id)
            ? "Completed"
            : "Mark lesson complete"}
        </Button>
      </div>
    </Card>
  );
}
function LessonDemo({ lesson }: { lesson: Lesson }) {
  if ([1, 7, 8].includes(lesson.id))
    return <TwoQubitLab key={lesson.id} bell={lesson.id === 8} />;
  if (lesson.id === 6) return <CircuitBuilder />;
  if (lesson.id === 10) return <LocalSimulator embedded />;
  if (lesson.id === 11) return <QiskitRunner />;
  if (lesson.id === 12) return <IonQLab />;
  if (lesson.id === 18)
    return (
      <Card>
        <CardHeading
          tag="YOUR FIRST PROJECT"
          title="Turn a circuit into an experiment."
        />
        <p>
          Usá el checklist para identificar tus próximos pasos. Elegí un
          problema, registrá parámetros y prepará una demo que explique
          resultados y limitaciones.
        </p>
        <TextLink href="/readiness">Open your hackathon checklist</TextLink>
        <div className="spaced">
          <TextLink href="/optimization/compare">
            Run a reproducible comparison
          </TextLink>
        </div>
      </Card>
    );
  if ([13, 14, 15, 16, 17].includes(lesson.id))
    return (
      <OptimizationLab
        embedded
        mode={
          lesson.id === 14
            ? "qubo"
            : lesson.id === 15
              ? "qaoa"
              : lesson.id >= 16
                ? "compare"
                : "classical"
        }
      />
    );
  return (
    <GateLab
      key={lesson.id}
      mode={
        lesson.id === 9
          ? "parameters"
          : lesson.id === 3 || lesson.id === 5
            ? "measurement"
            : "gates"
      }
    />
  );
}
export function LessonPage({ id }: { id: number }) {
  const lesson = lessons.find((l) => l.id === id);
  const [technical, setTechnical] = useState(false);
  useEffect(() => {
    if (id >= 1 && id <= 18)
      updateProgress((p) => (p.current === id ? p : { ...p, current: id }));
  }, [id]);
  if (!lesson)
    return (
      <>
        <PageHeading
          eyebrow="LESSON NOT FOUND"
          title="This chapter hasn’t been written."
          description="Elegí una de las 18 lecciones disponibles."
        />
        <TextLink href="/learn">Back to learning path</TextLink>
      </>
    );
  return (
    <>
      <div className="lesson-breadcrumb">
        <Link href="/learn">Learning path</Link>
        <ChevronRight size={13} />
        <span>Lesson {String(id).padStart(2, "0")}</span>
      </div>
      <PageHeading
        eyebrow={`CHAPTER ${lesson.group + 1} / LESSON ${String(id).padStart(2, "0")}`}
        title={lesson.title}
        description={`${lesson.minutes} min · ${lesson.group === 0 ? "Beginner" : "Intermediate"} · ${lesson.concepts.join(" / ")}`}
      />
      <nav className="lesson-anchor-nav">
        {[
          ["concept", "Concept"],
          ["visual", "Visual"],
          ["code", "Code"],
          ["experiment", "Experiment"],
          ["exercise", "Exercise"],
          ["quiz", "Quiz"],
        ].map(([href, label], i) => (
          <a key={href} href={`#${href}`}>
            <span>0{i + 1}</span>
            {label}
          </a>
        ))}
      </nav>
      <div className="lesson-theory" id="concept">
        <Card>
          <CardHeading
            tag="01 / THE CONCEPT"
            title="Understand what’s happening."
          />
          <p className="concept-text">{lesson.concept}</p>
          <div className="explain-tabs">
            <Button
              small
              secondary
              onClick={() => setTechnical(false)}
              disabled={!technical}
            >
              Explain simply
            </Button>
            <Button
              small
              secondary
              onClick={() => setTechnical(true)}
              disabled={technical}
            >
              Explain technically
            </Button>
          </div>
          <div className="intuition-box">
            <span className="eyebrow">
              {technical ? "UNDER THE HOOD" : "THE DEVELOPER INTUITION"}
            </span>
            <p>{technical ? lesson.technical : lesson.intuition}</p>
          </div>
        </Card>
        <Card className="visual-explanation">
          <div id="visual">
            <CardHeading tag="02 / MAKE IT VISIBLE" title="The mental model." />
            <div className="concept-diagram">
              {lesson.visual.split("→").map((part, i) => (
                <div key={i}>
                  <span>{part.trim()}</span>
                  {i < lesson.visual.split("→").length - 1 && (
                    <ArrowRight size={20} />
                  )}
                </div>
              ))}
            </div>
            <div className="concept-tags">
              {lesson.concepts.map((c) => (
                <Link href={`/glossary?q=${encodeURIComponent(c)}`} key={c}>
                  {c}
                  <ArrowUpRight size={12} />
                </Link>
              ))}
            </div>
          </div>
        </Card>
      </div>
      <section id="code" className="lesson-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">03 / READ THE CODE</span>
            <h2>Turn the idea into instructions.</h2>
            <p>Pasá sobre cada línea para ver su explicación.</p>
          </div>
        </div>
        <CodeBlock code={lesson.code} tooltips />
      </section>
      <section id="experiment" className="lesson-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">04 / EXPERIMENT</span>
            <h2>Make a prediction. Then run it.</h2>
            <p>{lesson.experiment}</p>
          </div>
          <TextLink href={lesson.lab}>Open full lab</TextLink>
        </div>
        <LessonDemo lesson={lesson} />
      </section>
      <section id="exercise" className="lesson-section">
        <Card>
          <CardHeading
            tag="05 / YOUR TURN"
            title="Think like a quantum developer."
          />
          <p className="concept-text">{lesson.exercise}</p>
          <details className="details">
            <summary>Una pista para empezar</summary>
            <p>
              {lesson.takeaways[0]} Volvé a la visualización, cambiá una sola
              variable y compará con tu predicción.
            </p>
          </details>
        </Card>
      </section>
      <section id="quiz" className="lesson-section">
        <Quiz key={id} lesson={lesson} />
      </section>
      <Card className="takeaways">
        <CardHeading tag="TAKE IT WITH YOU" title="Key takeaways" />
        {lesson.takeaways.map((t) => (
          <p key={t}>
            <Check size={15} />
            {t}
          </p>
        ))}
      </Card>
      <div className="lesson-next">
        {id > 1 ? (
          <TextLink href={`/learn/${id - 1}`}>Previous lesson</TextLink>
        ) : (
          <span />
        )}
        {id < 18 ? (
          <Link className="button" href={`/learn/${id + 1}`}>
            Next: {lessons[id].title}
            <ArrowRight size={16} />
          </Link>
        ) : (
          <Link className="button" href="/readiness">
            Your hackathon readiness
            <ArrowRight size={16} />
          </Link>
        )}
      </div>
    </>
  );
}
export function GlossaryPage({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery),
    [technical, setTechnical] = useState(false);
  const filtered = glossary.filter((g) =>
    (g.term + " " + g.definition).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="THE QUANTUM VOCABULARY"
        title="New concepts. Clear definitions."
        description="Un glosario para developers: intuición cuando la necesitás y detalle cuando querés ir más lejos."
      />
      <div className="list-toolbar">
        <label className="search-field large">
          <Search size={17} />
          <input
            autoFocus
            value={query}
            aria-label="Search glossary"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search qubit, amplitude, QAOA…"
          />
        </label>
        <Button secondary small onClick={() => setTechnical(!technical)}>
          {technical ? "Explain simply" : "Explain technically"}
        </Button>
      </div>
      <p className="caption">
        {filtered.length} of {glossary.length} terms
      </p>
      <div className="glossary-grid">
        {filtered.map((g) => (
          <Card key={g.term}>
            <span className="glossary-letter">
              {g.term.charAt(0).toUpperCase()}
            </span>
            <h3>{g.term}</h3>
            <p>{technical ? g.technical : g.definition}</p>
          </Card>
        ))}
      </div>
      {!filtered.length && (
        <Card>
          <p>No encontramos ese término. Probá otro nombre o sigla.</p>
        </Card>
      )}
    </>
  );
}
type Challenge = {
  id: number;
  title: string;
  description: string;
  kind: "code" | "quiz";
  starter?: string;
  question?: string;
  options?: string[];
  answer?: number;
  feedback: string;
  validate?: (r: QuantumResult) => boolean;
};
const challenges: Challenge[] = [
  {
    id: 1,
    title: "Create superposition",
    description:
      "Prepará un qubit con probabilidades ideales de 50% para 0 y 1.",
    kind: "code",
    starter: generateCode(1, []),
    validate: (r) => Math.abs((r.exact_probabilities?.["0"] ?? 0) - 0.5) < 1e-6,
    feedback:
      "H|0⟩ crea amplitudes 1/√2 para ambos estados; la probabilidad es 1/2.",
  },
  {
    id: 2,
    title: "Flip a qubit",
    description: "Partí de |0⟩ y obtené |1⟩ con certeza.",
    kind: "code",
    starter: generateCode(1, []),
    validate: (r) => (r.exact_probabilities?.["1"] ?? 0) > 0.999999,
    feedback: "X invierte |0⟩ y |1⟩. Agregá qc.x(0) antes de medir.",
  },
  {
    id: 3,
    title: "Build a Bell State",
    description:
      "Usá H y CX para preparar el Bell |Φ+⟩ = (|00⟩ + |11⟩)/√2, incluyendo su fase relativa.",
    kind: "code",
    starter: generateCode(2, []),
    validate: (r) => {
      const a = r.statevector;
      if (!a || a.length !== 4) return false;
      return (
        Math.abs(Math.hypot(a[0].real, a[0].imag) - Math.SQRT1_2) < 1e-6 &&
        Math.hypot(a[1].real, a[1].imag) < 1e-6 &&
        Math.hypot(a[2].real, a[2].imag) < 1e-6 &&
        Math.hypot(a[0].real - a[3].real, a[0].imag - a[3].imag) < 1e-6
      );
    },
    feedback:
      "Aplicá qc.h(0) y qc.cx(0,1). El estado completo tiene amplitudes iguales y en fase en 00 y 11.",
  },
  {
    id: 4,
    title: "Predict measurement",
    description: "Razoná antes de ejecutar.",
    kind: "quiz",
    question: "Después de H → H sobre |0⟩, ¿qué medís?",
    options: ["0 con certeza", "1 con certeza", "50/50"],
    answer: 0,
    feedback: "H²=I. La interferencia recupera el estado inicial.",
  },
  {
    id: 5,
    title: "Fix a broken circuit",
    description:
      "El control de CX no puede ser igual al target. Repará el código para producir |Φ+⟩.",
    kind: "code",
    starter:
      "from qiskit import QuantumCircuit\nqc = QuantumCircuit(2, 2)\nqc.h(0)\nqc.cx(0, 0)\nqc.measure_all()",
    validate: (r) => {
      const a = r.statevector;
      return (
        !!a &&
        a.length === 4 &&
        Math.abs(Math.hypot(a[0].real, a[0].imag) - Math.SQRT1_2) < 1e-6 &&
        Math.hypot(a[1].real, a[1].imag) < 1e-6 &&
        Math.hypot(a[2].real, a[2].imag) < 1e-6 &&
        Math.hypot(a[0].real - a[3].real, a[0].imag - a[3].imag) < 1e-6
      );
    },
    feedback:
      "Usá qc.cx(0,1): control q0 y target q1. Las dos amplitudes Bell deben estar en fase.",
  },
  {
    id: 6,
    title: "Understand shots",
    description:
      "Interpretá una muestra sin confundirla con la distribución ideal.",
    kind: "quiz",
    question: "498 ceros en 1000 shots significa…",
    options: [
      "P(0) exacta = 0.498",
      "Frecuencia observada = 49.8%",
      "El circuito es incorrecto",
    ],
    answer: 1,
    feedback:
      "Counts / shots estima probabilidades. El muestreo finito puede diferir de la probabilidad ideal.",
  },
  {
    id: 7,
    title: "Decode a bitstring",
    description: "Usá la convención Qiskit y las seis variables del modelo.",
    kind: "quiz",
    question: "010101 (q5…q0) asigna A, B y C a…",
    options: ["Server 2, todas", "Server 1, todas", "Ambos servidores"],
    answer: 1,
    feedback: "Los bits derechos q0, q2 y q4 son 1: x_A_1, x_B_1 y x_C_1.",
  },
  {
    id: 8,
    title: "Build a QUBO",
    description: "Transformá la regla exactly once en una penalidad.",
    kind: "quiz",
    question: "¿Qué penalidad es cero solo si x₁+x₂=1?",
    options: ["P(x₁+x₂)", "P(x₁+x₂−1)²", "P·x₁·x₂ solamente"],
    answer: 1,
    feedback:
      "El cuadrado vale 0 para exactamente una asignación, y P para cero o dos asignaciones.",
  },
  {
    id: 9,
    title: "Interpret QAOA output",
    description: "Diferenciá popularidad de calidad.",
    kind: "quiz",
    question: "El bitstring más frecuente en QAOA…",
    options: [
      "Siempre es el óptimo",
      "Puede ser inválido o más caro que otra muestra",
      "Demuestra ventaja",
    ],
    answer: 1,
    feedback:
      "La distribución es aproximada. Validá restricciones y evaluá costos de cada muestra.",
  },
  {
    id: 10,
    title: "Compare classical vs quantum",
    description: "Escribí conclusiones con evidencia.",
    kind: "quiz",
    question:
      "QAOA y brute force encuentran costo 9. ¿Qué concluye el experimento?",
    options: [
      "Hay quantum advantage",
      "Coinciden en calidad en esta instancia; falta comparar recursos",
      "QAOA escala mejor",
    ],
    answer: 1,
    feedback:
      "Una igualdad de costo en un ejemplo pequeño no permite extrapolar rendimiento o ventaja cuántica.",
  },
];
function ChallengeDetail({ challenge }: { challenge: Challenge }) {
  const [code, setCode] = useState(challenge.starter ?? ""),
    [selected, setSelected] = useState<number | null>(null),
    [feedback, setFeedback] = useState<boolean | null>(null);
  const api = useRequest<QuantumResult>();
  function save(correct: boolean) {
    setFeedback(correct);
    if (correct)
      updateProgress((p) => ({
        ...p,
        challenges: [...new Set([...p.challenges, challenge.id])],
      }));
  }
  async function run() {
    const result = await api.run("quantum/code", {
      code,
      shots: 1000,
      seed: 42,
    });
    if (result) {
      recordRun();
      save(challenge.validate?.(result) ?? false);
    }
  }
  return (
    <Card className="challenge-detail">
      <CardHeading
        tag={`CHALLENGE ${String(challenge.id).padStart(2, "0")} / ${challenge.kind === "code" ? "CODE" : "REASONING"}`}
        title={challenge.title}
      />
      <p className="concept-text">{challenge.description}</p>
      {challenge.kind === "code" ? (
        <>
          <label className="sr-only" htmlFor="challenge-code">
            Challenge code
          </label>
          <textarea
            id="challenge-code"
            className="code-editor"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setFeedback(null);
              api.clear();
            }}
            maxLength={6000}
            spellCheck={false}
          />
          <RunButton
            busy={api.busy}
            onClick={run}
            label="Run & check challenge"
          />
          {api.error && <Notice error>{api.error}</Notice>}
          {api.data && <Result data={api.data} />}
        </>
      ) : (
        <>
          <h3>{challenge.question}</h3>
          <div className="quiz-options">
            {challenge.options?.map((o, i) => (
              <button
                className={selected === i ? "selected" : ""}
                key={o}
                onClick={() => {
                  setSelected(i);
                  setFeedback(null);
                }}
              >
                <span>{String.fromCharCode(65 + i)}</span>
                {o}
              </button>
            ))}
          </div>
          <Button
            secondary
            disabled={selected === null}
            onClick={() => save(selected === challenge.answer)}
          >
            Check answer
          </Button>
        </>
      )}
      {feedback !== null && (
        <Notice error={!feedback}>
          <strong>
            {feedback
              ? "Correct. Challenge completed! "
              : "La solución todavía no cumple el objetivo. "}
          </strong>
          {challenge.feedback}
        </Notice>
      )}
    </Card>
  );
}
export function ChallengesPage() {
  const [active, setActive] = useState(1);
  const p = useProgress();
  return (
    <>
      <PageHeading
        eyebrow="LEARN BY SOLVING"
        title="Small challenges. Real understanding."
        description="10 desafíos de código y razonamiento. Ejecutá, interpretá y guardá cada logro."
        action={
          <span className="badge green">
            {p.challenges.length} / 10 completed
          </span>
        }
      />
      <div className="challenges-layout">
        <div className="challenge-list">
          {challenges.map((c) => (
            <button
              className={active === c.id ? "active" : ""}
              key={c.id}
              onClick={() => setActive(c.id)}
            >
              <span>
                {p.challenges.includes(c.id) ? (
                  <Check size={16} />
                ) : (
                  String(c.id).padStart(2, "0")
                )}
              </span>
              <div>
                <strong>{c.title}</strong>
                <small>
                  {c.kind === "code" ? "Coding challenge" : "Concept challenge"}
                </small>
              </div>
              <ChevronRight size={14} />
            </button>
          ))}
        </div>
        <ChallengeDetail key={active} challenge={challenges[active - 1]} />
      </div>
    </>
  );
}
export const readinessItems = [
  "I understand qubits",
  "I understand measurement",
  "I understand gates",
  "I can read a circuit",
  "I understand Bell States",
  "I can use Qiskit",
  "I understand backends",
  "I ran a circuit locally",
  "I ran a circuit on IonQ Simulator",
  "I understand QUBO",
  "I understand QAOA",
  "I can explain classical vs quantum",
  "I can build a small quantum project",
];
export function ReadinessPage() {
  const p = useProgress(),
    percent = Math.round((p.readiness.length / readinessItems.length) * 100);
  return (
    <>
      <PageHeading
        eyebrow="THE NEXT CHAPTER IS YOURS"
        title="Quantum Hackathon Readiness"
        description="Un checklist honesto para identificar lo que ya dominás y lo que todavía conviene practicar."
      />
      <div className="readiness-hero">
        <div
          className="readiness-ring"
          style={{
            background: `conic-gradient(var(--accent) ${percent}%, var(--border) 0)`,
          }}
        >
          <div>
            <strong>{percent}%</strong>
            <span>ready to build</span>
          </div>
        </div>
        <div>
          <span className="eyebrow">SELF-ASSESSMENT</span>
          <h2>Understanding comes from doing.</h2>
          <p>
            Marcá cada habilidad cuando puedas explicarla o demostrarla. Tu
            checklist se guarda localmente; no es una certificación.
          </p>
          <div className="readiness-stats">
            <span>
              <BookOpen size={15} />
              {p.completed.length} lessons
            </span>
            <span>
              <FlaskConical size={15} />
              {p.runs} runs
            </span>
            <span>
              <Trophy size={15} />
              {p.challenges.length} challenges
            </span>
          </div>
        </div>
      </div>
      <Card>
        {readinessItems.map((item, i) => (
          <label className="readiness-item" key={item}>
            <input
              type="checkbox"
              checked={p.readiness.includes(item)}
              onChange={(e) =>
                updateProgress((p) => ({
                  ...p,
                  readiness: e.target.checked
                    ? [...new Set([...p.readiness, item])]
                    : p.readiness.filter((r) => r !== item),
                }))
              }
            />
            <span>{item}</span>
            {i === 7 && <small>{p.runs} successful runs recorded</small>}
            {i === 8 && <small>{p.ionqRuns} IonQ runs recorded</small>}
          </label>
        ))}
      </Card>
      <div className="section-heading spaced">
        <div>
          <span className="eyebrow">PROJECT IDEAS</span>
          <h2>Choose your next experiment.</h2>
        </div>
      </div>
      <div className="lab-grid">
        <Card>
          <CardHeading
            tag="QUANTUM IMPACT"
            title="Solve a problem that matters."
          />
          <p>
            Empezá con task scheduling o cloud resource allocation: agregá
            capacidad, SLA y costos de migración al QUBO. Compará con MILP,
            heurísticas y brute force en instancias pequeñas.
          </p>
          <ul className="idea-list">
            <li>Task scheduling & cloud optimization</li>
            <li>Routing & attack-path optimization</li>
            <li>Portfolio optimization & feature selection</li>
          </ul>
          <TextLink href="/optimization">
            Start with the optimization lab
          </TextLink>
        </Card>
        <Card>
          <CardHeading
            tag="QUANTUM UNLOCKED"
            title="Make quantum ideas accessible."
          />
          <p>
            Convertí el builder en un visualizador compartible. Mostrá
            amplitudes, fases y mediciones paso a paso para enseñar sin esconder
            el algoritmo.
          </p>
          <ul className="idea-list">
            <li>Quantum circuit visualizer</li>
            <li>QAOA & entanglement explorers</li>
            <li>Quantum networking playground</li>
          </ul>
          <TextLink href="/playground/circuit">
            Start with the circuit builder
          </TextLink>
        </Card>
      </div>
    </>
  );
}
