"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Code2,
  FlaskConical,
  GitBranch,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Moon,
  Orbit,
  Search,
  Settings2,
  Sun,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { lessons, groups, glossary } from "@/lib/curriculum";
import { useProgress } from "@/lib/progress";
import { request } from "@/lib/api";
import { BlochSphere, Card, CardHeading, Notice, TextLink } from "./ui";
import { GateLab, IonQInfo, LabPage, LocalSimulator } from "./labs";
import {
  ChallengesPage,
  GlossaryPage,
  LearningPath,
  LessonPage,
  LessonRow,
  ReadinessPage,
} from "./learning";
import { OptimizationLab } from "./optimization";

const links = [
  { title: "Overview", href: "/", icon: LayoutDashboard },
  { title: "Dashboard", href: "/dashboard", icon: GitBranch },
  { title: "Learning path", href: "/learn", icon: BookOpen, badge: "18" },
  { title: "Playground", href: "/playground/gates", icon: FlaskConical },
  { title: "Challenges", href: "/challenges", icon: Code2, badge: "10" },
  { title: "Glossary", href: "/glossary", icon: GraduationCap },
];
const infrastructure = [
  { title: "Local simulator", href: "/simulators/local", icon: Settings2 },
  { title: "IonQ & backends", href: "/ionq", icon: Orbit },
  { title: "Optimization", href: "/optimization", icon: GitBranch },
];
function Logo() {
  return (
    <Link href="/" className="logo">
      <span className="logo-mark">
        <Orbit size={24} strokeWidth={1.4} />
      </span>
      <div>
        quantum<span>from zero</span>
      </div>
    </Link>
  );
}
function Sidebar({
  path,
  open,
  onClose,
}: {
  path: string;
  open: boolean;
  onClose: () => void;
}) {
  const p = useProgress();
  function active(href: string) {
    return href === "/"
      ? path === "/"
      : href === "/playground/gates"
        ? path.startsWith("/playground")
        : path.startsWith(href);
  }
  return (
    <>
      <div
        className={`sidebar-backdrop ${open ? "open" : ""}`}
        onClick={onClose}
      />
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <Logo />
        <div className="workspace-switch">
          <span className="workspace-icon">Q</span>
          <div>
            Your quantum workspace<small>Personal learning space</small>
          </div>
          <ChevronDown size={13} />
        </div>
        <nav className="side-nav" aria-label="Main navigation">
          <span className="nav-label">WORKSPACE</span>
          {links.map((l) => (
            <Link
              href={l.href}
              onClick={onClose}
              key={l.title}
              className={active(l.href) ? "active" : ""}
            >
              <l.icon size={17} />
              <span>{l.title}</span>
              {l.badge && <small>{l.badge}</small>}
            </Link>
          ))}
          <span className="nav-label infrastructure-label">
            BUILD & EXPERIMENT
          </span>
          {infrastructure.map((l) => (
            <Link
              href={l.href}
              onClick={onClose}
              key={l.title}
              className={active(l.href) ? "active" : ""}
            >
              <l.icon size={17} />
              <span>{l.title}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Link href="/readiness" className="hackathon-card" onClick={onClose}>
            <div>
              <Trophy size={16} />
              <ArrowUpRight size={14} />
            </div>
            <strong>
              Your next hackathon
              <br />
              starts here.
            </strong>
            <p>From understanding to impact.</p>
            <span>
              Check your readiness
              <ArrowRight size={13} />
            </span>
          </Link>
          <div className="sidebar-progress">
            <div>
              <span>Your progress</span>
              <strong>{Math.round((p.completed.length / 18) * 100)}%</strong>
            </div>
            <div className="progress-track">
              <div style={{ width: `${(p.completed.length / 18) * 100}%` }} />
            </div>
            <small>{p.completed.length} of 18 lessons completed</small>
          </div>
          <div className="profile">
            <span className="avatar">D</span>
            <div>
              Developer<small>Learning, one qubit at a time</small>
            </div>
            <span className="local-label">LOCAL</span>
          </div>
        </div>
      </aside>
    </>
  );
}
function SearchDialog({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);
  const matches = [
    ...lessons.map((l) => ({
      title: l.title,
      tag: "LESSON",
      href: `/learn/${l.id}`,
    })),
    ...glossary.map((g) => ({
      title: g.term,
      tag: "GLOSSARY",
      href: `/glossary?q=${encodeURIComponent(g.term)}`,
    })),
    { title: "Circuit Builder", tag: "LAB", href: "/playground/circuit" },
    { title: "Qiskit Runner", tag: "LAB", href: "/playground/qiskit" },
    { title: "QAOA Explorer", tag: "LAB", href: "/optimization/qaoa" },
  ]
    .filter((r) => r.title.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 12);
  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div
        className="search-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Search the platform"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-input">
          <Search size={20} />
          <input
            autoFocus
            aria-label="Global search"
            placeholder="What do you want to understand?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={onClose} aria-label="Close search">
            <X size={17} />
          </button>
        </div>
        <div className="search-results">
          {matches.map((m) => (
            <Link href={m.href} key={m.href} onClick={onClose}>
              <span>
                <BookOpen size={15} />
                {m.title}
              </span>
              <small>{m.tag}</small>
            </Link>
          ))}
          {!matches.length && <p>No results. Try “qubit”, “Bell” or “QAOA”.</p>}
        </div>
        <div className="dialog-footer">
          Search lessons, concepts and labs<span>esc to close</span>
        </div>
      </div>
    </div>
  );
}
function Header({
  path,
  onMenu,
  theme,
  onTheme,
  onSearch,
}: {
  path: string;
  onMenu: () => void;
  theme: string;
  onTheme: () => void;
  onSearch: () => void;
}) {
  const [status, setStatus] = useState<"checking" | "online" | "offline">(
      "checking",
    ),
    [version, setVersion] = useState("");
  useEffect(() => {
    let cancelled = false;
    request<{ versions: Record<string, string> }>("health")
      .then((r) => {
        if (!cancelled) {
          setStatus("online");
          setVersion(
            `Qiskit ${r.versions.qiskit} · Aer ${r.versions["qiskit-aer"]}`,
          );
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("offline");
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const name =
    path === "/"
      ? "Overview"
      : path.startsWith("/learn/")
        ? "Lesson"
        : path.startsWith("/learn")
          ? "Learning path"
          : path.startsWith("/playground")
            ? "Playground"
            : path.startsWith("/optimization")
              ? "Optimization"
              : path.startsWith("/simulators")
                ? "Local simulator"
                : path.slice(1).charAt(0).toUpperCase() + path.slice(2);
  return (
    <header className="topbar">
      <button
        className="mobile-menu icon-button"
        aria-label="Open navigation"
        onClick={onMenu}
      >
        <Menu size={19} />
      </button>
      <div className="breadcrumbs">
        <span>Workspace</span>
        <ChevronRight size={13} />
        <strong>{name}</strong>
      </div>
      <div className="topbar-actions">
        <button className="global-search" onClick={onSearch}>
          <Search size={14} />
          <span>Search anything…</span>
          <kbd>Ctrl K</kbd>
        </button>
        <span
          className={`backend-status ${status}`}
          title={version || "Iniciá FastAPI en el puerto 8000"}
        >
          <span className="status-dot" />
          {status === "online"
            ? "Local simulator ready"
            : status === "checking"
              ? "Connecting…"
              : "Backend offline"}
        </span>
        <button
          onClick={onTheme}
          className="icon-button"
          aria-label={
            theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>
    </header>
  );
}
function MetricCards() {
  const p = useProgress();
  const concepts = [
    ...new Set(
      lessons
        .filter((l) => p.completed.includes(l.id))
        .flatMap((l) => l.concepts),
    ),
  ];
  return (
    <div className="metrics-row">
      {[
        {
          icon: BookOpen,
          value: `${p.completed.length} / 18`,
          label: "Lessons completed",
          sub: "Build your foundations",
        },
        {
          icon: Zap,
          value: concepts.length,
          label: "Concepts learned",
          sub: "A growing quantum vocabulary",
        },
        {
          icon: FlaskConical,
          value: p.runs,
          label: "Circuits executed",
          sub: "Real experiments with Qiskit",
        },
        {
          icon: Trophy,
          value: `${p.challenges.length} / 10`,
          label: "Challenges solved",
          sub: "Put understanding to the test",
        },
      ].map((m) => (
        <div className="metric-card" key={m.label}>
          <div className="metric-label">
            <span>{m.label}</span>
            <m.icon size={16} />
          </div>
          <strong>{m.value}</strong>
          <small>{m.sub}</small>
        </div>
      ))}
    </div>
  );
}
function Home() {
  const p = useProgress(),
    next = lessons[p.current - 1] ?? lessons[0];
  return (
    <>
      <div className="welcome-line">
        <span>
          <span className="status-dot" />
          YOUR QUANTUM JOURNEY STARTS HERE
        </span>
        <span>Built for developers. Made for discovery.</span>
      </div>
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-tag">
            <span className="tiny-orbit">✧</span> A NEW WAY TO THINK
          </div>
          <h1>
            Quantum
            <br />
            <span>from Zero.</span>
          </h1>
          <p className="hero-description">
            Learn quantum computing by building,
            <br className="desktop-break" /> experimenting and running real
            circuits.
          </p>
          <p className="hero-subtitle">
            A learning path for developers who already know software
            <br className="desktop-break" /> engineering but are new to quantum
            computing.
          </p>
          <div className="hero-actions">
            <Link href={`/learn/${p.current}`} className="button">
              {p.completed.length ? "Continue learning" : "Start learning"}
              <ArrowRight size={17} />
            </Link>
            <Link href="/playground/gates" className="hero-secondary">
              <FlaskConical size={16} />
              Explore playground
            </Link>
          </div>
          <div className="hero-footnotes">
            <span>
              <Check size={12} />
              Python-first
            </span>
            <span>
              <Check size={12} />
              No physics required
            </span>
            <span>
              <Check size={12} />
              Learn by doing
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="orbital-grid" />
          <BlochSphere hero />
          <div className="hero-visual-caption">
            <span className="status-dot" /> ONE QUBIT. ENDLESS CURIOSITY.
          </div>
        </div>
        <div className="hero-coordinate">QFZ / 001</div>
      </section>
      <MetricCards />
      <section className="home-path">
        <div className="section-heading">
          <div>
            <span className="eyebrow">A CLEAR PATH FORWARD</span>
            <h2>Your learning path</h2>
            <p>From classical bits to your first quantum project.</p>
          </div>
          <TextLink href="/learn">View all 18 lessons</TextLink>
        </div>
        <div className="chapter-cards">
          {groups.map((g, i) => {
            const items = lessons.filter((l) => l.group === i),
              done = items.filter((l) => p.completed.includes(l.id)).length;
            return (
              <Link
                className={`chapter-card chapter-${i}`}
                href={`/learn/${items.find((l) => !p.completed.includes(l.id))?.id ?? items[0].id}`}
                key={g.title}
              >
                <div className="chapter-card-top">
                  <span className="chapter-icon">
                    {i === 0 ? (
                      <Orbit size={21} />
                    ) : i === 1 ? (
                      <Code2 size={21} />
                    ) : i === 2 ? (
                      <GitBranch size={21} />
                    ) : (
                      <Trophy size={21} />
                    )}
                  </span>
                  <span>{g.range}</span>
                  <ArrowUpRight size={15} />
                </div>
                <h3>{g.title}</h3>
                <p>
                  {i === 0
                    ? "Qubits, gates & entanglement"
                    : i === 1
                      ? "Qiskit, simulators & IonQ"
                      : i === 2
                        ? "Problems, QUBO & QAOA"
                        : "Compare, evaluate & build"}
                </p>
                <div className="chapter-progress">
                  <div className="progress-track">
                    <div style={{ width: `${(done / items.length) * 100}%` }} />
                  </div>
                  <span>
                    {done} / {items.length}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
      <div className="home-bottom">
        <Card className="next-lesson-card">
          <CardHeading
            tag="YOUR NEXT STEP"
            title={
              p.completed.length
                ? "Keep your momentum."
                : "Start with the foundations."
            }
            aside={
              <span className="badge green">
                {p.completed.length ? "IN PROGRESS" : "BEGINNER FRIENDLY"}
              </span>
            }
          />
          <div className="home-lessons">
            {lessons
              .slice(Math.max(0, next.id - 1), Math.min(18, next.id + 2))
              .map((l) => (
                <LessonRow lesson={l} key={l.id} />
              ))}
          </div>
          <div className="path-footer">
            <BookOpen size={14} />
            <span>
              Every lesson: theory → visual → code → experiment → quiz
            </span>
          </div>
        </Card>
        <div className="home-experiment">
          <GateLab compact />
          <Link href="/playground/gates" className="experiment-link">
            Open the gate playground
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
      <div className="home-footer">
        <span>Small experiments. Deeper understanding.</span>
        <div>
          <span>Qiskit</span>
          <span>Qiskit Aer</span>
          <span>IonQ</span>
        </div>
      </div>
    </>
  );
}
function Dashboard() {
  const p = useProgress(),
    current = lessons[p.current - 1] ?? lessons[0],
    learned = lessons.filter((l) => p.completed.includes(l.id)),
    concepts = [...new Set(learned.flatMap((l) => l.concepts))];
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR PERSONAL WORKSPACE</div>
          <h1>Keep building your intuition.</h1>
          <p>
            Tu progreso se guarda en este navegador, sin necesidad de crear una
            cuenta.
          </p>
        </div>
      </div>
      <MetricCards />
      <div className="lab-grid spaced">
        <Card>
          <CardHeading
            tag="PICK UP WHERE YOU LEFT OFF"
            title={current.title}
            aside={
              <span className="badge">
                Lesson {String(current.id).padStart(2, "0")}
              </span>
            }
          />
          <p>{current.concept}</p>
          <div className="concept-tags">
            {current.concepts.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>
          <div className="progress-summary">
            <strong>{p.completed.length}/18</strong>
            <span>lessons completed</span>
            <div className="progress-track">
              <div style={{ width: `${(p.completed.length / 18) * 100}%` }} />
            </div>
          </div>
          <Link className="button" href={`/learn/${p.current}`}>
            Continue learning
            <ArrowRight size={15} />
          </Link>
        </Card>
        <Card>
          <CardHeading
            tag="YOUR QUANTUM VOCABULARY"
            title="Ideas you can explain."
          />
          {concepts.length ? (
            <div className="concept-tags">
              {concepts.map((c) => (
                <Link href={`/glossary?q=${encodeURIComponent(c)}`} key={c}>
                  {c}
                  <ArrowUpRight size={12} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-concepts">
              <Orbit size={32} />
              <p>
                Tu primer concepto aprendido está a una lección de distancia.
              </p>
              <TextLink href="/learn/1">Start with classical bits</TextLink>
            </div>
          )}
          <div className="dashboard-summary">
            <div>
              <span>Quiz questions passed</span>
              <strong>
                {Object.values(p.quizzes).filter((s) => s === 1).length}
              </strong>
            </div>
            <div>
              <span>Successful IonQ runs</span>
              <strong>{p.ionqRuns}</strong>
            </div>
            <div>
              <span>Readiness checklist</span>
              <strong>{Math.round((p.readiness.length / 13) * 100)}%</strong>
            </div>
          </div>
        </Card>
      </div>
      <div className="section-heading spaced">
        <div>
          <span className="eyebrow">YOUR MILESTONES</span>
          <h2>Completed lessons</h2>
        </div>
        <TextLink href="/readiness">Hackathon readiness</TextLink>
      </div>
      {learned.length ? (
        <div className="lesson-list">
          {learned.map((l) => (
            <LessonRow key={l.id} lesson={l} />
          ))}
        </div>
      ) : (
        <Card>
          <Notice>
            Todavía no completaste una lección. Explorá el concepto, ejecutá un
            experimento y aprobá su quiz para registrar tu avance.
          </Notice>
        </Card>
      )}
      <Card className="spaced">
        <CardHeading
          tag="SUGGESTED NEXT"
          title={
            current.id < 18
              ? lessons[current.id].title
              : "Build a reproducible project"
          }
        />
        <TextLink
          href={current.id < 18 ? `/learn/${current.id + 1}` : "/readiness"}
        >
          Preview the next step
        </TextLink>
      </Card>
    </>
  );
}
const subscribeHydration = () => () => {};
export default function Platform() {
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    () => true,
    () => false,
  );
  const path = usePathname(),
    searchParams = useSearchParams();
  const [sidebar, setSidebar] = useState(false),
    [search, setSearch] = useState(false),
    [theme, setTheme] = useState("dark");
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch((s) => !s);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);
  let content;
  if (path === "/") content = <Home />;
  else if (path === "/dashboard") content = <Dashboard />;
  else if (path === "/learn") content = <LearningPath />;
  else if (/^\/learn\/\d+$/.test(path))
    content = <LessonPage key={path} id={Number(path.split("/")[2])} />;
  else if (path === "/glossary")
    content = (
      <GlossaryPage
        key={searchParams.get("q") ?? ""}
        initialQuery={searchParams.get("q") ?? ""}
      />
    );
  else if (path === "/challenges") content = <ChallengesPage />;
  else if (path === "/readiness") content = <ReadinessPage />;
  else if (path === "/ionq") content = <IonQInfo />;
  else if (path === "/simulators/local") content = <LocalSimulator />;
  else if (path.startsWith("/playground/"))
    content = <LabPage key={path} mode={path.split("/")[2]} />;
  else if (
    [
      "/optimization",
      "/optimization/qubo",
      "/optimization/qaoa",
      "/optimization/compare",
    ].includes(path)
  )
    content = <OptimizationLab mode={path.split("/")[2] ?? "classical"} />;
  else
    content = (
      <Card>
        <h1>Page not found</h1>
        <p>Volvé al recorrido para seguir aprendiendo.</p>
        <TextLink href="/learn">Learning path</TextLink>
      </Card>
    );
  return (
    <div className="app-shell" data-theme={theme}>
      <Sidebar path={path} open={sidebar} onClose={() => setSidebar(false)} />
      <div className="main-shell">
        <Header
          path={path}
          onMenu={() => setSidebar(true)}
          theme={theme}
          onTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          onSearch={() => setSearch(true)}
        />
        <main className="main-content">
          <fieldset className="interactive-area" disabled={!hydrated}>
            {content}
          </fieldset>
        </main>
      </div>
      {search && <SearchDialog onClose={() => setSearch(false)} />}
    </div>
  );
}
