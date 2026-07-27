import type {
  ActivityItem,
  ResourceTask,
  SwimlaneEvent,
  EventDropsRow,
} from "@zenith-visuals/timeline";
import type { GanttTask } from "@zenith-visuals/gantt";
import type { OrgNode } from "@zenith-visuals/orgchart";
import type {
  GeoPoint,
  BubbleDatum,
  GeoHeatPoint,
  HexbinPoint,
  TileDatum,
} from "@zenith-visuals/maps";
import type { ChartSeries, MatrixDatum } from "@zenith-visuals/charts";
import type { BandZone } from "@zenith-visuals/kpi";
import type { AgentNodeInput, AgentEdgeInput } from "@zenith-visuals/ai";

const iso = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

/** ~1 year of pseudo-random contribution data (deterministic per day). */
export const heatmapData = Array.from({ length: 365 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (364 - i));
  const seasonal = Math.sin(i / 20) * 3 + 3;
  const noise = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 4;
  return { date: d.toISOString().slice(0, 10), value: Math.max(0, Math.round(seasonal + noise - 2)) };
});

export const activities: ActivityItem[] = [
  {
    id: "1",
    title: "Deployed v0.1.2 to production",
    description: "13 packages published to npm",
    timestamp: iso(0),
    status: "success",
    actor: { name: "Aria Kapoor" },
  },
  {
    id: "2",
    title: "Merged PR #218 — GeoScatter projections",
    timestamp: iso(0),
    status: "info",
    actor: { name: "Sam Rivera" },
    children: [
      { id: "2a", title: "Approved by Nia Chen", timestamp: iso(0), status: "success" },
      { id: "2b", title: "3 files changed", timestamp: iso(0) },
    ],
  },
  {
    id: "3",
    title: "CI pipeline failed on flaky test",
    timestamp: iso(1),
    status: "danger",
    actor: { name: "CI Bot" },
  },
  {
    id: "4",
    title: "Opened issue: dark-mode contrast on legend",
    timestamp: iso(2),
    status: "warning",
    actor: { name: "Leo Kim" },
  },
];

export const sankeyData = {
  links: [
    { source: "Landing", target: "Signup", value: 1200 },
    { source: "Landing", target: "Docs", value: 800 },
    { source: "Docs", target: "Signup", value: 300 },
    { source: "Signup", target: "Activated", value: 900 },
    { source: "Signup", target: "Churned", value: 600 },
    { source: "Activated", target: "Paid", value: 520 },
    { source: "Activated", target: "Free", value: 380 },
  ],
};

export const networkData = {
  nodes: [
    { id: "app", label: "Web App", group: 0 },
    { id: "api", label: "API Gateway", group: 1 },
    { id: "auth", label: "Auth", group: 1 },
    { id: "db", label: "Postgres", group: 2 },
    { id: "cache", label: "Redis", group: 2 },
    { id: "queue", label: "Queue", group: 3 },
    { id: "worker", label: "Worker", group: 3 },
  ],
  links: [
    { source: "app", target: "api", value: 3 },
    { source: "api", target: "auth" },
    { source: "api", target: "db", value: 2 },
    { source: "api", target: "cache", value: 2 },
    { source: "api", target: "queue" },
    { source: "queue", target: "worker", value: 2 },
    { source: "worker", target: "db" },
  ],
};

export const graphData = {
  nodes: [
    { id: "ui", label: "UI Kit", group: 0 },
    { id: "web", label: "Web App", group: 0 },
    { id: "mobile", label: "Mobile", group: 0 },
    { id: "gateway", label: "Gateway", group: 1 },
    { id: "auth", label: "Auth", group: 1 },
    { id: "billing", label: "Billing", group: 1 },
    { id: "orders", label: "Orders", group: 2 },
    { id: "catalog", label: "Catalog", group: 2 },
    { id: "search", label: "Search", group: 2 },
    { id: "postgres", label: "Postgres", group: 3 },
    { id: "redis", label: "Redis", group: 3 },
    { id: "kafka", label: "Kafka", group: 3 },
  ],
  links: [
    { source: "ui", target: "web" },
    { source: "ui", target: "mobile" },
    { source: "web", target: "gateway", value: 3 },
    { source: "mobile", target: "gateway", value: 2 },
    { source: "gateway", target: "auth", value: 2 },
    { source: "gateway", target: "billing" },
    { source: "gateway", target: "orders", value: 2 },
    { source: "gateway", target: "catalog", value: 2 },
    { source: "gateway", target: "search" },
    { source: "auth", target: "postgres" },
    { source: "billing", target: "postgres", value: 2 },
    { source: "orders", target: "postgres", value: 2 },
    { source: "orders", target: "kafka", value: 2 },
    { source: "catalog", target: "postgres" },
    { source: "catalog", target: "redis", value: 2 },
    { source: "search", target: "redis" },
    { source: "search", target: "kafka" },
    { source: "orders", target: "billing" },
    { source: "catalog", target: "search", value: 2 },
  ],
};

export const parallelSetsData = [
  { class: "First", sex: "Female", survived: "Yes", n: 140 },
  { class: "First", sex: "Female", survived: "No", n: 4 },
  { class: "First", sex: "Male", survived: "Yes", n: 60 },
  { class: "First", sex: "Male", survived: "No", n: 118 },
  { class: "Second", sex: "Female", survived: "Yes", n: 90 },
  { class: "Second", sex: "Female", survived: "No", n: 13 },
  { class: "Second", sex: "Male", survived: "Yes", n: 25 },
  { class: "Second", sex: "Male", survived: "No", n: 146 },
  { class: "Third", sex: "Female", survived: "Yes", n: 90 },
  { class: "Third", sex: "Female", survived: "No", n: 106 },
  { class: "Third", sex: "Male", survived: "Yes", n: 58 },
  { class: "Third", sex: "Male", survived: "No", n: 418 },
];

export const pyramidData = [
  { label: "0–9", left: 82, right: 78 },
  { label: "10–19", left: 90, right: 86 },
  { label: "20–29", left: 96, right: 99 },
  { label: "30–39", left: 88, right: 92 },
  { label: "40–49", left: 74, right: 79 },
  { label: "50–59", left: 61, right: 68 },
  { label: "60–69", left: 43, right: 52 },
  { label: "70–79", left: 24, right: 35 },
  { label: "80+", left: 10, right: 21 },
];

export const dependencyWheelData = {
  links: [
    { source: "app", target: "ui", value: 8 },
    { source: "app", target: "router", value: 5 },
    { source: "app", target: "store", value: 6 },
    { source: "ui", target: "utils", value: 7 },
    { source: "router", target: "utils", value: 3 },
    { source: "store", target: "utils", value: 4 },
    { source: "store", target: "api", value: 5 },
    { source: "api", target: "utils", value: 6 },
    { source: "ui", target: "icons", value: 4 },
  ],
};

export const networkFlowData = {
  links: [
    { source: "Ingress", target: "Auth", value: 100 },
    { source: "Auth", target: "Router", value: 92 },
    { source: "Auth", target: "Reject", value: 8 },
    { source: "Router", target: "Orders", value: 40 },
    { source: "Router", target: "Catalog", value: 34 },
    { source: "Router", target: "Search", value: 18 },
    { source: "Orders", target: "DB", value: 40 },
    { source: "Catalog", target: "DB", value: 20 },
    { source: "Catalog", target: "Cache", value: 14 },
    { source: "Search", target: "Cache", value: 18 },
  ],
};

export const journeyStages = [
  { label: "Awareness", value: 1000, sentiment: 0.3 },
  { label: "Consideration", value: 680, sentiment: 0.5 },
  { label: "Trial", value: 420, sentiment: 0.1 },
  { label: "Purchase", value: 240, sentiment: -0.2 },
  { label: "Onboarding", value: 190, sentiment: 0.4 },
  { label: "Advocacy", value: 120, sentiment: 0.8 },
];

export const orgData: OrgNode = {
  id: "1",
  name: "Jordan Lee",
  title: "Chief Executive Officer",
  children: [
    {
      id: "2",
      name: "Sam Rivera",
      title: "CTO",
      children: [
        { id: "5", name: "Priya Nair", title: "Eng Lead" },
        { id: "6", name: "Diego Marín", title: "Platform" },
      ],
    },
    {
      id: "3",
      name: "Nia Chen",
      title: "VP Design",
      children: [{ id: "7", name: "Leo Kim", title: "Product Design" }],
    },
    { id: "4", name: "Mara Okoye", title: "VP Sales" },
  ],
};

export const ganttTasks: GanttTask[] = [
  { id: "1", name: "Research", start: "2026-01-05", end: "2026-01-15", group: "Discovery", progress: 1 },
  { id: "2", name: "Wireframes", start: "2026-01-12", end: "2026-01-22", group: "Design", progress: 0.85 },
  { id: "3", name: "UI Kit", start: "2026-01-20", end: "2026-02-05", group: "Design", progress: 0.5 },
  { id: "4", name: "API build", start: "2026-01-25", end: "2026-02-20", group: "Engineering", progress: 0.35 },
  { id: "5", name: "Integration", start: "2026-02-10", end: "2026-02-24", group: "Engineering", progress: 0.1 },
  { id: "6", name: "Beta launch", start: "2026-02-25", end: "2026-02-25", milestone: true },
];

export const resourceTasks: ResourceTask[] = [
  { id: "r1", resource: "Alice", label: "Research", start: "2026-01-05", end: "2026-01-12" },
  { id: "r2", resource: "Alice", label: "Spec review", start: "2026-01-10", end: "2026-01-16" },
  { id: "r3", resource: "Alice", label: "Handoff", start: "2026-01-18", end: "2026-01-24" },
  { id: "r4", resource: "Bob", label: "API build", start: "2026-01-08", end: "2026-01-20" },
  { id: "r5", resource: "Bob", label: "Testing", start: "2026-01-21", end: "2026-01-28" },
  { id: "r6", resource: "Carol", label: "UI kit", start: "2026-01-06", end: "2026-01-14" },
  { id: "r7", resource: "Carol", label: "Polish", start: "2026-01-15", end: "2026-01-22" },
  { id: "r8", resource: "Dev", label: "Infra", start: "2026-01-04", end: "2026-01-26" },
];

export const swimlaneEvents: SwimlaneEvent[] = [
  { id: "s1", lane: "Design", label: "Wireframes", start: "2026-01-05", end: "2026-01-11" },
  { id: "s2", lane: "Design", label: "Mockups", start: "2026-01-12", end: "2026-01-18" },
  { id: "s3", lane: "Build", label: "Backend", start: "2026-01-08", end: "2026-01-20" },
  { id: "s4", lane: "Build", label: "Frontend", start: "2026-01-14", end: "2026-01-24" },
  { id: "s5", lane: "Release", label: "RC", start: "2026-01-22" },
  { id: "s6", lane: "Release", label: "GA", start: "2026-01-28" },
  { id: "s7", lane: "Marketing", label: "Campaign", start: "2026-01-16", end: "2026-01-30" },
];

const dropDay = (d: number): string => `2026-01-${String(d).padStart(2, "0")}`;

export const eventDropRows: EventDropsRow[] = [
  {
    label: "Deploys",
    events: [3, 5, 6, 9, 12, 12, 15, 19, 22, 27].map((d) => ({ time: dropDay(d) })),
  },
  {
    label: "Incidents",
    events: [
      { time: dropDay(6), magnitude: 3 },
      { time: dropDay(13), magnitude: 1 },
      { time: dropDay(20), magnitude: 2 },
    ],
  },
  {
    label: "Signups",
    events: [1, 2, 4, 4, 7, 8, 10, 11, 14, 17, 18, 21, 24, 26, 29].map((d) => ({
      time: dropDay(d),
    })),
  },
];

export const agentData: { nodes: AgentNodeInput[]; edges: AgentEdgeInput[] } = {
  nodes: [
    { id: "planner", label: "Planner", type: "planner", status: "success" },
    { id: "retriever", label: "Retriever", type: "retriever", status: "success", latencyMs: 180 },
    { id: "vs", label: "Vector Store", type: "vectorstore", status: "success" },
    { id: "tool", label: "Web Search", type: "tool", status: "running", latencyMs: 420 },
    { id: "mem", label: "Memory", type: "memory", status: "idle" },
    { id: "llm", label: "GPT-4o", type: "llm", status: "streaming", tokens: 1536 },
    { id: "out", label: "Response", type: "response", status: "idle" },
  ],
  edges: [
    { source: "planner", target: "retriever" },
    { source: "retriever", target: "vs" },
    { source: "planner", target: "tool" },
    { source: "vs", target: "llm" },
    { source: "tool", target: "llm" },
    { source: "mem", target: "llm" },
    { source: "llm", target: "out", active: true },
  ],
};

export const geoData: GeoPoint[] = [
  { lat: 40.71, lon: -74.0, value: 120, label: "New York" },
  { lat: 51.51, lon: -0.13, value: 90, label: "London" },
  { lat: 35.68, lon: 139.69, value: 150, label: "Tokyo" },
  { lat: -33.87, lon: 151.21, value: 60, label: "Sydney" },
  { lat: 1.35, lon: 103.82, value: 80, label: "Singapore" },
  { lat: 37.77, lon: -122.42, value: 110, label: "San Francisco" },
  { lat: 48.85, lon: 2.35, value: 70, label: "Paris" },
  { lat: -23.55, lon: -46.63, value: 95, label: "São Paulo" },
];

// --- Charts sample data ---------------------------------------------------

export const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];

export const lineSeries = [
  { name: "Revenue", data: [12, 19, 15, 27, 24, 31, 29, 38] },
  { name: "Expenses", data: [8, 11, 9, 14, 13, 17, 16, 19] },
];

export const areaSeries = [
  { name: "Mobile", data: [3, 5, 4, 7, 6, 9, 8, 11] },
  { name: "Desktop", data: [6, 4, 8, 5, 9, 7, 10, 8] },
  { name: "Tablet", data: [1, 2, 2, 3, 2, 4, 3, 5] },
];

export const barCategories = ["Q1", "Q2", "Q3", "Q4"];
export const barSeries = [
  { name: "2023", data: [42, 58, 46, 69] },
  { name: "2024", data: [56, 51, 72, 84] },
];

// --- Extended cartesian charts (waterfall / pareto / combo / range / stream) ---
export const waterfallData = [
  { label: "Start", value: 120 },
  { label: "New", value: 48 },
  { label: "Upsell", value: 22 },
  { label: "Churn", value: -31 },
  { label: "Refunds", value: -14 },
  { label: "Net", value: 0, isTotal: true },
];

export const paretoData = [
  { label: "Checkout", value: 42 },
  { label: "Search", value: 31 },
  { label: "Login", value: 18 },
  { label: "Profile", value: 12 },
  { label: "Settings", value: 7 },
  { label: "Other", value: 4 },
];

export const comboBars = [{ name: "Revenue", data: [12, 19, 15, 27, 24, 31, 29, 38] }];
export const comboLines = [{ name: "Margin %", data: [22, 28, 24, 33, 30, 38, 35, 41] }];

export const rangeBarData = [
  { label: "Mon", low: 12, high: 21 },
  { label: "Tue", low: 14, high: 24 },
  { label: "Wed", low: 11, high: 19 },
  { label: "Thu", low: 15, high: 26 },
  { label: "Fri", low: 17, high: 28 },
  { label: "Sat", low: 16, high: 25 },
  { label: "Sun", low: 13, high: 22 },
];

export const streamSeries = [
  { name: "Search", data: [8, 10, 9, 14, 12, 16, 15, 20] },
  { name: "Social", data: [4, 6, 7, 5, 9, 8, 12, 10] },
  { name: "Direct", data: [6, 5, 8, 7, 6, 9, 8, 11] },
  { name: "Email", data: [2, 3, 3, 4, 5, 4, 6, 7] },
];

// Phase 9 — cartesian finish
export const stepCategories = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"];
export const stepSeries = [
  { name: "Plan A", data: [20, 20, 45, 45, 30, 30] },
  { name: "Plan B", data: [10, 25, 25, 40, 40, 22] },
];

export const percentColumnCategories = ["Q1", "Q2", "Q3", "Q4"];
export const percentColumnSeries = [
  { name: "Desktop", data: [42, 38, 30, 26] },
  { name: "Mobile", data: [28, 34, 41, 48] },
  { name: "Tablet", data: [12, 10, 9, 8] },
];


export const nestedPieData = [
  {
    label: "Web",
    children: [
      { label: "Mobile", value: 34 },
      { label: "Desktop", value: 22 },
      { label: "Tablet", value: 8 },
    ],
  },
  {
    label: "App",
    children: [
      { label: "iOS", value: 18 },
      { label: "Android", value: 14 },
    ],
  },
  { label: "API", value: 12 },
];

export const roseData = [
  { label: "Mon", value: 12 },
  { label: "Tue", value: 30 },
  { label: "Wed", value: 22 },
  { label: "Thu", value: 27 },
  { label: "Fri", value: 34 },
  { label: "Sat", value: 18 },
  { label: "Sun", value: 9 },
];

export const radialLineSeries = [
  { name: "2024", data: [6, 8, 7, 12, 10, 14, 13, 9] },
  { name: "2025", data: [9, 11, 10, 16, 14, 19, 17, 12] },
];

export const waffleData = [
  { label: "Renewable", value: 42 },
  { label: "Gas", value: 33 },
  { label: "Coal", value: 15 },
  { label: "Other", value: 10 },
];


export const scatterSeries = [
  {
    name: "Segment A",
    data: [
      { x: 10, y: 20, r: 5 }, { x: 15, y: 12, r: 12 }, { x: 22, y: 28, r: 8 },
      { x: 31, y: 18, r: 18 }, { x: 40, y: 35, r: 10 }, { x: 18, y: 42, r: 6 },
    ],
  },
  {
    name: "Segment B",
    data: [
      { x: 25, y: 8, r: 9 }, { x: 33, y: 24, r: 14 }, { x: 45, y: 15, r: 7 },
      { x: 12, y: 30, r: 11 }, { x: 38, y: 45, r: 16 },
    ],
  },
];

export const pieData = [
  { label: "Chrome", value: 63 },
  { label: "Safari", value: 20 },
  { label: "Edge", value: 9 },
  { label: "Firefox", value: 5 },
  { label: "Other", value: 3 },
];

export const radarIndicators = ["Speed", "Power", "Range", "Agility", "Safety", "Cost"];
export const radarSeries = [
  { name: "Model X", data: [4, 5, 3, 4, 5, 2] },
  { name: "Model Y", data: [3, 3, 5, 5, 4, 4] },
];

export const radialData = [
  { label: "CPU", value: 72 },
  { label: "Memory", value: 48 },
  { label: "Disk", value: 30 },
  { label: "Network", value: 61 },
];

export const funnelData = [
  { label: "Visits", value: 12400 },
  { label: "Signups", value: 5200 },
  { label: "Trials", value: 2100 },
  { label: "Paid", value: 640 },
];

export const sparklineData = [3, 5, 4, 8, 6, 9, 7, 11, 9, 13, 12, 15];

// --- Stats sample data ----------------------------------------------------

/** Deterministic pseudo-random normal-ish sample (Box–Muller, seeded). */
function sample(seed: number, n: number, mean: number, sd: number): number[] {
  let s = seed;
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  return Array.from({ length: n }, () => {
    const u1 = Math.max(1e-9, rand());
    const u2 = rand();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return Math.round((mean + z * sd) * 10) / 10;
  });
}

export const distributionGroups = [
  { label: "Control", values: sample(7, 60, 50, 12) },
  { label: "Variant A", values: sample(21, 60, 58, 9) },
  { label: "Variant B", values: sample(42, 60, 54, 16) },
];

export const histogramValues = sample(99, 400, 100, 22);

export const densitySeries = [
  { name: "Group A", values: sample(3, 120, 40, 8) },
  { name: "Group B", values: sample(88, 120, 55, 12) },
];

export const hexbinPoints = (() => {
  const a = sample(11, 500, 50, 14);
  const b = sample(23, 500, 50, 14);
  return a.map((x, i) => ({ x, y: b[i] ?? 50 }));
})();

/** Two overlapping gaussian clusters for density heatmap / contour / marginal. */
export const scatterCloud = (() => {
  const ax = sample(61, 260, 40, 9);
  const ay = sample(62, 260, 45, 8);
  const bx = sample(63, 180, 62, 7);
  const by = sample(64, 180, 60, 10);
  return [
    ...ax.map((x, i) => ({ x, y: ay[i] ?? 45 })),
    ...bx.map((x, i) => ({ x, y: by[i] ?? 60 })),
  ];
})();

export const errorData = [
  { label: "Jan", value: 42, error: 6 },
  { label: "Feb", value: 48, error: 5 },
  { label: "Mar", value: 46, low: 40, high: 55 },
  { label: "Apr", value: 53, error: 7 },
  { label: "May", value: 61, error: 4 },
  { label: "Jun", value: 58, low: 50, high: 69 },
];

export const regressionPoints = (() => {
  const xs = sample(5, 40, 50, 18);
  return xs.map((x, i) => ({ x, y: 12 + x * 0.8 + (sample(9 + i, 1, 0, 9)[0] ?? 0) }));
})();

export const qqValues = sample(31, 120, 100, 15);

export const ridgelineGroups = [
  { label: "Jan", values: sample(2, 80, 42, 8) },
  { label: "Feb", values: sample(6, 80, 46, 9) },
  { label: "Mar", values: sample(14, 80, 52, 11) },
  { label: "Apr", values: sample(27, 80, 58, 10) },
  { label: "May", values: sample(53, 80, 63, 12) },
];

// ---- Hierarchy charts (treemap / sunburst / icicle / tree / circle pack) ----
export const hierarchyData = {
  name: "Company",
  children: [
    {
      name: "Engineering",
      children: [
        {
          name: "Platform",
          children: [
            { name: "API", value: 26 },
            { name: "Infra", value: 18 },
            { name: "Data", value: 14 },
          ],
        },
        {
          name: "Product",
          children: [
            { name: "Web", value: 22 },
            { name: "Mobile", value: 16 },
            { name: "Design Sys", value: 9 },
          ],
        },
      ],
    },
    {
      name: "Go-To-Market",
      children: [
        { name: "Sales", value: 30 },
        { name: "Marketing", value: 20 },
        { name: "Success", value: 12 },
      ],
    },
    {
      name: "Operations",
      children: [
        { name: "Finance", value: 11 },
        { name: "People", value: 8 },
        { name: "Legal", value: 5 },
      ],
    },
  ],
};

// ---- Finance charts (candlestick / OHLC / kagi / renko / horizon) ----------
export const ohlcData = (() => {
  let s = 7;
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  let price = 120;
  return Array.from({ length: 40 }, (_, i) => {
    const drift = Math.sin(i / 5) * 2 + (rand() - 0.48) * 6;
    const open = price;
    const close = Math.max(40, open + drift);
    const high = Math.max(open, close) + rand() * 4;
    const low = Math.min(open, close) - rand() * 4;
    price = close;
    const d = new Date(2024, 0, 1 + i);
    return {
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
    };
  });
})();

// ---- Flow expansion (alluvial / parallel coordinates / chord) --------------
export const alluvialFlows = [
  { path: ["Mobile", "Trial", "Paid"], value: 32 },
  { path: ["Mobile", "Trial", "Churn"], value: 14 },
  { path: ["Mobile", "Direct", "Paid"], value: 10 },
  { path: ["Web", "Trial", "Paid"], value: 24 },
  { path: ["Web", "Trial", "Churn"], value: 18 },
  { path: ["Web", "Direct", "Paid"], value: 16 },
  { path: ["Referral", "Direct", "Paid"], value: 12 },
  { path: ["Referral", "Trial", "Churn"], value: 6 },
];

export const parallelDimensions = [
  { key: "price", label: "Price ($k)" },
  { key: "range", label: "Range (mi)" },
  { key: "power", label: "Power (hp)" },
  { key: "weight", label: "Weight (t)" },
  { key: "score", label: "Score" },
];

export const parallelData = [
  { price: 38, range: 260, power: 283, weight: 1.8, score: 82 },
  { price: 52, range: 330, power: 355, weight: 2.1, score: 90 },
  { price: 44, range: 300, power: 300, weight: 1.9, score: 86 },
  { price: 70, range: 405, power: 500, weight: 2.3, score: 95 },
  { price: 33, range: 220, power: 201, weight: 1.6, score: 74 },
  { price: 60, range: 360, power: 430, weight: 2.2, score: 92 },
  { price: 29, range: 180, power: 150, weight: 1.4, score: 66 },
];

export const parallelCategories = [
  "Sedan", "Sport", "Sedan", "Sport", "Compact", "Sport", "Compact",
];

export const chordLabels = ["North", "South", "East", "West", "Central"];
export const chordMatrix = [
  [0, 8, 5, 3, 6],
  [7, 0, 4, 9, 2],
  [4, 6, 0, 5, 8],
  [3, 7, 6, 0, 4],
  [5, 2, 9, 4, 0],
];

// ---- Geo expansion (choropleth / connection map) ---------------------------
/** Simple rectangular "regions" laid out on a grid (lon/lat) for demo purposes. */
export const choroplethRegions = (() => {
  const names = ["Alta", "Borealis", "Caldera", "Delta", "Estura", "Faro", "Gale", "Hollow", "Iris"];
  let s = 11;
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  const regions = [];
  let idx = 0;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const lon0 = -60 + col * 30;
      const lat0 = 45 - row * 30;
      regions.push({
        id: names[idx]!,
        label: names[idx]!,
        value: Math.round(rand() * 100),
        rings: [[
          { lat: lat0, lon: lon0 },
          { lat: lat0, lon: lon0 + 28 },
          { lat: lat0 - 28, lon: lon0 + 28 },
          { lat: lat0 - 28, lon: lon0 },
        ]],
      });
      idx++;
    }
  }
  return regions;
})();

export const connectionPoints = geoData.map((p, i) => ({
  id: String(i),
  lat: p.lat,
  lon: p.lon,
  label: p.label,
  value: p.value,
}));

export const connections = [
  { source: "5", target: "0", value: 9 }, // SF -> NY
  { source: "0", target: "1", value: 7 }, // NY -> London
  { source: "1", target: "6", value: 5 }, // London -> Paris
  { source: "1", target: "4", value: 6 }, // London -> Singapore
  { source: "4", target: "2", value: 8 }, // Singapore -> Tokyo
  { source: "4", target: "3", value: 4 }, // Singapore -> Sydney
  { source: "0", target: "7", value: 5 }, // NY -> São Paulo
];

// ---- Maps expansion (bubble / geo-heatmap / cartogram / hexbin / tile-grid) -
export const bubbleCities: BubbleDatum[] = [
  { lat: 35.68, lon: 139.69, value: 37_400_000, label: "Tokyo" },
  { lat: 28.61, lon: 77.21, value: 30_300_000, label: "Delhi" },
  { lat: 31.23, lon: 121.47, value: 27_100_000, label: "Shanghai" },
  { lat: -23.55, lon: -46.63, value: 22_000_000, label: "São Paulo" },
  { lat: 19.43, lon: -99.13, value: 21_800_000, label: "Mexico City" },
  { lat: 40.71, lon: -74.0, value: 18_800_000, label: "New York" },
  { lat: 51.51, lon: -0.13, value: 9_400_000, label: "London" },
  { lat: 6.52, lon: 3.37, value: 15_400_000, label: "Lagos" },
];

/** Deterministic cluster of geo samples for density / hexbin demos. */
export const geoHeatPoints: GeoHeatPoint[] = (() => {
  const centers = [
    { lat: 40.7, lon: -74 },
    { lat: 34.05, lon: -118.24 },
    { lat: 41.88, lon: -87.63 },
    { lat: 29.76, lon: -95.37 },
  ];
  let s = 7;
  const rand = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff - 0.5;
  };
  const points: GeoHeatPoint[] = [];
  centers.forEach((c, ci) => {
    const n = 40 - ci * 6;
    for (let i = 0; i < n; i++) {
      points.push({ lat: c.lat + rand() * 8, lon: c.lon + rand() * 10 });
    }
  });
  return points;
})();

export const hexbinGeoPoints: HexbinPoint[] = geoHeatPoints.map((p) => ({
  lat: p.lat,
  lon: p.lon,
}));

/** Cartogram reuses the choropleth regions, scaled by value. */
export const cartogramRegions = choroplethRegions;

/** US-style tile-grid map: row/col lattice with a value per state. */
export const tileGridStates: TileDatum[] = [
  { id: "WA", row: 0, col: 0, value: 7.7 },
  { id: "MT", row: 0, col: 2, value: 1.1 },
  { id: "ND", row: 0, col: 5, value: 0.8 },
  { id: "MN", row: 0, col: 6, value: 5.7 },
  { id: "MI", row: 0, col: 8, value: 10 },
  { id: "NY", row: 0, col: 10, value: 19.5 },
  { id: "OR", row: 1, col: 1, value: 4.2 },
  { id: "ID", row: 1, col: 2, value: 1.9 },
  { id: "WY", row: 1, col: 3, value: 0.6 },
  { id: "SD", row: 1, col: 5, value: 0.9 },
  { id: "IA", row: 1, col: 6, value: 3.2 },
  { id: "IL", row: 1, col: 7, value: 12.6 },
  { id: "IN", row: 1, col: 8, value: 6.8 },
  { id: "OH", row: 1, col: 9, value: 11.7 },
  { id: "PA", row: 1, col: 10, value: 13 },
  { id: "CA", row: 2, col: 1, value: 39.5 },
  { id: "NV", row: 2, col: 2, value: 3.1 },
  { id: "CO", row: 2, col: 4, value: 5.8 },
  { id: "NE", row: 2, col: 5, value: 1.9 },
  { id: "MO", row: 2, col: 6, value: 6.1 },
  { id: "KY", row: 2, col: 8, value: 4.5 },
  { id: "TX", row: 3, col: 4, value: 29 },
  { id: "OK", row: 3, col: 5, value: 4 },
  { id: "AR", row: 3, col: 6, value: 3 },
  { id: "TN", row: 3, col: 7, value: 6.9 },
  { id: "GA", row: 3, col: 8, value: 10.6 },
  { id: "FL", row: 4, col: 8, value: 21.5 },
];

// ---- KPI kit (stat card / bullet / slope / dumbbell / lollipop) ------------
export const mrrTrend = [41, 42, 44, 43, 46, 45, 48, 48.2];

export const bulletMetrics = [
  { label: "Revenue", measure: 82, target: 90, ranges: [50, 75, 100] },
  { label: "Signups", measure: 68, target: 60, ranges: [40, 60, 80] },
  { label: "Latency", measure: 42, target: 30, ranges: [25, 50, 75] },
];

export const slopeData = [
  { label: "North", start: 40, end: 62 },
  { label: "South", start: 55, end: 48 },
  { label: "East", start: 30, end: 71 },
  { label: "West", start: 66, end: 58 },
];

export const dumbbellData = [
  { label: "Onboarding", start: 30, end: 72 },
  { label: "Activation", start: 44, end: 66 },
  { label: "Retention", start: 58, end: 61 },
  { label: "Referral", start: 22, end: 49 },
  { label: "Revenue", start: 51, end: 78 },
];

export const lollipopData = [
  { label: "Alpha", value: 82 },
  { label: "Beta", value: 61 },
  { label: "Gamma", value: 47 },
  { label: "Delta", value: 73 },
  { label: "Epsilon", value: 35 },
  { label: "Zeta", value: 58 },
];

// ---- Comparison & matrix (polar area / heatmap matrix) ---------------------
export const polarAreaCategories = ["Q1", "Q2", "Q3", "Q4"];
export const polarAreaSeries: ChartSeries[] = [
  { name: "Web", data: [18, 24, 21, 30] },
  { name: "Mobile", data: [12, 16, 20, 26] },
  { name: "API", data: [8, 10, 14, 12] },
];

export const heatmapMatrixData: MatrixDatum[] = (() => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const hours = ["8a", "10a", "12p", "2p", "4p", "6p"];
  const out: MatrixDatum[] = [];
  for (let d = 0; d < days.length; d++) {
    for (let h = 0; h < hours.length; h++) {
      const peak = Math.exp(-((h - 2.5) ** 2) / 6) * (1 - d * 0.08);
      out.push({ row: days[d]!, col: hours[h]!, value: Math.round(peak * 90 + 6) });
    }
  }
  return out;
})();

// ---- KPI range/gradient band & trend delta ---------------------------------
export const gradientBandZones: BandZone[] = [
  { from: 0, label: "Fast" },
  { from: 200, label: "OK" },
  { from: 400, label: "Slow" },
];
export const churnTrend = [3.1, 2.9, 3.0, 2.6, 2.7, 2.4, 2.3, 2.1];




