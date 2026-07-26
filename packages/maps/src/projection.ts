/** A geographic coordinate. */
export interface GeoCoord {
  /** Latitude in degrees, -90..90. */
  lat: number;
  /** Longitude in degrees, -180..180. */
  lon: number;
}

/** A 2D point in pixel space. */
export interface Point {
  x: number;
  y: number;
}

/**
 * Equirectangular (plate carrée) projection — the simplest, dependency-free
 * map projection. Maps lon/lat directly onto a rectangle. Deterministic and
 * SSR-safe.
 *
 * @param coord geographic coordinate
 * @param width target width in px
 * @param height target height in px
 */
export function projectEquirectangular(coord: GeoCoord, width: number, height: number): Point {
  const x = ((coord.lon + 180) / 360) * width;
  const y = ((90 - coord.lat) / 180) * height;
  return { x, y };
}

/**
 * Web Mercator projection (clamped to ±85.0511° like slippy map tiles).
 */
export function projectMercator(coord: GeoCoord, width: number, height: number): Point {
  const clampedLat = Math.max(-85.0511, Math.min(85.0511, coord.lat));
  const x = ((coord.lon + 180) / 360) * width;
  const latRad = (clampedLat * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const y = height / 2 - (width * mercN) / (2 * Math.PI);
  return { x, y };
}

export type ProjectionName = "equirectangular" | "mercator";

export function getProjection(name: ProjectionName) {
  return name === "mercator" ? projectMercator : projectEquirectangular;
}
