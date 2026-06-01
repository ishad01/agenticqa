import { Activity, Database, Layers, Network, Search, Sparkles } from "lucide-react";

import { KpiCard } from "@/components/KpiCard";
import { MockedChip } from "@/components/MockedChip";
import { VECTOR_INDEXES } from "@/lib/agents";
import { relativeTime } from "@/lib/format";
import { PageHeader, Panel } from "@/pages/Dashboard";

export function KnowledgePage() {
  const totalVectors = VECTOR_INDEXES.reduce((a, i) => a + i.vectors, 0);
  const totalSize = "431 MB";
  return (
    <div className="space-y-5 p-6 lg:p-8">
      <PageHeader
        title="Knowledge"
        subtitle="Vector indexes powering retrieval for the agent fleet. Embeddings, freshness, and query volume."
      />

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Vector indexes"
          value={VECTOR_INDEXES.length}
          hint="serving the agent fleet"
          icon={Database}
          tone="info"
        />
        <KpiCard
          label="Total vectors"
          value={totalVectors.toLocaleString()}
          hint={
            <>
              spanning <span className="text-foreground font-mono">{totalSize}</span> on disk{" "}
              <MockedChip />
            </>
          }
          icon={Network}
        />
        <KpiCard
          label="Queries · 24h"
          value="1,284"
          hint={
            <>
              avg <span className="text-foreground font-mono">214ms</span> · top-k 7 <MockedChip />
            </>
          }
          icon={Search}
          tone="info"
        />
        <KpiCard
          label="Cache hit rate"
          value="73%"
          hint={
            <>
              embedding cache <span className="text-foreground font-mono">redis</span>{" "}
              <MockedChip />
            </>
          }
          icon={Activity}
          tone="success"
        />
      </section>

      <Panel
        title="Indexes"
        subtitle="Each index is queried by one or more agents during retrieval."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-1/60 text-2xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-3 py-2">Index</th>
                <th className="text-left font-medium px-3 py-2">Vectors</th>
                <th className="text-left font-medium px-3 py-2">Dim</th>
                <th className="text-left font-medium px-3 py-2">Model</th>
                <th className="text-left font-medium px-3 py-2">Size</th>
                <th className="text-left font-medium px-3 py-2">Refreshed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {VECTOR_INDEXES.map((idx) => (
                <tr key={idx.name} className="hover:bg-accent/40 transition-colors">
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <Database className="h-3.5 w-3.5 text-info" />
                      <span className="font-mono text-info">{idx.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs tabular-nums">
                    {idx.vectors.toLocaleString()}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">
                    {idx.dimensions}
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs">{idx.model}</td>
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">
                    {idx.size}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">
                    {relativeTime(idx.lastRefresh)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Embedding fleet" subtitle="Models used to embed knowledge.">
          <ul className="divide-y divide-border">
            <li className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono text-sm">text-embedding-3-large</span>
              </div>
              <span className="font-mono text-2xs text-muted-foreground">
                3072d · 3 indexes · 24k vectors
              </span>
            </li>
            <li className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono text-sm">text-embedding-3-small</span>
              </div>
              <span className="font-mono text-2xs text-muted-foreground">
                1536d · 4 indexes · 10k vectors
              </span>
            </li>
            <li className="flex items-center justify-between px-4 py-3 text-2xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" />
                Fleet stats synthesized — backend telemetry pending
              </span>
              <MockedChip />
            </li>
          </ul>
        </Panel>

        <Panel title="Query mix · last 24h" subtitle="Which agents are hitting RAG hardest.">
          <ul className="divide-y divide-border">
            {[
              { agent: "Context Synthesis Agent (CTX)", pct: 0.36 },
              { agent: "Test Automation Agent (AUT)", pct: 0.20 },
              { agent: "Generate Test Cases Agent (GTC)", pct: 0.16 },
              { agent: "Dynamic Test Selection Agent (DTS)", pct: 0.12 },
              { agent: "Failure Analysis QA Agent (QFA)", pct: 0.12 },
              { agent: "Defect Management Agent (DEF)", pct: 0.04 },
            ].map((row) => (
              <li key={row.agent} className="flex items-center gap-3 px-4 py-2.5">
                <span className="w-44 shrink-0 text-xs">{row.agent}</span>
                <div className="flex-1 h-1.5 rounded-full bg-muted/60 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-info to-primary"
                    style={{ width: `${row.pct * 100}%` }}
                  />
                </div>
                <span className="w-12 text-right font-mono text-xs tabular-nums">
                  {Math.round(row.pct * 100)}%
                </span>
              </li>
            ))}
            <li className="flex items-center justify-end px-4 py-2">
              <MockedChip />
            </li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}
