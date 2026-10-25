/**
 * GPS signal processing for on-farm positioning.
 *
 * Phone GPS is a noisy sensor: readings scatter by several metres, and near greenhouses, metal
 * sheds and shade nets the satellite signal reflects (multipath), producing jumps of tens of
 * metres that the phone often still reports as "accurate". This module turns that raw stream
 * into a stable position on the farm map:
 *
 *   raw fix (lat/lng, accuracy)
 *     -> local tangent plane (metres east/north)
 *     -> accuracy gate                      reject fixes the phone itself says are poor
 *     -> Kalman filter (constant velocity)  predict + correct, weighting each fix by its accuracy
 *        with innovation (Mahalanobis) gate  reject statistically impossible jumps (multipath)
 *     -> affine georeference                metres -> map percentages (least squares fit)
 *     -> zone tracker with hysteresis       stable "you are in X" without flicker at boundaries
 *
 * Plain JavaScript (no React/browser APIs) so it can be unit tested and reused.
 */

// ============ COORDINATE FRAMES ============

const EARTH_RADIUS_M = 6371008.8;
const DEG = Math.PI / 180;

/**
 * Local tangent plane around an origin: flat-earth east/north metres. Over a farm-sized area
 * (< 2 km) the error of this approximation is millimetres.
 */
export function createLocalFrame(origin) {
  const metersPerDegLat = DEG * EARTH_RADIUS_M;
  const metersPerDegLng = metersPerDegLat * Math.cos(origin.lat * DEG);
  return {
    origin,
    toLocal: ({ lat, lng }) => ({ e: (lng - origin.lng) * metersPerDegLng, n: (lat - origin.lat) * metersPerDegLat }),
    toGeo: ({ e, n }) => ({ lat: origin.lat + n / metersPerDegLat, lng: origin.lng + e / metersPerDegLng }),
  };
}

// Solve a 3x3 linear system with Gaussian elimination and partial pivoting
function solve3(matrix, vector) {
  const m = matrix.map((row, i) => [...row, vector[i]]);
  // Singularity tolerance relative to the matrix's magnitude (entries are in metres², not ~1)
  const tolerance = 1e-9 * Math.max(...matrix.flat().map(Math.abs));
  for (let col = 0; col < 3; col++) {
    let pivot = col;
    for (let row = col + 1; row < 3; row++) {
      if (Math.abs(m[row][col]) > Math.abs(m[pivot][col])) pivot = row;
    }
    if (Math.abs(m[pivot][col]) <= tolerance) throw new Error("Control points are collinear or duplicated");
    [m[col], m[pivot]] = [m[pivot], m[col]];
    for (let row = col + 1; row < 3; row++) {
      const factor = m[row][col] / m[col][col];
      for (let k = col; k < 4; k++) m[row][k] -= factor * m[col][k];
    }
  }
  const x = [0, 0, 0];
  for (let row = 2; row >= 0; row--) {
    let sum = m[row][3];
    for (let k = row + 1; k < 3; k++) sum -= m[row][k] * x[k];
    x[row] = sum / m[row][row];
  }
  return x;
}

/**
 * Fit an affine transform from local metres to map percentages over surveyed control points,
 * by least squares (normal equations), so extra points average out survey error.
 * @param {Array<{lat, lng, mapX, mapY}>} controlPoints - at least 3, not all in a line
 */
export function createGeoReference(controlPoints) {
  if (!Array.isArray(controlPoints) || controlPoints.length < 3) {
    throw new Error("At least 3 control points are needed to georeference the map");
  }

  const origin = {
    lat: controlPoints.reduce((s, p) => s + p.lat, 0) / controlPoints.length,
    lng: controlPoints.reduce((s, p) => s + p.lng, 0) / controlPoints.length,
  };
  const frame = createLocalFrame(origin);
  const rows = controlPoints.map((p) => {
    const { e, n } = frame.toLocal(p);
    return [e, n, 1];
  });

  // Normal equations: (AᵀA) p = Aᵀb, solved once for map x and once for map y
  const ata = [0, 1, 2].map((i) => [0, 1, 2].map((j) => rows.reduce((s, r) => s + r[i] * r[j], 0)));
  const atb = (key) => [0, 1, 2].map((i) => rows.reduce((s, r, k) => s + r[i] * controlPoints[k][key], 0));
  const px = solve3(ata, atb("mapX"));
  const py = solve3(ata, atb("mapY"));

  const det = px[0] * py[1] - px[1] * py[0];
  if (Math.abs(det) < 1e-12) throw new Error("Georeference is degenerate");

  const toMap = ({ e, n }) => ({ x: px[0] * e + px[1] * n + px[2], y: py[0] * e + py[1] * n + py[2] });
  const fromMap = ({ x, y }) => {
    const dx = x - px[2];
    const dy = y - py[2];
    return { e: (py[1] * dx - px[1] * dy) / det, n: (-py[0] * dx + px[0] * dy) / det };
  };

  // How well the fit matches the survey, in metres (0 for a perfect survey)
  const residuals = controlPoints.map((p) => {
    const fitted = fromMap({ x: p.mapX, y: p.mapY });
    const actual = frame.toLocal(p);
    return Math.hypot(fitted.e - actual.e, fitted.n - actual.n);
  });
  const rmsErrorMeters = Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / residuals.length);

  // Metres per 1% of map width / height, for drawing uncertainty circles
  const unitX = fromMap({ x: 1, y: 0 });
  const unitY = fromMap({ x: 0, y: 1 });
  const zero = fromMap({ x: 0, y: 0 });

  return {
    frame,
    toMap,
    fromMap,
    gpsToMap: (geo) => toMap(frame.toLocal(geo)),
    mapToGps: (map) => frame.toGeo(fromMap(map)),
    rmsErrorMeters,
    metersPerMapUnit: {
      x: Math.hypot(unitX.e - zero.e, unitX.n - zero.n),
      y: Math.hypot(unitY.e - zero.e, unitY.n - zero.n),
    },
  };
}

// ============ KALMAN FILTER ============

// Phones report accuracy as a confidence radius (Android: ~68%). For a circular Gaussian the
// 68% radius is ~1.5 standard deviations per axis.
const ACCURACY_TO_SIGMA = 1 / 1.5;
// Chi-square, 2 degrees of freedom: 99.9% of genuine fixes fall inside this Mahalanobis distance²
export const GATE_99_9 = 13.82;

/**
 * Constant-velocity Kalman filter for one axis. State [position, velocity], driven by white
 * acceleration noise (q = acceleration spectral density, m²/s³).
 */
function createAxisFilter(q) {
  let p = 0;
  let v = 0;
  let P = [[0, 0], [0, 0]];

  return {
    init(position, variance, velocityVariance) {
      p = position;
      v = 0;
      P = [[variance, 0], [0, velocityVariance]];
    },
    predict(dt) {
      if (dt <= 0) return;
      p += v * dt;
      // P = F P Fᵀ + Q, with F = [[1, dt], [0, 1]] and Q = q [[dt³/3, dt²/2], [dt²/2, dt]]
      const p00 = P[0][0] + 2 * dt * P[0][1] + dt * dt * P[1][1] + (q * dt ** 3) / 3;
      const p01 = P[0][1] + dt * P[1][1] + (q * dt ** 2) / 2;
      const p11 = P[1][1] + q * dt;
      P = [[p00, p01], [p01, p11]];
    },
    // Innovation (measurement minus prediction) and its variance, used for gating
    innovation(z, r) {
      return { nu: z - p, s: P[0][0] + r };
    },
    // positionOnly: correct position but not velocity (used for de-weighted outliers, so a
    // multipath burst can't corrupt the velocity and drag the estimate away)
    update(z, r, { positionOnly = false } = {}) {
      const s = P[0][0] + r;
      const k0 = P[0][0] / s;
      const k1 = positionOnly ? 0 : P[0][1] / s;
      const nu = z - p;
      p += k0 * nu;
      v += k1 * nu;
      P = [
        [(1 - k0) * P[0][0], (1 - k0) * P[0][1]],
        [(1 - k0) * P[0][1], P[1][1] - k1 * P[0][1]],
      ];
    },
    get position() { return p; },
    get velocity() { return v; },
    get variance() { return P[0][0]; },
  };
}

/**
 * Position filter: accuracy gate + 2D constant-velocity Kalman filter + innovation gate.
 * @param {object} options
 * @param {number} options.processNoise - acceleration noise (m²/s³); higher follows turns faster, smooths less
 * @param {number} options.maxAccuracy - fixes reporting worse accuracy (m) are rejected outright
 * @param {number} options.gate - Mahalanobis distance² above which a fix is treated as an outlier
 * @param {number} options.hardGateFactor - outliers beyond gate × this are discarded; closer ones
 *   are softly de-weighted (see update)
 * @param {number} options.maxConsecutiveRejects - after this many rejections in a row, trust the
 *   measurements again and re-initialise (the filter, not the fixes, was probably wrong)
 * @param {number} options.maxGapSeconds - re-initialise after a longer gap without fixes
 */
export function createPositionFilter({
  // Tuned on simulated walks (see __tests__/positioning.test.js): 0.1 cut error ~60% on average while
  // still following stops and turns at walking pace
  processNoise = 0.1,
  maxAccuracy = 50,
  gate = GATE_99_9,
  hardGateFactor = 1.5, // d² above 1.5 × gate is discarded outright (best of 1-3 over 40 simulated walks)
  maxConsecutiveRejects = 8, // multipath bursts rarely last longer than ~8 s at walking pace
  maxGapSeconds = 30,
} = {}) {
  const east = createAxisFilter(processNoise);
  const north = createAxisFilter(processNoise);
  let initialized = false;
  let lastTime = null;
  let consecutiveRejects = 0;

  const initialize = (e, n, r, time) => {
    east.init(e, r, 4); // velocity unknown: ±2 m/s (walking pace)
    north.init(n, r, 4);
    initialized = true;
    lastTime = time;
    consecutiveRejects = 0;
  };

  const state = () => ({
    e: east.position,
    n: north.position,
    ve: east.velocity,
    vn: north.velocity,
    speed: Math.hypot(east.velocity, north.velocity),
    // 1-sigma horizontal uncertainty (m)
    sigma: Math.sqrt((east.variance + north.variance) / 2),
  });

  return {
    /**
     * Process one fix in local metres.
     * @param {{e, n, accuracy, timestamp}} fix - timestamp in ms
     * @returns {{accepted: boolean, reason: string, state: object|null, mahalanobis?: number}}
     */
    update({ e, n, accuracy, timestamp }) {
      const time = timestamp / 1000;

      if (!Number.isFinite(accuracy) || accuracy > maxAccuracy) {
        return { accepted: false, reason: "low-accuracy", state: initialized ? state() : null };
      }

      const sigma = Math.max(accuracy * ACCURACY_TO_SIGMA, 1);
      const r = sigma * sigma;

      if (!initialized || time - lastTime > maxGapSeconds) {
        initialize(e, n, r, time);
        return { accepted: true, reason: "initialized", state: state() };
      }

      const dt = Math.max(0, time - lastTime);
      east.predict(dt);
      north.predict(dt);
      lastTime = Math.max(lastTime, time);

      const ie = east.innovation(e, r);
      const inn = north.innovation(n, r);
      const mahalanobis = (ie.nu * ie.nu) / ie.s + (inn.nu * inn.nu) / inn.s;

      if (mahalanobis > gate) {
        consecutiveRejects += 1;
        if (consecutiveRejects > maxConsecutiveRejects) {
          initialize(e, n, r, time);
          return { accepted: true, reason: "reacquired", state: state(), mahalanobis };
        }
        // Far outside the gate (typical multipath): discard. Just outside it (typically a real
        // turn the constant-velocity model didn't predict): soft gate, i.e. inflate the noise by
        // (d²/gate)² and correct position only, so the estimate still follows the turn. Hard
        // rejection of big jumps matters: de-weighted multipath fixes would otherwise drag the
        // estimate toward the reflection, making each next one look less unlikely ("capture").
        if (mahalanobis <= gate * hardGateFactor) {
          const inflatedR = r * (mahalanobis / gate) ** 2;
          east.update(e, inflatedR, { positionOnly: true });
          north.update(n, inflatedR, { positionOnly: true });
        }
        return { accepted: false, reason: "outlier", state: state(), mahalanobis };
      }

      consecutiveRejects = 0;
      east.update(e, r);
      north.update(n, r);
      return { accepted: true, reason: "filtered", state: state(), mahalanobis };
    },
    reset() {
      initialized = false;
      lastTime = null;
      consecutiveRejects = 0;
    },
    get initialized() { return initialized; },
  };
}

// ============ ZONE TRACKING ============

/**
 * Decide which zone the visitor is in, with hysteresis so the answer doesn't flicker when they
 * stand near a boundary: entering needs to come within `enterRadius`, leaving needs to go beyond
 * the larger `exitRadius`, and any change must persist for `dwellSamples` consecutive updates.
 */
export function createZoneTracker({ enterRadius = 40, exitRadius = 60, dwellSamples = 3 } = {}) {
  let current = null;
  let pending = undefined;
  let pendingCount = 0;
  // The first position sets the zone immediately (nothing to flicker against yet); only later
  // changes need to persist for the dwell time. Phones may not repeat fixes while standing still.
  let firstUpdate = true;

  return {
    /**
     * @param {{e, n}} position - local metres
     * @param {Array<{id, name, e, n}>} zones - zone centres in local metres
     * @returns {{zone: object|null, distance: number|null, changed: boolean}}
     */
    update(position, zones) {
      const withDistance = zones.map((z) => ({ zone: z, distance: Math.hypot(z.e - position.e, z.n - position.n) }));
      const nearest = withDistance.reduce((best, z) => (!best || z.distance < best.distance ? z : best), null);
      const currentEntry = current && withDistance.find((z) => z.zone.id === current.id);

      let target;
      if (currentEntry && currentEntry.distance <= exitRadius) {
        // Stay, unless another zone is clearly closer and within its entry radius
        const switchTo = nearest && nearest.zone.id !== current.id && nearest.distance <= enterRadius &&
          nearest.distance < currentEntry.distance - (exitRadius - enterRadius);
        target = switchTo ? nearest.zone : current;
      } else {
        target = nearest && nearest.distance <= enterRadius ? nearest.zone : null;
      }

      let changed = false;
      if (firstUpdate) {
        firstUpdate = false;
        changed = !!target;
        current = target;
      } else if ((target?.id ?? null) === (current?.id ?? null)) {
        pending = undefined;
        pendingCount = 0;
      } else {
        if ((pending?.id ?? null) === (target?.id ?? null) && pending !== undefined) {
          pendingCount += 1;
        } else {
          pending = target;
          pendingCount = 1;
        }
        if (pendingCount >= dwellSamples) {
          current = target;
          pending = undefined;
          pendingCount = 0;
          changed = true;
        }
      }

      const currentDistance = current ? withDistance.find((z) => z.zone.id === current.id)?.distance ?? null : null;
      return { zone: current, distance: currentDistance, changed };
    },
    get zone() { return current; },
    reset() {
      current = null;
      pending = undefined;
      pendingCount = 0;
      firstUpdate = true;
    },
  };
}

// ============ FULL PIPELINE ============

/**
 * Raw GPS fix in, filtered map position and zone out.
 * @param {object} geoRef - from createGeoReference
 */
export function createPositioningPipeline(geoRef, { filter: filterOptions, zones: zoneOptions } = {}) {
  const filter = createPositionFilter(filterOptions);
  const tracker = createZoneTracker(zoneOptions);

  // Zones are stored as map percentages (or real GPS when surveyed); convert to local metres
  const zonesToLocal = (zones = []) => zones
    .filter((z) => z && (Number.isFinite(z.latitude) || Number.isFinite(Number(z.map_x))))
    .map((z) => {
      const local = Number.isFinite(z.latitude) && Number.isFinite(z.longitude)
        ? geoRef.frame.toLocal({ lat: z.latitude, lng: z.longitude })
        : geoRef.fromMap({ x: Number(z.map_x), y: Number(z.map_y) });
      return { id: z.id, name: z.zone_name || z.name, ...local };
    });

  let lastEstimate = null;

  // Zone detection needs zones: until they've loaded, leave the tracker untouched
  const updateZone = (zones) => {
    const localZones = zonesToLocal(zones);
    if (!lastEstimate || localZones.length === 0) return tracker.zone;
    return tracker.update(lastEstimate, localZones).zone;
  };

  return {
    /**
     * @param {{lat, lng, accuracy, timestamp}} fix
     * @param {Array} zones - app locations (zone_name, map_x, map_y or latitude/longitude)
     */
    process(fix, zones) {
      const raw = geoRef.frame.toLocal(fix);
      const result = filter.update({ ...raw, accuracy: fix.accuracy, timestamp: fix.timestamp });
      const est = result.state;

      let zone = tracker.zone;
      if (est && result.accepted) {
        lastEstimate = est;
        zone = updateZone(zones);
      }

      return {
        accepted: result.accepted,
        reason: result.reason,
        mahalanobis: result.mahalanobis,
        raw: { ...fix, map: geoRef.toMap(raw) },
        filtered: est
          ? {
              ...geoRef.frame.toGeo(est),
              map: geoRef.toMap(est),
              sigma: est.sigma,
              speed: est.speed,
            }
          : null,
        zone,
      };
    },
    // Re-evaluate the zone for the last position, e.g. once the zone list has loaded
    refreshZone(zones) {
      return updateZone(zones);
    },
    reset() {
      filter.reset();
      tracker.reset();
      lastEstimate = null;
    },
  };
}

// ============ SIMULATION (demo mode and tests) ============

// Small deterministic PRNG so simulated walks are reproducible
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rand) {
  // Box-Muller
  const u = Math.max(rand(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

/**
 * Simulate a phone's GPS stream for a visitor walking a route, with realistic error sources:
 *  - white noise (receiver noise) and slowly drifting bias (atmospheric/ephemeris error,
 *    first-order Gauss-Markov process)
 *  - multipath bursts near structures: a reflected signal shifts the fix by tens of metres for a
 *    few seconds while the phone still reports good accuracy
 *  - occasional degraded fixes the phone correctly reports as inaccurate (under tree canopy)
 *
 * @param {object} geoRef - from createGeoReference
 * @param {Array<{x, y, pauseSeconds?}>} waypoints - route on the map (percentages)
 * @returns {Array<{lat, lng, accuracy, timestamp, truth: {lat, lng}, kind}>}
 */
export function simulateGpsWalk(geoRef, waypoints, {
  seed = 1,
  speed = 1.3, // m/s, walking pace
  interval = 1, // s between fixes (phones deliver ~1 Hz)
  noiseSigma = 4, // m, white noise per axis
  biasSigma = 3, // m, drifting bias per axis
  biasTau = 30, // s, bias correlation time
  multipathRate = 0.012, // chance per fix of a multipath burst starting
  degradedRate = 0.03, // chance per fix of a fix the phone flags as inaccurate
  startTime = Date.now(),
} = {}) {
  const rand = mulberry32(seed);
  const points = waypoints.map((w) => ({ ...geoRef.fromMap(w), pause: w.pauseSeconds || 0 }));

  // Ground-truth positions sampled every `interval` seconds along the route
  const truth = [];
  for (let i = 0; i < points.length; i++) {
    const from = points[i];
    for (let s = 0; s < from.pause; s += interval) truth.push({ e: from.e, n: from.n });
    const to = points[i + 1];
    if (!to) {
      truth.push({ e: from.e, n: from.n });
      break;
    }
    const length = Math.hypot(to.e - from.e, to.n - from.n);
    const steps = Math.max(1, Math.round(length / (speed * interval)));
    for (let k = 0; k < steps; k++) {
      const f = k / steps;
      truth.push({ e: from.e + (to.e - from.e) * f, n: from.n + (to.n - from.n) * f });
    }
  }

  const decay = Math.exp(-interval / biasTau);
  const biasDrive = biasSigma * Math.sqrt(1 - decay * decay);
  let bias = { e: gaussian(rand) * biasSigma, n: gaussian(rand) * biasSigma };
  let multipath = null;

  return truth.map((t, i) => {
    bias = { e: bias.e * decay + gaussian(rand) * biasDrive, n: bias.n * decay + gaussian(rand) * biasDrive };

    if (!multipath && rand() < multipathRate) {
      const angle = rand() * 2 * Math.PI;
      const size = 25 + rand() * 40;
      multipath = { e: Math.cos(angle) * size, n: Math.sin(angle) * size, remaining: 3 + Math.floor(rand() * 5) };
    }

    let kind = "normal";
    let error = { e: bias.e + gaussian(rand) * noiseSigma, n: bias.n + gaussian(rand) * noiseSigma };
    let accuracy = 1.5 * noiseSigma * (0.8 + rand() * 0.5);

    if (multipath) {
      kind = "multipath";
      error = { e: error.e + multipath.e, n: error.n + multipath.n };
      multipath.remaining -= 1;
      if (multipath.remaining <= 0) multipath = null;
    } else if (rand() < degradedRate) {
      kind = "degraded";
      const size = 40 + rand() * 80;
      const angle = rand() * 2 * Math.PI;
      error = { e: error.e + Math.cos(angle) * size, n: error.n + Math.sin(angle) * size };
      accuracy = 60 + rand() * 90;
    }

    return {
      ...geoRef.frame.toGeo({ e: t.e + error.e, n: t.n + error.n }),
      accuracy,
      timestamp: startTime + i * interval * 1000,
      truth: geoRef.frame.toGeo(t),
      kind,
    };
  });
}

/** Root-mean-square distance in metres between estimated and true positions. */
export function rmsError(frame, pairs) {
  if (pairs.length === 0) return null;
  const sum = pairs.reduce((s, { estimate, truth }) => {
    const a = frame.toLocal(estimate);
    const b = frame.toLocal(truth);
    return s + (a.e - b.e) ** 2 + (a.n - b.n) ** 2;
  }, 0);
  return Math.sqrt(sum / pairs.length);
}
