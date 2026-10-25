import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  createGeoReference,
  createPositioningPipeline,
  simulateGpsWalk,
  rmsError,
} from "@/lib/positioning";
import { CONTROL_POINTS, IS_PLACEHOLDER } from "@/data/geoReference";
import { setVisitorZone } from "@/lib/visitorLocation";

// Map georeference from the site survey (see src/data/geoReference.js)
const geoRef = createGeoReference(CONTROL_POINTS);

// Keep the last N points of each track for drawing
const MAX_TRACK_POINTS = 700;
// Demo replay: fixes are 1 s apart in simulated time, replayed this many ms apart
const DEMO_STEP_MS = 80;

// Calculate distance between two GPS points in meters (Haversine formula)
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Format distance for display
export function formatDistance(meters) {
  if (meters < 50) return "nearby";
  if (meters < 1000) return `${Math.round(meters)}m away`;
  return `${(meters / 1000).toFixed(1)}km away`;
}

// Estimate walking time (average 1.4 m/s or ~5 km/h)
export function estimateWalkTime(meters) {
  const minutes = Math.ceil(meters / 84); // 84m per minute
  if (minutes < 1) return "< 1 min walk";
  if (minutes === 1) return "1 min walk";
  return `${minutes} min walk`;
}

// Convert GPS coordinates to map percentage coordinates (via the surveyed georeference)
export function gpsToMapCoords(lat, lng) {
  return geoRef.gpsToMap({ lat, lng });
}

// Convert map percentage to GPS (for zones without surveyed GPS)
export function mapCoordsToGps(mapX, mapY) {
  return geoRef.mapToGps({ x: mapX, y: mapY });
}

// The venue is the area covered by the map
function isOnMap({ x, y }) {
  return x >= 0 && x <= 100 && y >= 0 && y <= 100;
}

export function isWithinVenue(lat, lng) {
  return isOnMap(gpsToMapCoords(lat, lng));
}

// Demo route: Main Entrance -> Farm Shop & Café (pause) -> Animal Yard -> Greenhouses, using the
// zones' map positions when available
function buildDemoRoute(zones) {
  const at = (type, fallback) => {
    const zone = zones.find((z) => z.zone_type === type && Number.isFinite(Number(z.map_x)));
    return zone ? { x: Number(zone.map_x), y: Number(zone.map_y) } : fallback;
  };
  return [
    { ...at("entrance", { x: 50, y: 90 }) },
    { ...at("shops", { x: 55, y: 45 }), pauseSeconds: 15 },
    { ...at("animal_yard", { x: 70, y: 30 }) },
    { ...at("greenhouse", { x: 20, y: 25 }) },
  ];
}

const emptyTracks = () => ({ raw: [], filtered: [], truth: [] });
const emptyStats = () => ({ fixes: 0, rejected: 0, outliers: 0, lowAccuracy: 0, rawRms: null, filteredRms: null });
const pushCapped = (list, item) => (list.length >= MAX_TRACK_POINTS ? [...list.slice(1), item] : [...list, item]);

/**
 * Live (or simulated) visitor position on the farm map, with GPS signal processing:
 * outlier rejection, Kalman filtering, georeferencing and zone detection (src/lib/positioning.js).
 *
 * @param {object} options
 * @param {boolean} options.watch - keep tracking (default true)
 * @param {Array} options.zones - app locations, for zone detection and the demo route
 */
export default function useGeolocation(options = {}) {
  const [state, setState] = useState({
    loading: true,
    error: null,
    position: null, // filtered {lat, lng}
    mapPosition: null, // filtered {x, y} on the map, null when off the map
    isWithinVenue: false,
    accuracy: null, // filtered 1-sigma uncertainty (m)
    rawAccuracy: null, // accuracy the phone reported for the last fix (m)
    speed: null, // m/s
    timestamp: null,
    currentZone: null,
  });
  const [tracks, setTracks] = useState(emptyTracks);
  const [stats, setStats] = useState(emptyStats);
  const [watching, setWatching] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [demoProgress, setDemoProgress] = useState(0);
  const [demoRun, setDemoRun] = useState(0);
  // Seed 2 is a typical walk (~64% error reduction, the median over 40 seeds; the best is ~76%), so the first demo and "Replay" are
  // reproducible; "New walk" draws a fresh random one
  const [demoSeed, setDemoSeed] = useState(2);

  const pipelineRef = useRef(null);
  const accuracyPairsRef = useRef({ raw: [], filtered: [] });
  const zonesRef = useRef(options.zones || []);
  zonesRef.current = options.zones || [];

  const resetProcessing = useCallback(() => {
    pipelineRef.current = createPositioningPipeline(geoRef);
    accuracyPairsRef.current = { raw: [], filtered: [] };
    setTracks(emptyTracks());
    setStats(emptyStats());
  }, []);

  // Run one GPS fix through the pipeline and publish the result
  const processFix = useCallback((fix, { simulated = false } = {}) => {
    if (!pipelineRef.current) pipelineRef.current = createPositioningPipeline(geoRef);
    const result = pipelineRef.current.process(fix, zonesRef.current);
    const filtered = result.filtered;
    const filteredOnMap = filtered && isOnMap(filtered.map);

    setState({
      loading: false,
      error: null,
      position: filtered ? { lat: filtered.lat, lng: filtered.lng } : null,
      mapPosition: filteredOnMap ? filtered.map : null,
      isWithinVenue: !!filteredOnMap,
      accuracy: filtered?.sigma ?? null,
      rawAccuracy: fix.accuracy,
      speed: filtered?.speed ?? null,
      timestamp: fix.timestamp,
      currentZone: result.zone,
    });

    setTracks((prev) => ({
      raw: pushCapped(prev.raw, { ...result.raw.map, rejected: !result.accepted, reason: result.reason }),
      filtered: filtered ? pushCapped(prev.filtered, filtered.map) : prev.filtered,
      truth: fix.truth ? pushCapped(prev.truth, geoRef.gpsToMap(fix.truth)) : prev.truth,
    }));

    // Accuracy against ground truth is only known for simulated walks
    if (fix.truth) {
      accuracyPairsRef.current.raw.push({ estimate: fix, truth: fix.truth });
      if (filtered) accuracyPairsRef.current.filtered.push({ estimate: filtered, truth: fix.truth });
    }
    setStats((prev) => ({
      fixes: prev.fixes + 1,
      rejected: prev.rejected + (result.accepted ? 0 : 1),
      outliers: prev.outliers + (result.reason === "outlier" ? 1 : 0),
      lowAccuracy: prev.lowAccuracy + (result.reason === "low-accuracy" ? 1 : 0),
      rawRms: fix.truth ? rmsError(geoRef.frame, accuracyPairsRef.current.raw) : prev.rawRms,
      filteredRms: fix.truth ? rmsError(geoRef.frame, accuracyPairsRef.current.filtered) : prev.filteredRms,
    }));

    setVisitorZone(result.zone, { simulated });
  }, []);

  // The first fix can arrive before the zone list loads: work out the zone once it does
  const zoneCount = (options.zones || []).length;
  useEffect(() => {
    if (!pipelineRef.current || zoneCount === 0) return;
    const zone = pipelineRef.current.refreshZone(zonesRef.current);
    setState((prev) => (prev.currentZone?.id === zone?.id ? prev : { ...prev, currentZone: zone }));
    if (zone) setVisitorZone(zone, { simulated: demoMode });
  }, [zoneCount, demoMode]);

  // ---------- Demo mode: replay a simulated noisy GPS walk through the same pipeline ----------

  const startDemoWalk = useCallback(({ newWalk = false } = {}) => {
    resetProcessing();
    setDemoProgress(0);
    if (newWalk) setDemoSeed(Math.floor(Math.random() * 1e9) + 2);
    setDemoMode(true);
    setDemoRun((run) => run + 1);
  }, [resetProcessing]);

  const stopDemoWalk = useCallback(() => {
    setDemoMode(false);
    setDemoProgress(0);
    resetProcessing();
    setVisitorZone(null);
    setState((prev) => ({ ...prev, loading: true, currentZone: null }));
  }, [resetProcessing]);

  useEffect(() => {
    if (!demoMode) return;

    const fixes = simulateGpsWalk(geoRef, buildDemoRoute(zonesRef.current), { seed: demoSeed });
    let index = 0;
    const timer = setInterval(() => {
      processFix(fixes[index], { simulated: true });
      index += 1;
      setDemoProgress(index / fixes.length);
      if (index >= fixes.length) clearInterval(timer);
    }, DEMO_STEP_MS);

    return () => clearInterval(timer);
  }, [demoMode, demoRun, demoSeed, processFix]);

  // ---------- Live GPS ----------

  useEffect(() => {
    if (demoMode) return;

    if (!navigator.geolocation) {
      setState((prev) => ({ ...prev, loading: false, error: "Geolocation is not supported by your browser" }));
      return;
    }

    resetProcessing();

    const handleSuccess = (position) => {
      const { latitude: lat, longitude: lng, accuracy } = position.coords;
      processFix({ lat, lng, accuracy, timestamp: position.timestamp });
    };

    const handleError = (error) => {
      let errorMessage = "Unable to get your location";
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Location permission denied";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Location information unavailable";
          break;
        case error.TIMEOUT:
          errorMessage = "Location request timed out";
          break;
      }
      setState((prev) => ({ ...prev, loading: false, error: errorMessage, position: null, mapPosition: null, isWithinVenue: false }));
    };

    const geoOptions = {
      enableHighAccuracy: options.highAccuracy !== false,
      timeout: options.timeout || 10000,
      // Fresh fixes only: the filter needs real measurements, not cached repeats
      maximumAge: options.maximumAge ?? 0,
    };

    // watchPosition delivers the first fix as well, so no separate getCurrentPosition call
    let watchId;
    if (options.watch !== false) {
      watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, geoOptions);
      setWatching(true);
    } else {
      navigator.geolocation.getCurrentPosition(handleSuccess, handleError, geoOptions);
    }

    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
        setWatching(false);
      }
    };
  }, [demoMode, options.highAccuracy, options.timeout, options.maximumAge, options.watch, processFix, resetProcessing]);

  // Calculate distance to a zone from the filtered position
  const getDistanceToZone = useCallback((zone) => {
    if (!state.position) return null;

    const zoneGps = zone.latitude && zone.longitude
      ? { lat: zone.latitude, lng: zone.longitude }
      : mapCoordsToGps(zone.map_x ?? 50, zone.map_y ?? 50);

    const distance = calculateDistance(state.position.lat, state.position.lng, zoneGps.lat, zoneGps.lng);

    return {
      meters: distance,
      formatted: formatDistance(distance),
      walkTime: estimateWalkTime(distance),
    };
  }, [state.position]);

  const calibration = useMemo(() => ({
    isPlaceholder: IS_PLACEHOLDER,
    controlPoints: CONTROL_POINTS.length,
    rmsErrorMeters: geoRef.rmsErrorMeters,
    metersPerMapUnit: geoRef.metersPerMapUnit,
  }), []);

  return {
    ...state,
    watching,
    tracks,
    stats,
    calibration,
    demoMode,
    demoProgress,
    startDemoWalk,
    stopDemoWalk,
    getDistanceToZone,
  };
}
