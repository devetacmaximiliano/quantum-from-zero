"use client";
import { useEffect, useRef, useState } from "react";
export async function request<T>(
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`/api/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(150000)])
      : AbortSignal.timeout(150000),
  });
  const data = await response.json().catch(() => ({
    detail: "El backend no respondió. Iniciá FastAPI en el puerto 8000.",
  }));
  if (!response.ok) {
    const detail = data.detail;
    throw new Error(
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((d: { msg: string }) => d.msg).join(" · ")
          : "No se pudo ejecutar el experimento.",
    );
  }
  return data;
}
export function useRequest<T>() {
  const pending = useRef<AbortController | null>(null);
  useEffect(() => () => pending.current?.abort(), []);
  const [data, setData] = useState<T | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function run(path: string, body: unknown): Promise<T | null> {
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    setError("");
    setData(null);
    try {
      const result = await request<T>(path, body, controller.signal);
      if (controller.signal.aborted) return null;
      setData(result);
      return result;
    } catch (e) {
      if (controller.signal.aborted) return null;
      setError(
        e instanceof TypeError
          ? "No se pudo conectar. Iniciá el backend e intentá de nuevo."
          : e instanceof Error
            ? e.message
            : "Error de conexión.",
      );
      return null;
    } finally {
      if (pending.current === controller) setBusy(false);
    }
  }
  function clear() {
    pending.current?.abort();
    pending.current = null;
    setBusy(false);
    setData(null);
    setError("");
  }
  return { data, busy, error, run, clear };
}
