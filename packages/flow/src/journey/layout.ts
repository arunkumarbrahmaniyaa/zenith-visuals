export interface JourneyStage {
  label: string;
  /** Volume reaching this stage (e.g. users). */
  value: number;
  /** Optional sentiment in [-1, 1] plotted as an emotion line. */
  sentiment?: number;
}

export interface JourneyStagePoint {
  label: string;
  value: number;
  x: number;
  top: number;
  bottom: number;
  height: number;
  /** Drop-off fraction from the previous stage in [0, 1], or null for the first. */
  dropFromPrev: number | null;
  sentiment: number | null;
  /** Y of the sentiment point when sentiment is provided. */
  sentimentY: number | null;
}

export interface JourneySegment {
  /** Polygon points string (`x,y x,y ...`) for the tapering band. */
  points: string;
}

export interface JourneyLayout {
  stages: JourneyStagePoint[];
  segments: JourneySegment[];
  max: number;
  centerY: number;
  hasSentiment: boolean;
}

export interface JourneyOptions {
  width: number;
  height: number;
  /** Horizontal inset (px) on each side. Default 48. */
  marginX?: number;
  /** Top strip (px) reserved for the sentiment line. Default 64 when sentiment is present. */
  sentimentHeight?: number;
}

/**
 * Compute a customer-journey layout: a horizontal band whose thickness tracks
 * the volume reaching each stage (so drop-off is visible as tapering), plus an
 * optional sentiment/emotion line above it. Pure and deterministic.
 */
export function computeJourney(data: readonly JourneyStage[], options: JourneyOptions): JourneyLayout {
  const { width, height, marginX = 48 } = options;
  const n = data.length;
  const hasSentiment = data.some((d) => d.sentiment != null);
  const sentimentHeight = hasSentiment ? options.sentimentHeight ?? 64 : 0;

  const max = data.reduce((m, d) => Math.max(m, d.value), 0);
  const bandTop = sentimentHeight;
  const bandArea = Math.max(1, height - sentimentHeight);
  const centerY = bandTop + bandArea / 2;

  if (n === 0 || max <= 0) {
    return { stages: [], segments: [], max: 0, centerY, hasSentiment };
  }

  const maxBand = bandArea * 0.82;
  const step = n > 1 ? (width - marginX * 2) / (n - 1) : 0;
  const xOf = (i: number) => (n > 1 ? marginX + i * step : width / 2);
  const sentimentY = (s: number) => 8 + ((1 - (s + 1) / 2) * (sentimentHeight - 16));

  const stages: JourneyStagePoint[] = data.map((d, i) => {
    const bh = (d.value / max) * maxBand;
    const prev = i > 0 ? data[i - 1]! : null;
    const dropFromPrev = prev && prev.value > 0 ? Math.max(0, (prev.value - d.value) / prev.value) : null;
    return {
      label: d.label,
      value: d.value,
      x: xOf(i),
      top: centerY - bh / 2,
      bottom: centerY + bh / 2,
      height: bh,
      dropFromPrev,
      sentiment: d.sentiment ?? null,
      sentimentY: d.sentiment != null ? sentimentY(d.sentiment) : null,
    };
  });

  const segments: JourneySegment[] = [];
  for (let i = 0; i < n - 1; i++) {
    const a = stages[i]!;
    const b = stages[i + 1]!;
    segments.push({
      points: `${a.x},${a.top} ${b.x},${b.top} ${b.x},${b.bottom} ${a.x},${a.bottom}`,
    });
  }

  return { stages, segments, max, centerY, hasSentiment };
}
