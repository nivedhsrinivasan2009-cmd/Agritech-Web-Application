import React from "react";

const toPoints = (points) => points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");

/**
 * Draws GPS signal processing on the map: raw fixes, rejected fixes, the Kalman-filtered track,
 * the true path (simulated walks only) and the filter's uncertainty around the visitor.
 * Coordinates are map percentages; the SVG stretches to the map, and strokes use
 * non-scaling-stroke so dots stay round and lines stay crisp.
 */
export default function GpsTrackOverlay({ tracks, mapPosition, sigma, metersPerMapUnit, showTracks }) {
  // 2-sigma circle (~86% confidence in 2D) converted from metres to map percentages
  const radius = mapPosition && sigma && metersPerMapUnit
    ? { x: (2 * sigma) / metersPerMapUnit.x, y: (2 * sigma) / metersPerMapUnit.y }
    : null;

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {showTracks && (
        <>
          {tracks.truth.length > 1 && (
            <polyline
              points={toPoints(tracks.truth)}
              fill="none"
              stroke="#57534e"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              strokeOpacity="0.7"
              vectorEffect="non-scaling-stroke"
            />
          )}

          {tracks.raw.map((p, i) => (
            <line
              key={i}
              x1={p.x}
              y1={p.y}
              x2={p.x}
              y2={p.y}
              stroke={p.reason === "outlier" ? "#7c3aed" : p.reason === "low-accuracy" ? "#a8a29e" : "#ef4444"}
              strokeOpacity={p.rejected ? 0.9 : 0.55}
              strokeWidth={p.rejected ? 7 : 5}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {tracks.filtered.length > 1 && (
            <polyline
              points={toPoints(tracks.filtered)}
              fill="none"
              stroke="#16a34a"
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </>
      )}

      {radius && (
        <ellipse
          cx={mapPosition.x}
          cy={mapPosition.y}
          rx={radius.x}
          ry={radius.y}
          fill="#3b82f6"
          fillOpacity="0.12"
          stroke="#3b82f6"
          strokeOpacity="0.5"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}
