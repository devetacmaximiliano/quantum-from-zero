"use client";
import { useSyncExternalStore } from "react";
export type Progress = {
  completed: number[];
  quizzes: Record<string, number>;
  challenges: number[];
  current: number;
  readiness: string[];
  runs: number;
  ionqRuns: number;
};
export const emptyProgress: Progress = {
  completed: [],
  quizzes: {},
  challenges: [],
  current: 1,
  readiness: [],
  runs: 0,
  ionqRuns: 0,
};
const key = "quantum-from-zero:v1";
let cached: Progress = emptyProgress;
let rawCached: string | null | undefined;
const listeners = new Set<() => void>();
function snapshot(): Progress {
  let raw: string | null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return cached;
  }
  try {
    if (raw !== rawCached) {
      rawCached = raw;
      const p = raw ? JSON.parse(raw) : {};
      const ids = (v: unknown, max: number): number[] =>
        Array.isArray(v)
          ? [
              ...new Set(
                v.filter((i) => Number.isInteger(i) && i >= 1 && i <= max),
              ),
            ]
          : [];
      cached = {
        completed: ids(p.completed, 18),
        challenges: ids(p.challenges, 10),
        quizzes:
          p.quizzes && typeof p.quizzes === "object"
            ? Object.fromEntries(
                Object.entries(p.quizzes)
                  .filter(
                    ([id, score]) =>
                      Number(id) >= 1 &&
                      Number(id) <= 18 &&
                      (score === 0 || score === 1),
                  )
                  .map(([id, score]) => [id, Number(score)]),
              )
            : {},
        current:
          Number.isInteger(p.current) && p.current >= 1 && p.current <= 18
            ? p.current
            : 1,
        readiness: Array.isArray(p.readiness)
          ? [
              ...new Set<string>(
                p.readiness.filter((s: unknown) => typeof s === "string"),
              ),
            ].slice(0, 13)
          : [],
        runs: Number.isInteger(p.runs) && p.runs >= 0 ? p.runs : 0,
        ionqRuns:
          Number.isInteger(p.ionqRuns) && p.ionqRuns >= 0 ? p.ionqRuns : 0,
      };
    }
  } catch {
    cached = emptyProgress;
  }
  return cached;
}
function subscribe(fn: () => void) {
  listeners.add(fn);
  window.addEventListener("storage", fn);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", fn);
  };
}
export function updateProgress(transform: (p: Progress) => Progress) {
  const previous = snapshot();
  cached = transform(previous);
  if (cached === previous) return;
  try {
    const raw = JSON.stringify(cached);
    localStorage.setItem(key, raw);
    rawCached = raw;
  } catch {
    /* Progress remains usable for this session if storage is blocked. */
  }
  listeners.forEach((fn) => fn());
}
export function useProgress() {
  return useSyncExternalStore(subscribe, snapshot, () => emptyProgress);
}
export function completeLesson(id: number, score: number) {
  updateProgress((p) => ({
    ...p,
    completed: [...new Set([...p.completed, id])],
    quizzes: { ...p.quizzes, [id]: score },
    current: Math.min(18, id + 1),
  }));
}
export function recordRun(ionq = false) {
  updateProgress((p) => ({
    ...p,
    runs: p.runs + 1,
    ionqRuns: p.ionqRuns + (ionq ? 1 : 0),
  }));
}
