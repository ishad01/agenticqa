/**
 * Architecture — 4 stacked bands, single connector between each.
 *
 *  ┌──────────── 01 SOURCES ─────────────┐
 *  │   Jira     Confluence     Repo      │
 *  └─────────────────┬───────────────────┘
 *                    ▼
 *  ┌──────────── 02 ORCHESTRATION ───────┐
 *  │ Reviewer ↔ LangGraph Orchestrator   │
 *  │                    ↳ LLM Fleet (3)  │
 *  └─────────────────┬───────────────────┘
 *                    ▼
 *  ┌──────────── 03 AGENT PIPELINE ──────┐
 *  │ REQ → CTX → TCC → AUT → EXE → TRG → DEF
 *  │   Powered by · RAG (7 idx) · 11 tools
 *  └─────────────────┬───────────────────┘
 *                    ▼
 *  ┌──────────── 04 SHIP (gated) ────────┐
 *  │ Repo PR → Pipeline → Dev ✓→ Staging ✓→ Prod
 *  │                       ↓     ↓        ↓ (fail)
 *  │                    Defect Filed (Jira)
 *  │                       └──── ↻ loops to TRG ─┘
 *  └─────────────────────────────────────┘
 */

const W = 1320;
const H = 820;

const TONE_COLOR = {
  info: "hsl(199 89% 60%)",
  primary: "hsl(263 80% 64%)",
  success: "hsl(152 64% 48%)",
  warning: "hsl(38 92% 58%)",
  danger: "hsl(0 78% 58%)",
} as const;

type Tone = keyof typeof TONE_COLOR;

export function ArchitectureDiagram() {
  return (
    <div className="relative w-full overflow-hidden rounded-lg border bg-[radial-gradient(ellipse_at_top,_hsl(263_60%_15%/0.4)_0%,_hsl(240_14%_5%)_70%)]">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        <Defs />

        {/* Bands */}
        <Band y={20} h={140} tone="info" num="01" title="Sources" hint="What goes in">
          <Box x={320} y={56} w={170} h={68} label="Jira" sub="ticket source" tone="info" />
          <Box x={520} y={56} w={190} h={68} label="Confluence" sub="HLD / LLD docs" tone="info" />
          <Box x={740} y={56} w={220} h={68} label="Source repository" sub="GitLab · main" tone="info" />
        </Band>
        <Connector fromY={160} toY={184} />

        <Band y={184} h={140} tone="primary" num="02" title="Orchestration" hint="Control plane">
          <Box
            x={420}
            y={216}
            w={300}
            h={84}
            label="LangGraph Orchestrator"
            sub="state machine · HITL gates · retries"
            tone="primary"
            big
          />
          <Box x={150} y={228} w={240} h={60} label="Human Reviewer" sub="approve · reject · retry" tone="warning" />
          {/* reviewer ↔ orchestrator double-arrow */}
          <line
            x1={390}
            y1={258}
            x2={420}
            y2={258}
            stroke="hsl(38 92% 58%)"
            strokeOpacity={0.75}
            strokeWidth={1.6}
            markerStart="url(#arW-rev)"
            markerEnd="url(#arW)"
          />
          {/* LLM fleet compact card */}
          <Box x={760} y={210} w={300} h={96} label="LLM Fleet" sub="model routing per agent" tone="primary">
            {[
              { label: "claude-opus-4-7", role: "planning · codegen · triage" },
              { label: "claude-sonnet-4-6", role: "context · BDD · bug body" },
              { label: "claude-haiku-4-5", role: "ticket parse · pipeline ops" },
            ].map((m, i) => (
              <g key={m.label}>
                <text
                  x={774}
                  y={252 + i * 16}
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    fontSize: 10,
                    fill: "hsl(263 80% 80%)",
                  }}
                >
                  {m.label}
                </text>
                <text
                  x={910}
                  y={252 + i * 16}
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: 9,
                    fill: "hsl(220 8% 58%)",
                  }}
                >
                  {m.role}
                </text>
              </g>
            ))}
          </Box>
        </Band>
        <Connector fromY={324} toY={348} />

        <Band y={348} h={196} tone="primary" num="03" title="Agent pipeline" hint="Specialist fleet">
          {AGENTS_ROW.map((a, i) => (
            <AgentDisc
              key={a.short}
              cx={185 + i * 128}
              cy={418}
              short={a.short}
              label={a.label}
              index={i}
            />
          ))}
          {/* sequential arrows between discs + animated data packets */}
          {Array.from({ length: AGENTS_ROW.length - 1 }).map((_, i) => {
            const x1 = 185 + i * 128 + 32;
            const x2 = 185 + (i + 1) * 128 - 32;
            return (
              <g key={"agent-arrow-" + i}>
                <line
                  x1={x1}
                  y1={418}
                  x2={x2}
                  y2={418}
                  stroke="hsl(263 80% 64%)"
                  strokeOpacity={0.45}
                  strokeWidth={1.4}
                  markerEnd="url(#arP)"
                />
                <circle r={3} fill="hsl(263 80% 78%)" filter="url(#glow-soft)">
                  <animate
                    attributeName="cx"
                    values={`${x1};${x2}`}
                    dur="2.6s"
                    begin={`${i * 0.4}s`}
                    repeatCount="indefinite"
                  />
                  <animate attributeName="cy" values="418;418" dur="2.6s" repeatCount="indefinite" />
                  <animate
                    attributeName="opacity"
                    values="0;1;1;0"
                    keyTimes="0;0.1;0.9;1"
                    dur="2.6s"
                    begin={`${i * 0.4}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            );
          })}

          {/* separator between agents row and powered-by badges */}
          <line x1={160} x2={W - 40} y1={502} y2={502} stroke="hsl(var(--border))" strokeOpacity={0.4} />
          <text
            x={170}
            y={498}
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 9,
              fill: "hsl(220 8% 50%)",
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            powered by
          </text>

          {/* powered-by badges — moved DOWN to its own sub-row, no overlap with labels */}
          <foreignObject x={160} y={510} width={W - 200} height={28}>
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                fontFamily: "JetBrains Mono, monospace",
                fontSize: 10,
                alignItems: "center",
              }}
            >
              <PoweredBy label="RAG · 7 indexes · 35,397 vectors" tone="info" />
              <PoweredBy label="11 tools · jira / repo / playwright / gitlab" tone="primary" />
              <PoweredBy label="LLM fleet ↑" tone="primary" />
              <PoweredBy label="HITL gates between every stage" tone="warning" />
            </div>
          </foreignObject>
        </Band>
        <Connector fromY={544} toY={568} />

        <Band y={568} h={234} tone="success" num="04" title="Ship" hint="Gated · fail loops back">
          {/* Build sub-row */}
          <Box x={160} y={604} w={150} h={56} label="Repository PR" sub="branch · review" tone="primary" />
          <Box x={330} y={604} w={170} h={56} label="GitLab Pipeline" sub="runs suite per env" tone="info" />

          {/* Env promotion sub-row */}
          <Box x={560} y={604} w={140} h={56} label="Dev" sub="first env" tone="success" />
          <Box x={780} y={604} w={140} h={56} label="Staging" sub="after dev pass" tone="success" />
          <Box x={1000} y={604} w={160} h={56} label="Production" sub="after staging pass" tone="success" />

          {/* Linear arrows across ship row */}
          <Arrow x1={310} y1={632} x2={330} y2={632} tone="info" />
          <Arrow x1={500} y1={632} x2={560} y2={632} tone="info" label="run" />
          <Arrow x1={700} y1={632} x2={780} y2={632} tone="success" label="✓ pass" />
          <Arrow x1={920} y1={632} x2={1000} y2={632} tone="success" label="✓ pass" />

          {/* fail arrows down from each env converge on defect */}
          {[
            { x: 630, side: "left" as const },
            { x: 850, side: "mid" as const },
            { x: 1080, side: "right" as const },
          ].map((env) => (
            <path
              key={"fail-" + env.x}
              d={`M ${env.x} 660 C ${env.x} 700, ${(env.x + 660) / 2} 720, 660 740`}
              fill="none"
              stroke="hsl(0 78% 58%)"
              strokeOpacity={0.55}
              strokeWidth={1.3}
              strokeDasharray="3 4"
              markerEnd="url(#arD)"
            />
          ))}
          <text
            x={660}
            y={718}
            textAnchor="middle"
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 9,
              fill: "hsl(0 78% 72%)",
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            on bug · raise jira defect
          </text>

          {/* Defect node */}
          <Box
            x={560}
            y={740}
            w={210}
            h={40}
            label="Defect Filed (Jira Bug)"
            tone="danger"
            compact
          />

          {/* Shipped indicator — placed inside the band, well clear of the curve */}
          <text
            x={1080}
            y={596}
            textAnchor="middle"
            style={{
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 9,
              fill: "hsl(152 64% 60%)",
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            ✓ shipped
          </text>
        </Band>

        {/* Failure loop back to Triage Agent — routed through the RIGHT margin so it
           cleanly sweeps around the Production / Staging / Dev boxes rather than cutting through them.
           TRG agent is now at index 6 (REQ, CTX, GTC, AUT, REG, EXE, TRG, DEF). */}
        <path
          id="fail-loop-path"
          d={`M 770 760 C 1280 760, 1280 418, ${185 + 6 * 128 + 36} 418`}
          fill="none"
          stroke="hsl(38 92% 58%)"
          strokeOpacity={0.65}
          strokeWidth={1.4}
          strokeDasharray="4 5"
          markerEnd="url(#arW)"
        >
          <animate
            attributeName="stroke-dashoffset"
            from="0"
            to="-90"
            dur="4s"
            repeatCount="indefinite"
          />
        </path>
        <circle r={3.5} fill="hsl(38 92% 70%)" filter="url(#glow-soft)">
          <animateMotion dur="4s" repeatCount="indefinite" rotate="auto">
            <mpath href="#fail-loop-path" />
          </animateMotion>
        </circle>

        {/* Loop label — placed in the empty right margin, vertical, well clear of content */}
        <text
          x={1296}
          y={580}
          textAnchor="middle"
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 10,
            fill: "hsl(38 92% 70%)",
            letterSpacing: 2,
            textTransform: "uppercase",
            fontWeight: 600,
          }}
          transform="rotate(90, 1296, 580)"
        >
          ↻ loops to triage
        </text>

        {/* Bottom-right meta */}
        <foreignObject x={W - 320} y={H - 36} width={300} height={28}>
          <div
            style={{
              textAlign: "right",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: 9,
              color: "hsl(220 8% 50%)",
            }}
          >
            agenticqa · system topology · autonomous QE · human-in-loop
          </div>
        </foreignObject>
      </svg>
    </div>
  );
}

const AGENTS_ROW = [
  { short: "REQ", label: "Req. Analysis" },
  { short: "CTX", label: "Context Synth" },
  { short: "GTC", label: "Generate Tests" },
  { short: "AUT", label: "Test Automation" },
  { short: "DTS", label: "Dynamic Test Sel." },
  { short: "EXE", label: "Pipeline Exec" },
  { short: "QFA", label: "Failure Analysis" },
  { short: "DEF", label: "Defect Mgmt" },
  { short: "RRN", label: "Re-run" },
] as const;

/* ───────── Primitives ───────── */

function Band({
  y,
  h,
  num,
  title,
  hint,
  tone,
  children,
}: {
  y: number;
  h: number;
  num: string;
  title: string;
  hint: string;
  tone: Tone;
  children: React.ReactNode;
}) {
  const color = TONE_COLOR[tone];
  return (
    <g>
      {/* band background panel */}
      <rect
        x={120}
        y={y}
        width={W - 140}
        height={h}
        rx={12}
        fill="hsl(240 12% 7%)"
        stroke="hsl(var(--border))"
        strokeOpacity={0.4}
      />
      {/* left rail strip */}
      <rect x={120} y={y} width={3} height={h} rx={1.5} fill={color} opacity={0.8} />
      {/* number badge */}
      <g>
        <rect x={42} y={y + 8} width={70} height={28} rx={4} fill={color} fillOpacity={0.12} stroke={color} strokeOpacity={0.5} />
        <text
          x={77}
          y={y + 27}
          textAnchor="middle"
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 13,
            fontWeight: 700,
            fill: color,
            letterSpacing: 2,
          }}
        >
          {num}
        </text>
      </g>
      {/* title + hint */}
      <text
        x={42}
        y={y + 56}
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 13,
          fontWeight: 600,
          fill: "hsl(220 14% 96%)",
        }}
      >
        {title}
      </text>
      <foreignObject x={36} y={y + 64} width={80} height={50}>
        <div
          style={{
            fontFamily: "Inter, sans-serif",
            fontSize: 10,
            color: "hsl(220 8% 60%)",
            lineHeight: 1.25,
          }}
        >
          {hint}
        </div>
      </foreignObject>
      {children}
    </g>
  );
}

function Connector({ fromY, toY }: { fromY: number; toY: number }) {
  return (
    <g>
      <line
        x1={W / 2}
        y1={fromY}
        x2={W / 2}
        y2={toY - 6}
        stroke="hsl(263 80% 64%)"
        strokeOpacity={0.4}
        strokeWidth={1.4}
        markerEnd="url(#arP)"
      />
      <circle r={2.5} fill="hsl(263 80% 78%)" filter="url(#glow-soft)">
        <animate
          attributeName="cy"
          values={`${fromY};${toY - 6}`}
          dur="2.4s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="cx"
          values={`${W / 2};${W / 2}`}
          dur="2.4s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0;1;1;0"
          keyTimes="0;0.1;0.9;1"
          dur="2.4s"
          repeatCount="indefinite"
        />
      </circle>
    </g>
  );
}

function Box({
  x,
  y,
  w,
  h,
  label,
  sub,
  tone,
  big,
  compact,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sub?: string;
  tone: Tone;
  big?: boolean;
  compact?: boolean;
  children?: React.ReactNode;
}) {
  const color = TONE_COLOR[tone];
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={8}
        fill="hsl(240 14% 9%)"
        stroke={color}
        strokeOpacity={0.55}
      />
      <rect x={x} y={y} width={w} height={2} fill={color} fillOpacity={0.85} rx={1} />
      <text
        x={x + 14}
        y={y + (compact ? 22 : big ? 30 : 26)}
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: big ? 14 : compact ? 12 : 13,
          fontWeight: 600,
          fill: "hsl(220 14% 96%)",
        }}
      >
        {label}
      </text>
      {sub && (
        <text
          x={x + 14}
          y={y + (big ? 52 : 44)}
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 10,
            fill: "hsl(220 8% 58%)",
          }}
        >
          {sub}
        </text>
      )}
      {children}
    </g>
  );
}

function AgentDisc({
  cx,
  cy,
  short,
  label,
  index = 0,
}: {
  cx: number;
  cy: number;
  short: string;
  label: string;
  index?: number;
}) {
  const r = 32;
  const delay = (index * 0.45).toFixed(2);
  return (
    <g>
      {/* outer halo (pulsing) */}
      <circle cx={cx} cy={cy} r={r + 14} fill="url(#agent-halo)">
        <animate
          attributeName="r"
          values={`${r + 10};${r + 18};${r + 10}`}
          dur="3.6s"
          begin={`${delay}s`}
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0.35;0.7;0.35"
          dur="3.6s"
          begin={`${delay}s`}
          repeatCount="indefinite"
        />
      </circle>
      <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke="hsl(263 80% 64%)" strokeOpacity={0.4} />
      <circle cx={cx} cy={cy} r={r} fill="url(#grad-agent)" stroke="hsl(263 80% 64%)" strokeWidth={1.5} filter="url(#glow-soft)" />
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        style={{
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 12,
          fontWeight: 700,
          fill: "hsl(220 14% 96%)",
          letterSpacing: 1,
        }}
      >
        {short}
      </text>
      <text
        x={cx}
        y={cy + r + 16}
        textAnchor="middle"
        style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 10,
          fill: "hsl(220 14% 84%)",
        }}
      >
        {label}
      </text>
    </g>
  );
}

function Arrow({
  x1,
  y1,
  x2,
  y2,
  tone,
  label,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  tone: Tone;
  label?: string;
}) {
  const color = TONE_COLOR[tone];
  const markerId = tone === "success" ? "arG" : tone === "danger" ? "arD" : "ar";
  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeOpacity={0.75}
        strokeWidth={1.6}
        markerEnd={`url(#${markerId})`}
      />
      {label && (
        <text
          x={(x1 + x2) / 2}
          y={y1 - 8}
          textAnchor="middle"
          style={{
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 9,
            fill: color,
            letterSpacing: 1,
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          {label}
        </text>
      )}
    </g>
  );
}

function PoweredBy({ label, tone }: { label: string; tone: Tone }) {
  const color = TONE_COLOR[tone];
  return (
    <span
      style={{
        border: `1px solid ${color}`,
        borderColor: color,
        background: `hsl(from ${color} h s l / 0.12)`,
        color,
        borderRadius: 999,
        padding: "2px 8px",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function Defs() {
  return (
    <defs>
      <radialGradient id="grad-agent" cx="50%" cy="38%" r="80%">
        <stop offset="0%" stopColor="hsl(263 80% 64%)" stopOpacity={0.9} />
        <stop offset="100%" stopColor="hsl(240 14% 9%)" stopOpacity={1} />
      </radialGradient>
      <radialGradient id="agent-halo" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stopColor="hsl(263 80% 70% / 0.55)" />
        <stop offset="100%" stopColor="hsl(263 80% 70% / 0)" />
      </radialGradient>
      <filter id="glow-soft" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <Marker id="ar" color="hsl(220 8% 65%)" />
      <Marker id="arP" color="hsl(263 80% 64%)" />
      <Marker id="arG" color="hsl(152 64% 48%)" />
      <Marker id="arW" color="hsl(38 92% 58%)" />
      <Marker id="arW-rev" color="hsl(38 92% 58%)" reverse />
      <Marker id="arD" color="hsl(0 78% 58%)" />
    </defs>
  );
}

function Marker({ id, color, reverse }: { id: string; color: string; reverse?: boolean }) {
  return (
    <marker
      id={id}
      viewBox="0 0 10 10"
      refX={reverse ? 2 : 8}
      refY="5"
      markerWidth="6"
      markerHeight="6"
      orient={reverse ? "auto" : "auto-start-reverse"}
    >
      <path d={reverse ? "M 10 0 L 0 5 L 10 10 z" : "M 0 0 L 10 5 L 0 10 z"} fill={color} />
    </marker>
  );
}
