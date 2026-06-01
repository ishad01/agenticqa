import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "@/lib/api";
import { isRunActive } from "@/lib/stage";
import type { BuildStatus, JiraTicket, Run, RunSummary } from "@/lib/types";

interface AsyncState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

function toMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export function useRuns(pollMs = 4000): AsyncState<RunSummary[]> & { reload: () => void } {
  const [data, setData] = useState<RunSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await api.listRuns();
      setData(r);
      setError(null);
    } catch (e) {
      setError(toMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    if (pollMs <= 0) return;
    const id = setInterval(load, pollMs);
    return () => clearInterval(id);
  }, [load, pollMs]);

  return { data, error, loading, reload: load };
}

export function useBuilds(
  pollMs = 2000,
): AsyncState<BuildStatus[]> & { reload: () => void } {
  const [data, setData] = useState<BuildStatus[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const b = await api.listBuilds();
      setData(b);
      setError(null);
    } catch (e) {
      setError(toMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    if (pollMs <= 0) return;
    const id = setInterval(load, pollMs);
    return () => clearInterval(id);
  }, [load, pollMs]);

  return { data, error, loading, reload: load };
}

export function useTickets(): AsyncState<JiraTicket[]> & { reload: () => void } {
  const [data, setData] = useState<JiraTicket[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const t = await api.listTickets();
      setData(t);
      setError(null);
    } catch (e) {
      setError(toMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, error, loading, reload: load };
}

export function useRun(id: string | undefined): {
  data: Run | null;
  error: string | null;
  loading: boolean;
  isPolling: boolean;
  reload: () => Promise<void>;
  patch: (r: Run) => void;
} {
  const [data, setData] = useState<Run | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPolling, setPolling] = useState(false);
  const timer = useRef<number | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const r = await api.getRun(id);
      setData(r);
      setError(null);
    } catch (e) {
      setError(toMsg(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  // Poll while the run is in-flight (running or awaiting next-stage transition).
  useEffect(() => {
    const stop = () => {
      if (timer.current) {
        window.clearInterval(timer.current);
        timer.current = null;
      }
      setPolling(false);
    };

    if (!data) return stop;
    const active = isRunActive(data.stages);
    if (!active) return stop;

    setPolling(true);
    timer.current = window.setInterval(load, 2000);
    return stop;
  }, [data, load]);

  return { data, error, loading, isPolling, reload: load, patch: setData };
}
