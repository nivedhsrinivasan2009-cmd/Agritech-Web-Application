import React from "react";
import { Activity, Play, RotateCcw, Shuffle, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const fmt = (value, digits = 1) => (Number.isFinite(value) ? value.toFixed(digits) : "–");

function Metric({ label, value, unit, highlight }) {
  return (
    <div className={cn("rounded-lg px-3 py-2", highlight ? "bg-green-50" : "bg-stone-50")}>
      <p className="text-[11px] text-stone-500">{label}</p>
      <p className={cn("text-sm font-semibold", highlight ? "text-green-700" : "text-stone-800")}>
        {value}
        {unit && <span className="text-xs font-normal text-stone-500 ml-0.5">{unit}</span>}
      </p>
    </div>
  );
}

function LegendItem({ color, label, dashed, line }) {
  return (
    <span className="flex items-center gap-1.5">
      {line ? (
        <span className={cn("w-5 h-0 border-t-2", dashed && "border-dashed")} style={{ borderColor: color }} />
      ) : (
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
      )}
      {label}
    </span>
  );
}

/**
 * Explains and measures the GPS signal processing: what was filtered out, how uncertain the
 * estimate is and, for simulated walks, how much closer to the truth the filtered track is.
 */
export default function SignalProcessingPanel({
  demoMode,
  demoProgress,
  stats,
  accuracy,
  rawAccuracy,
  speed,
  currentZone,
  calibration,
  onStartDemo,
  onStopDemo,
}) {
  const improvement = stats.rawRms && stats.filteredRms ? (1 - stats.filteredRms / stats.rawRms) * 100 : null;
  const demoFinished = demoMode && demoProgress >= 1;

  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-4 mb-6">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
            <Activity className="w-5 h-5 text-green-700" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-900 text-sm">GPS Signal Processing</h3>
            <p className="text-xs text-stone-500">Kalman filter · multipath outlier rejection · zone hysteresis</p>
          </div>
        </div>
        <div className="flex gap-2">
          {demoMode ? (
            <>
              {demoFinished && (
                <>
                  <Button size="sm" variant="outline" onClick={() => onStartDemo()}>
                    <RotateCcw className="w-3.5 h-3.5 mr-1" /> Replay
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onStartDemo({ newWalk: true })}>
                    <Shuffle className="w-3.5 h-3.5 mr-1" /> New walk
                  </Button>
                </>
              )}
              <Button size="sm" variant="outline" onClick={onStopDemo}>
                <X className="w-3.5 h-3.5 mr-1" /> Exit demo
              </Button>
            </>
          ) : (
            <Button size="sm" className="bg-[#2D5016] hover:bg-[#4A7C23]" onClick={() => onStartDemo()}>
              <Play className="w-3.5 h-3.5 mr-1" /> Simulate GPS walk
            </Button>
          )}
        </div>
      </div>

      {demoMode && (
        <div className="mb-3">
          <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#2D5016] transition-all" style={{ width: `${Math.round(demoProgress * 100)}%` }} />
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            Simulated walk: Main Entrance → Farm Shop & Café → Animal Yard → Greenhouses, with receiver noise,
            drifting bias, multipath reflections and degraded fixes. Replayed at ~12× speed.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <Metric label="Current zone" value={currentZone?.name || "–"} />
        <Metric label="Fixes processed" value={stats.fixes} />
        <Metric
          label="Rejected (multipath / low accuracy)"
          value={`${stats.outliers} / ${stats.lowAccuracy}`}
        />
        <Metric label="Walking speed" value={fmt(speed)} unit="m/s" />
        <Metric label="Phone-reported accuracy" value={fmt(rawAccuracy, 0)} unit="m" />
        <Metric label="Filter uncertainty (1σ)" value={fmt(accuracy)} unit="m" />
        {demoMode ? (
          <>
            <Metric label="Raw GPS error (RMS)" value={fmt(stats.rawRms)} unit="m" />
            <Metric
              label="Filtered error (RMS)"
              value={fmt(stats.filteredRms)}
              unit={improvement !== null ? `m (${improvement.toFixed(0)}% better)` : "m"}
              highlight
            />
          </>
        ) : (
          <Metric
            label="Map calibration"
            value={calibration.isPlaceholder ? "Placeholder" : `${calibration.controlPoints} points`}
            unit={calibration.isPlaceholder ? "" : `±${fmt(calibration.rmsErrorMeters)} m`}
          />
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-stone-600">
        <LegendItem color="#ef4444" label="Raw GPS fix" />
        <LegendItem color="#7c3aed" label="Rejected: multipath outlier" />
        <LegendItem color="#a8a29e" label="Rejected: low accuracy" />
        <LegendItem color="#16a34a" label="Kalman-filtered track" line />
        {demoMode && <LegendItem color="#57534e" label="True path" line dashed />}
        <LegendItem color="#3b82f6" label="Uncertainty (2σ)" />
      </div>

      {calibration.isPlaceholder && (
        <p className="flex items-start gap-1.5 text-[11px] text-amber-700 bg-amber-50 rounded-lg px-2 py-1.5 mt-3">
          <Info className="w-3.5 h-3.5 mt-px flex-shrink-0" />
          Map georeference uses placeholder survey points. Survey 3+ landmarks on site and update
          src/data/geoReference.js for real-world accuracy.
        </p>
      )}
    </div>
  );
}
