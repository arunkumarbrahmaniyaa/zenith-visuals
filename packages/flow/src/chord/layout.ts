/** A chord subgroup arc (one cell of the matrix, on the ring). */
export interface ChordArc {
  /** Group (row) index. */
  index: number;
  /** Subgroup (column) index. */
  subindex: number;
  startAngle: number;
  endAngle: number;
  value: number;
}

/** A group arc spanning a full matrix row. */
export interface ChordGroup {
  index: number;
  startAngle: number;
  endAngle: number;
  value: number;
}

/** A ribbon connecting two subgroup arcs. */
export interface Chord {
  source: ChordArc;
  target: ChordArc;
}

export interface ChordLayout {
  groups: ChordGroup[];
  chords: Chord[];
}

/**
 * Compute a chord diagram layout from a square flow matrix. `matrix[i][j]` is
 * the flow from group `i` to group `j`. Group arc length is proportional to the
 * row sum; `padAngle` (radians) separates groups. Pure and deterministic.
 */
export function computeChordLayout(matrix: readonly (readonly number[])[], padAngle = 0.03): ChordLayout {
  const n = matrix.length;
  const groups: ChordGroup[] = [];
  const chords: Chord[] = [];
  if (n === 0) return { groups, chords };

  const rowSums = matrix.map((row) => row.reduce((a, b) => a + Math.max(0, b), 0));
  const total = rowSums.reduce((a, b) => a + b, 0);
  if (total <= 0) return { groups, chords };

  const available = Math.PI * 2 - padAngle * n;
  const k = available / total;

  // Subgroup arcs indexed [i][j].
  const subArcs: ChordArc[][] = [];
  let angle = 0;
  for (let i = 0; i < n; i++) {
    const groupStart = angle;
    const row = matrix[i]!;
    const arcs: ChordArc[] = [];
    for (let j = 0; j < n; j++) {
      const value = Math.max(0, row[j]!);
      const startAngle = angle;
      const endAngle = angle + value * k;
      arcs.push({ index: i, subindex: j, startAngle, endAngle, value });
      angle = endAngle;
    }
    subArcs.push(arcs);
    groups.push({ index: i, startAngle: groupStart, endAngle: angle, value: rowSums[i]! });
    angle += padAngle;
  }

  // One ribbon per unordered pair (i,j), plus self-loops (i===j).
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      const source = subArcs[i]![j]!;
      const target = subArcs[j]![i]!;
      if (source.value === 0 && target.value === 0) continue;
      chords.push({ source, target });
    }
  }

  return { groups, chords };
}
