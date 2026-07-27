import { useState, type ReactNode } from "react";
import { ThemeProvider, useTheme, type ZenithTheme } from "@zenith-visuals/core";
import { oceanTheme, sunsetTheme, midnightTheme } from "@zenith-visuals/themes";
import { CalendarHeatmap } from "@zenith-visuals/heatmap";
import { ActivityTimeline, ResourceTimeline, Swimlane, EventDrops } from "@zenith-visuals/timeline";
import { Sankey, Alluvial, ParallelCoordinates, Chord, ParallelSets, Pyramid, DependencyWheel, NetworkFlow, Journey } from "@zenith-visuals/flow";
import { NetworkGraph, ArcDiagram, AdjacencyMatrix, EdgeBundling } from "@zenith-visuals/network";
import { OrgChart } from "@zenith-visuals/orgchart";
import { Gantt } from "@zenith-visuals/gantt";
import { AgentGraph } from "@zenith-visuals/ai";
import { GeoScatter, Choropleth, ConnectionMap, BubbleMap, GeoHeatmap, Cartogram, HexbinMap, TileGridMap } from "@zenith-visuals/maps";
import {
  StatCard,
  BulletChart,
  SlopeChart,
  DumbbellChart,
  LollipopChart,
  GradientBand,
  TrendDeltaCard,
} from "@zenith-visuals/kpi";
import {
  LineChart,
  AreaChart,
  BarChart,
  ScatterChart,
  PieChart,
  RadarChart,
  RadialBarChart,
  GaugeChart,
  FunnelChart,
  Sparkline,
  WaterfallChart,
  ParetoChart,
  ComboChart,
  RangeBarChart,
  StreamGraph,
  HalfDonutChart,
  NestedPieChart,
  RoseChart,
  RadialLineChart,
  SolidGaugeChart,
  ProgressRing,
  WaffleChart,
  StepLineChart,
  PercentColumnChart,
  PolarAreaChart,
  HeatmapMatrix,
} from "@zenith-visuals/charts";
import {
  BoxPlot,
  ViolinPlot,
  Histogram,
  DensityPlot,
  Hexbin,
  ErrorBarChart,
  RegressionChart,
  StripPlot,
  BeeswarmChart,
  QQPlot,
  RidgelineChart,
  DensityHeatmap,
  ContourPlot,
  MarginalHistogram,
} from "@zenith-visuals/stats";
import {
  Treemap,
  Sunburst,
  Icicle,
  Tree,
  CirclePack,
  RadialTree,
  Dendrogram,
  Cluster,
  MindMap,
} from "@zenith-visuals/hierarchy";
import {
  CandlestickChart,
  OHLCChart,
  KagiChart,
  RenkoChart,
  HorizonChart,
} from "@zenith-visuals/finance";
import {
  Bolt,
  Calendar,
  Check,
  ChevronRight,
  Download,
  GitBranch,
  Search,
  User,
  ZoomIn,
} from "@zenith-visuals/icons";
import {
  activities,
  agentData,
  alluvialFlows,
  areaSeries,
  barCategories,
  barSeries,
  bubbleCities,
  bulletMetrics,
  cartogramRegions,
  chordLabels,
  chordMatrix,
  choroplethRegions,
  comboBars,
  comboLines,
  connectionPoints,
  connections,
  densitySeries,
  distributionGroups,
  dumbbellData,
  errorData,
  eventDropRows,
  funnelData,
  ganttTasks,
  geoData,
  geoHeatPoints,
  graphData,
  heatmapData,
  hexbinPoints,
  hexbinGeoPoints,
  hierarchyData,
  histogramValues,
  lineSeries,
  lollipopData,
  months,
  mrrTrend,
  churnTrend,
  gradientBandZones,
  heatmapMatrixData,
  polarAreaCategories,
  polarAreaSeries,
  nestedPieData,
  networkData,
  ohlcData,
  orgData,
  parallelCategories,
  parallelData,
  parallelDimensions,
  parallelSetsData,
  paretoData,
  percentColumnCategories,
  percentColumnSeries,
  pieData,
  pyramidData,
  dependencyWheelData,
  journeyStages,
  networkFlowData,
  radarIndicators,
  radarSeries,
  radialData,
  radialLineSeries,
  rangeBarData,
  regressionPoints,
  resourceTasks,
  roseData,
  sankeyData,
  swimlaneEvents,
  scatterSeries,
  scatterCloud,
  slopeData,
  sparklineData,
  qqValues,
  ridgelineGroups,
  stepCategories,
  stepSeries,
  streamSeries,
  tileGridStates,
  waffleData,
  waterfallData,
} from "./data";

type ThemeChoice = "light" | "dark" | "ocean" | "sunset" | "midnight";

const THEMES: Record<ThemeChoice, { mode?: "light" | "dark"; theme?: ZenithTheme }> = {
  light: { mode: "light" },
  dark: { mode: "dark" },
  ocean: { theme: oceanTheme },
  sunset: { theme: sunsetTheme },
  midnight: { theme: midnightTheme },
};

export function App() {
  const [choice, setChoice] = useState<ThemeChoice>("light");
  return (
    <ThemeProvider {...THEMES[choice]}>
      <Shell choice={choice} onChoice={setChoice} />
    </ThemeProvider>
  );
}

function Shell({ choice, onChoice }: { choice: ThemeChoice; onChoice: (c: ThemeChoice) => void }) {
  const theme = useTheme();
  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.colors.background,
        color: theme.colors.text,
        fontFamily: theme.typography.fontFamily,
        transition: "background 200ms ease, color 200ms ease",
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 28px",
          background: theme.colors.surface,
          borderBottom: `1px solid ${theme.colors.border}`,
          backdropFilter: "saturate(180%) blur(6px)",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: theme.typography.fontWeightBold }}>
            Zenith Visuals
          </h1>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: theme.colors.textMuted }}>
            The ultimate React visualization SDK — live component gallery
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {(Object.keys(THEMES) as ThemeChoice[]).map((key) => {
            const active = key === choice;
            return (
              <button
                key={key}
                onClick={() => onChoice(key)}
                style={{
                  cursor: "pointer",
                  textTransform: "capitalize",
                  padding: "7px 14px",
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  color: active ? theme.colors.background : theme.colors.text,
                  background: active ? theme.colors.primary : "transparent",
                  border: `1px solid ${active ? theme.colors.primary : theme.colors.border}`,
                  borderRadius: theme.radii.full,
                  transition: "all 150ms ease",
                }}
              >
                {key}
              </button>
            );
          })}
        </div>
      </header>

      <main
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: 20,
          padding: 28,
          maxWidth: 1400,
          margin: "0 auto",
        }}
      >
        <Section title="Calendar Heatmap" pkg="@zenith-visuals/heatmap" span>
          <CalendarHeatmap data={heatmapData} rangeDays={365} weekStartsOn={1} showLegend />
        </Section>

        <Section title="Line Chart" pkg="@zenith-visuals/charts">
          <LineChart categories={months} series={lineSeries} smooth height={280} />
        </Section>

        <Section title="Stacked Area" pkg="@zenith-visuals/charts">
          <AreaChart categories={months} series={areaSeries} stacked smooth height={280} />
        </Section>

        <Section title="Grouped Bar" pkg="@zenith-visuals/charts">
          <BarChart categories={barCategories} series={barSeries} height={280} />
        </Section>

        <Section title="Bubble / Scatter" pkg="@zenith-visuals/charts">
          <ScatterChart series={scatterSeries} height={280} />
        </Section>

        <Section title="Donut Chart" pkg="@zenith-visuals/charts">
          <PieChart data={pieData} innerRadius={0.62} centerLabel="Share" height={280} />
        </Section>

        <Section title="Radar Chart" pkg="@zenith-visuals/charts">
          <RadarChart indicators={radarIndicators} series={radarSeries} height={280} />
        </Section>

        <Section title="Radial Bars" pkg="@zenith-visuals/charts">
          <RadialBarChart data={radialData} maxValue={100} height={280} />
        </Section>

        <Section title="Gauge" pkg="@zenith-visuals/charts">
          <GaugeChart
            value={72}
            max={100}
            unit="% CPU"
            thresholds={[[0, "#22c55e"], [0.6, "#eab308"], [0.85, "#ef4444"]]}
            height={240}
          />
        </Section>

        <Section title="Funnel" pkg="@zenith-visuals/charts">
          <FunnelChart data={funnelData} height={280} />
        </Section>

        <Section title="Sparklines" pkg="@zenith-visuals/charts">
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Sparkline data={sparklineData} variant="line" smooth width={160} height={36} />
              <span style={{ fontSize: 13, color: theme.colors.textMuted }}>Line · smooth</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Sparkline data={sparklineData} variant="area" smooth width={160} height={36} />
              <span style={{ fontSize: 13, color: theme.colors.textMuted }}>Area</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Sparkline data={sparklineData} variant="bar" width={160} height={36} />
              <span style={{ fontSize: 13, color: theme.colors.textMuted }}>Bar</span>
            </div>
          </div>
        </Section>

        <Section title="Waterfall" pkg="@zenith-visuals/charts">
          <WaterfallChart data={waterfallData} height={300} />
        </Section>

        <Section title="Pareto" pkg="@zenith-visuals/charts">
          <ParetoChart data={paretoData} height={300} />
        </Section>

        <Section title="Combo (bar + line)" pkg="@zenith-visuals/charts">
          <ComboChart categories={months} series={comboBars} lineSeries={comboLines} secondaryAxis height={300} />
        </Section>

        <Section title="Range Bar" pkg="@zenith-visuals/charts">
          <RangeBarChart data={rangeBarData} height={300} />
        </Section>

        <Section title="Stream / ThemeRiver" pkg="@zenith-visuals/charts" span>
          <StreamGraph categories={months} series={streamSeries} height={300} />
        </Section>

        <Section title="Half Donut" pkg="@zenith-visuals/charts">
          <HalfDonutChart data={pieData} centerLabel="63%" height={240} />
        </Section>

        <Section title="Nested Pie" pkg="@zenith-visuals/charts">
          <NestedPieChart data={nestedPieData} height={320} />
        </Section>

        <Section title="Rose / Nightingale" pkg="@zenith-visuals/charts">
          <RoseChart data={roseData} height={320} />
        </Section>

        <Section title="Radial Line" pkg="@zenith-visuals/charts">
          <RadialLineChart categories={months} series={radialLineSeries} area height={320} />
        </Section>

        <Section title="Solid Gauge" pkg="@zenith-visuals/charts">
          <SolidGaugeChart value={72} max={100} unit="% complete" height={240} />
        </Section>

        <Section title="Progress Ring" pkg="@zenith-visuals/charts">
          <ProgressRing value={68} caption="Storage used" height={240} />
        </Section>

        <Section title="Waffle" pkg="@zenith-visuals/charts">
          <WaffleChart data={waffleData} height={320} />
        </Section>

        <Section title="Step Line" pkg="@zenith-visuals/charts">
          <StepLineChart categories={stepCategories} series={stepSeries} showPoints height={320} />
        </Section>

        <Section title="100% Stacked Column" pkg="@zenith-visuals/charts">
          <PercentColumnChart categories={percentColumnCategories} series={percentColumnSeries} height={320} />
        </Section>

        <Section title="Polar Area" pkg="@zenith-visuals/charts">
          <PolarAreaChart categories={polarAreaCategories} series={polarAreaSeries} height={320} />
        </Section>

        <Section title="Heatmap Matrix" pkg="@zenith-visuals/charts" span>
          <HeatmapMatrix data={heatmapMatrixData} height={320} />
        </Section>

        <Section title="Box Plot" pkg="@zenith-visuals/stats">
          <BoxPlot groups={distributionGroups} height={280} />
        </Section>

        <Section title="Violin Plot" pkg="@zenith-visuals/stats">
          <ViolinPlot groups={distributionGroups} height={280} />
        </Section>

        <Section title="Histogram" pkg="@zenith-visuals/stats">
          <Histogram values={histogramValues} bins={16} height={280} />
        </Section>

        <Section title="Density (KDE)" pkg="@zenith-visuals/stats">
          <DensityPlot series={densitySeries} height={280} />
        </Section>

        <Section title="Hexbin Density" pkg="@zenith-visuals/stats">
          <Hexbin points={hexbinPoints} radius={13} height={280} />
        </Section>

        <Section title="Error Bars" pkg="@zenith-visuals/stats">
          <ErrorBarChart data={errorData} connect height={280} />
        </Section>

        <Section title="Regression" pkg="@zenith-visuals/stats">
          <RegressionChart points={regressionPoints} height={320} />
        </Section>

        <Section title="Strip Plot" pkg="@zenith-visuals/stats">
          <StripPlot groups={distributionGroups} height={300} />
        </Section>

        <Section title="Beeswarm" pkg="@zenith-visuals/stats">
          <BeeswarmChart groups={distributionGroups} height={320} />
        </Section>

        <Section title="Q-Q Plot" pkg="@zenith-visuals/stats">
          <QQPlot values={qqValues} height={320} />
        </Section>

        <Section title="Ridgeline" pkg="@zenith-visuals/stats" span>
          <RidgelineChart groups={ridgelineGroups} height={340} />
        </Section>

        <Section title="2D Density Heatmap" pkg="@zenith-visuals/stats">
          <DensityHeatmap points={scatterCloud} binsX={22} binsY={22} height={320} />
        </Section>

        <Section title="Contour" pkg="@zenith-visuals/stats">
          <ContourPlot points={scatterCloud} levels={7} showPoints height={320} />
        </Section>

        <Section title="Marginal Histogram" pkg="@zenith-visuals/stats" span>
          <MarginalHistogram points={scatterCloud} bins={20} height={360} />
        </Section>

        <Section title="Treemap" pkg="@zenith-visuals/hierarchy">
          <Treemap data={hierarchyData} height={300} />
        </Section>

        <Section title="Sunburst" pkg="@zenith-visuals/hierarchy">
          <Sunburst data={hierarchyData} innerRadius={0.35} height={300} />
        </Section>

        <Section title="Icicle" pkg="@zenith-visuals/hierarchy">
          <Icicle data={hierarchyData} height={300} />
        </Section>

        <Section title="Tidy Tree" pkg="@zenith-visuals/hierarchy" span>
          <Tree data={hierarchyData} height={320} />
        </Section>

        <Section title="Circle Packing" pkg="@zenith-visuals/hierarchy">
          <CirclePack data={hierarchyData} height={300} />
        </Section>

        <Section title="Radial Tree" pkg="@zenith-visuals/hierarchy">
          <RadialTree data={hierarchyData} height={380} />
        </Section>

        <Section title="Dendrogram" pkg="@zenith-visuals/hierarchy">
          <Dendrogram data={hierarchyData} height={380} />
        </Section>

        <Section title="Cluster" pkg="@zenith-visuals/hierarchy">
          <Cluster data={hierarchyData} height={380} />
        </Section>

        <Section title="Mind Map" pkg="@zenith-visuals/hierarchy" span>
          <MindMap data={hierarchyData} height={380} />
        </Section>

        <Section title="Candlestick" pkg="@zenith-visuals/finance" span>
          <CandlestickChart data={ohlcData} height={320} />
        </Section>

        <Section title="OHLC Bars" pkg="@zenith-visuals/finance" span>
          <OHLCChart data={ohlcData} height={320} />
        </Section>

        <Section title="Kagi" pkg="@zenith-visuals/finance">
          <KagiChart data={ohlcData} reversal={0.03} height={300} />
        </Section>

        <Section title="Renko" pkg="@zenith-visuals/finance">
          <RenkoChart data={ohlcData} boxSize={0.02} height={300} />
        </Section>

        <Section title="Horizon" pkg="@zenith-visuals/finance" span>
          <HorizonChart data={ohlcData} bands={3} height={150} />
        </Section>

        <Section title="Stat Cards" pkg="@zenith-visuals/kpi" span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            <StatCard label="MRR" value={48200} previousValue={44100} unit="$" trend={mrrTrend} />
            <StatCard label="Active Users" value={12840} previousValue={13100} trend={mrrTrend} />
            <StatCard label="Error Rate" value={1.4} previousValue={2.1} unit="%" goodDirection="down" trend={mrrTrend} />
          </div>
        </Section>

        <Section title="Bullet Chart" pkg="@zenith-visuals/kpi" span>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {bulletMetrics.map((m) => (
              <BulletChart key={m.label} {...m} />
            ))}
          </div>
        </Section>

        <Section title="Slope Chart" pkg="@zenith-visuals/kpi">
          <SlopeChart data={slopeData} startLabel="2023" endLabel="2024" height={320} />
        </Section>

        <Section title="Dumbbell Chart" pkg="@zenith-visuals/kpi">
          <DumbbellChart data={dumbbellData} startLabel="Q1" endLabel="Q4" height={320} />
        </Section>

        <Section title="Lollipop Chart" pkg="@zenith-visuals/kpi" span>
          <LollipopChart data={lollipopData} sort="desc" height={320} />
        </Section>

        <Section title="Gradient Band" pkg="@zenith-visuals/kpi" span>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <GradientBand label="Health score" value={72} min={0} max={100} target={80} />
            <GradientBand label="Response time (ms)" value={310} min={0} max={600} zones={gradientBandZones} />
          </div>
        </Section>

        <Section title="Trend Delta Cards" pkg="@zenith-visuals/kpi" span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
            <TrendDeltaCard label="Signups" value={1280} previousValue={1104} trend={mrrTrend} periodLabel="vs last week" />
            <TrendDeltaCard label="Churn" value={2.1} previousValue={2.8} unit="%" goodDirection="down" trend={churnTrend} periodLabel="vs last month" />
          </div>
        </Section>

        <Section title="Activity Timeline" pkg="@zenith-visuals/timeline">
          <ActivityTimeline data={activities} groupByDay />
        </Section>

        <Section title="Resource Timeline" pkg="@zenith-visuals/timeline" span>
          <ResourceTimeline data={resourceTasks} />
        </Section>

        <Section title="Swimlane" pkg="@zenith-visuals/timeline" span>
          <Swimlane data={swimlaneEvents} />
        </Section>

        <Section title="Event Drops" pkg="@zenith-visuals/timeline" span>
          <EventDrops data={eventDropRows} />
        </Section>

        <Section title="Sankey Flow" pkg="@zenith-visuals/flow">
          <Sankey data={sankeyData} linkGradient />
        </Section>

        <Section title="Alluvial Diagram" pkg="@zenith-visuals/flow">
          <Alluvial
            flows={alluvialFlows}
            stageLabels={["Source", "Journey", "Outcome"]}
            height={340}
          />
        </Section>

        <Section title="Parallel Coordinates" pkg="@zenith-visuals/flow" span>
          <ParallelCoordinates
            data={parallelData}
            dimensions={parallelDimensions}
            categories={parallelCategories}
            height={340}
          />
        </Section>

        <Section title="Chord Diagram" pkg="@zenith-visuals/flow">
          <Chord matrix={chordMatrix} groupLabels={chordLabels} height={360} />
        </Section>

        <Section title="Parallel Sets" pkg="@zenith-visuals/flow" span>
          <ParallelSets
            data={parallelSetsData}
            dimensions={["class", "sex", "survived"]}
            dimensionLabels={["Class", "Sex", "Survived"]}
            height={360}
          />
        </Section>

        <Section title="Population Pyramid" pkg="@zenith-visuals/flow">
          <Pyramid data={pyramidData} leftLabel="Male" rightLabel="Female" height={380} />
        </Section>

        <Section title="Dependency Wheel" pkg="@zenith-visuals/flow">
          <DependencyWheel data={dependencyWheelData} height={400} />
        </Section>

        <Section title="Network Flow" pkg="@zenith-visuals/flow">
          <NetworkFlow data={networkFlowData} height={380} />
        </Section>

        <Section title="Journey Flow" pkg="@zenith-visuals/flow" span>
          <Journey data={journeyStages} height={340} />
        </Section>

        <Section title="Network Graph" pkg="@zenith-visuals/network">
          <NetworkGraph data={networkData} height={340} />
        </Section>

        <Section title="Arc Diagram" pkg="@zenith-visuals/network">
          <ArcDiagram data={graphData} height={360} />
        </Section>

        <Section title="Adjacency Matrix" pkg="@zenith-visuals/network">
          <AdjacencyMatrix data={graphData} height={400} />
        </Section>

        <Section title="Edge Bundling" pkg="@zenith-visuals/network">
          <EdgeBundling data={graphData} height={440} />
        </Section>

        <Section title="Org Chart" pkg="@zenith-visuals/orgchart">
          <div style={{ overflow: "auto" }}>
            <OrgChart data={orgData} collapsible />
          </div>
        </Section>

        <Section title="Gantt Chart" pkg="@zenith-visuals/gantt" span>
          <Gantt data={ganttTasks} />
        </Section>

        <Section title="AI Agent Graph" pkg="@zenith-visuals/ai">
          <div style={{ overflow: "auto" }}>
            <AgentGraph data={agentData} />
          </div>
        </Section>

        <Section title="Geographic Scatter" pkg="@zenith-visuals/maps">
          <GeoScatter data={geoData} projection="mercator" showGraticule height={320} />
        </Section>

        <Section title="Choropleth Map" pkg="@zenith-visuals/maps">
          <Choropleth regions={choroplethRegions} height={320} />
        </Section>

        <Section title="Connection Map" pkg="@zenith-visuals/maps" span>
          <ConnectionMap
            points={connectionPoints}
            connections={connections}
            projection="mercator"
            showGraticule
            height={340}
          />
        </Section>

        <Section title="Bubble Map" pkg="@zenith-visuals/maps">
          <BubbleMap data={bubbleCities} height={320} />
        </Section>

        <Section title="Geo Heatmap" pkg="@zenith-visuals/maps">
          <GeoHeatmap data={geoHeatPoints} height={320} />
        </Section>

        <Section title="Cartogram" pkg="@zenith-visuals/maps">
          <Cartogram regions={cartogramRegions} height={320} />
        </Section>

        <Section title="Hexbin Map" pkg="@zenith-visuals/maps">
          <HexbinMap data={hexbinGeoPoints} radius={18} height={320} />
        </Section>

        <Section title="Tile-grid Map" pkg="@zenith-visuals/maps" span>
          <TileGridMap data={tileGridStates} height={340} />
        </Section>

        <Section title="Icons" pkg="@zenith-visuals/icons">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 18, color: theme.colors.primary }}>
            {[Search, Calendar, User, GitBranch, Bolt, Download, ZoomIn, Check, ChevronRight].map(
              (Icon, i) => (
                <Icon key={i} size={26} />
              ),
            )}
          </div>
        </Section>
      </main>

      <footer
        style={{
          padding: "24px 28px 40px",
          textAlign: "center",
          fontSize: 13,
          color: theme.colors.textMuted,
        }}
      >
        All 18 <code>@zenith-visuals/*</code> packages · themed, SSR-safe and accessible.
      </footer>
    </div>
  );
}

function Section({
  title,
  pkg,
  span,
  children,
}: {
  title: string;
  pkg: string;
  span?: boolean;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <section
      style={{
        gridColumn: span ? "1 / -1" : "auto",
        background: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radii.lg,
        padding: 18,
        boxShadow: theme.shadows.sm,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: theme.typography.fontWeightBold }}>{title}</h2>
        <code style={{ fontSize: 11, color: theme.colors.textMuted, fontFamily: theme.typography.monoFamily }}>
          {pkg}
        </code>
      </div>
      {children}
    </section>
  );
}
