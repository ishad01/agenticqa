import type { BuildStatus, JiraTicket, Run, RunSummary, StageName } from "@/lib/types";

const BASE = "/api";

async function jfetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  listTickets: () => jfetch<JiraTicket[]>("/jira/tickets"),
  listRuns: () => jfetch<RunSummary[]>("/runs"),
  getRun: (id: string) => jfetch<Run>(`/runs/${id}`),
  createRun: (jira_ticket: string) =>
    jfetch<Run>("/runs", {
      method: "POST",
      body: JSON.stringify({ jira_ticket }),
    }),
  approveStage: (
    runId: string,
    stage: StageName,
    note?: string,
    editedArtifact?: Record<string, unknown>,
  ) =>
    jfetch<Run>(`/runs/${runId}/stages/${stage}/approve`, {
      method: "POST",
      body: JSON.stringify({ note, edited_artifact: editedArtifact ?? null }),
    }),
  rejectStage: (runId: string, stage: StageName, note: string) =>
    jfetch<Run>(`/runs/${runId}/stages/${stage}/reject`, {
      method: "POST",
      body: JSON.stringify({ note }),
    }),
  retryStage: (runId: string, stage: StageName) =>
    jfetch<Run>(`/runs/${runId}/stages/${stage}/retry`, { method: "POST" }),
  listBuilds: () => jfetch<BuildStatus[]>("/jira/tickets/builds"),
  checkBuild: (ticketKey: string) =>
    jfetch<BuildStatus>(`/jira/tickets/${ticketKey}/check`, { method: "POST" }),
};
