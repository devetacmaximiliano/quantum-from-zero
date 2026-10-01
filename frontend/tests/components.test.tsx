import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { GateLab, CircuitBuilder } from "@/components/labs";
import { GlossaryPage, LessonPage } from "@/components/learning";
import {
  emptyProgress,
  updateProgress,
  useProgress,
  completeLesson,
} from "@/lib/progress";
import { lessons } from "@/lib/curriculum";

beforeEach(() => {
  localStorage.clear();
  updateProgress(() => ({ ...emptyProgress }));
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
});
describe("interactive learning components", () => {
  it("applies X to the visible qubit preview and resets", () => {
    render(<GateLab compact />);
    fireEvent.click(screen.getByRole("button", { name: "X" }));
    expect(screen.getByText("100.0%")).toBeInTheDocument();
    const hist = screen.getByText("Ideal probabilities").parentElement!;
    expect(within(hist).getByText("|1⟩")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reset qubit" }));
    expect(screen.getByText("100.0%")).toBeInTheDocument();
  });
  it("adds a qubit and updates the basis space in the builder", () => {
    render(<CircuitBuilder />);
    fireEvent.click(screen.getByRole("button", { name: "Add qubit" }));
    expect(screen.getByText("3 qubits → 8 basis states")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /Circuito de 3 qubits/ }),
    ).toBeInTheDocument();
  });
  it("rejects a CX control equal to its target before appending", () => {
    render(<CircuitBuilder />);
    fireEvent.change(screen.getByText("Control").querySelector("select")!, {
      target: { value: "0" },
    });
    fireEvent.click(screen.getByRole("button", { name: "CX" }));
    expect(screen.getByRole("alert")).toHaveTextContent("control diferente");
  });
  it("filters the glossary to matching terms", () => {
    render(<GlossaryPage />);
    fireEvent.change(screen.getByRole("textbox", { name: "Search glossary" }), {
      target: { value: "decoherence" },
    });
    expect(
      screen.getByRole("heading", { name: "decoherence" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "qubit" }),
    ).not.toBeInTheDocument();
  });
  it("renders a lesson and stores completion only after a correct quiz", () => {
    render(<LessonPage id={1} />);
    expect(
      screen.getByRole("heading", { name: "Classical Bits", level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Mark lesson complete" }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "C 8" }));
    fireEvent.click(screen.getByRole("button", { name: "Check answer" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Mark lesson complete" }),
    );
    expect(
      JSON.parse(localStorage.getItem("quantum-from-zero:v1")!).completed,
    ).toContain(1);
  });
  it("provides a runnable experiment and feedback in all 18 lessons", () => {
    expect(lessons).toHaveLength(18);
    for (const lesson of lessons) {
      expect(lesson.lab.startsWith("/")).toBe(true);
      expect(lesson.options[lesson.answer]).toBeTruthy();
      expect(lesson.feedback.length).toBeGreaterThan(30);
      expect(lesson.code.length).toBeGreaterThan(30);
    }
  });
});
describe("progress persistence", () => {
  function Probe() {
    const p = useProgress();
    return (
      <span>
        {p.completed.length} completed, current {p.current}
      </span>
    );
  }
  it("deduplicates completions and restores them after remount", () => {
    completeLesson(4, 1);
    completeLesson(4, 1);
    const view = render(<Probe />);
    expect(screen.getByText("1 completed, current 5")).toBeInTheDocument();
    view.unmount();
    render(<Probe />);
    expect(screen.getByText("1 completed, current 5")).toBeInTheDocument();
  });
  it("recovers from malformed storage", () => {
    localStorage.setItem("quantum-from-zero:v1", "not-json");
    render(<Probe />);
    expect(screen.getByText("0 completed, current 1")).toBeInTheDocument();
  });
});
