// GPS positioning pipeline tests
import {
  createLocalFrame,
  createGeoReference,
  createPositionFilter,
  createZoneTracker,
  createPositioningPipeline,
  simulateGpsWalk,
  rmsError,
} from '../positioning';

const CONTROL_POINTS = [
  { lat: 25.04, lng: 55.15, mapX: 0, mapY: 0 },
  { lat: 25.04, lng: 55.157, mapX: 100, mapY: 0 },
  { lat: 25.035, lng: 55.157, mapX: 100, mapY: 100 },
  { lat: 25.035, lng: 55.15, mapX: 0, mapY: 100 },
];
const geo = createGeoReference(CONTROL_POINTS);

const ZONES = [
  { id: 'entrance', zone_name: 'Main Entrance', map_x: 50, map_y: 90 },
  { id: 'shop', zone_name: 'Farm Shop', map_x: 55, map_y: 45 },
  { id: 'yard', zone_name: 'Animal Yard', map_x: 70, map_y: 30 },
  { id: 'green', zone_name: 'Greenhouses', map_x: 20, map_y: 25 },
];
const ROUTE = [{ x: 50, y: 90 }, { x: 55, y: 45, pauseSeconds: 15 }, { x: 70, y: 30 }, { x: 20, y: 25 }];

describe('coordinate frames', () => {
  it('round-trips between GPS and local metres', () => {
    const frame = createLocalFrame({ lat: 25.0375, lng: 55.1535 });
    const point = { lat: 25.0391, lng: 55.1502 };
    const back = frame.toGeo(frame.toLocal(point));
    expect(back.lat).toBeCloseTo(point.lat, 9);
    expect(back.lng).toBeCloseTo(point.lng, 9);
  });

  it('measures distances correctly (1/1000 degree of latitude is ~111 m)', () => {
    const frame = createLocalFrame({ lat: 25, lng: 55 });
    expect(frame.toLocal({ lat: 25.001, lng: 55 }).n).toBeCloseTo(111.2, 0);
  });
});

describe('createGeoReference', () => {
  it('maps the control points exactly when the survey is consistent', () => {
    expect(geo.rmsErrorMeters).toBeLessThan(0.01);
    const corner = geo.gpsToMap({ lat: 25.04, lng: 55.157 });
    expect(corner.x).toBeCloseTo(100, 3);
    expect(corner.y).toBeCloseTo(0, 3);
  });

  it('round-trips map percentages through GPS', () => {
    const back = geo.gpsToMap(geo.mapToGps({ x: 37, y: 61 }));
    expect(back.x).toBeCloseTo(37, 6);
    expect(back.y).toBeCloseTo(61, 6);
  });

  it('averages out survey error by least squares and reports it', () => {
    // Same rectangle, but each surveyed GPS point is off by a few metres
    const noisy = CONTROL_POINTS.map((p, i) => ({ ...p, lat: p.lat + [3, -2, 4, -3][i] * 9e-6 }));
    const fit = createGeoReference([...noisy, { lat: 25.0375, lng: 55.1535, mapX: 50, mapY: 50 }]);
    expect(fit.rmsErrorMeters).toBeGreaterThan(0.5);
    expect(fit.rmsErrorMeters).toBeLessThan(5);
  });

  it('rejects too few or collinear points', () => {
    expect(() => createGeoReference(CONTROL_POINTS.slice(0, 2))).toThrow(/At least 3/);
    expect(() => createGeoReference([
      { lat: 25, lng: 55, mapX: 0, mapY: 0 },
      { lat: 25.001, lng: 55.001, mapX: 10, mapY: 10 },
      { lat: 25.002, lng: 55.002, mapX: 20, mapY: 20 },
    ])).toThrow(/collinear/);
  });
});

describe('createPositionFilter', () => {
  it('rejects fixes the phone reports as inaccurate', () => {
    const filter = createPositionFilter();
    expect(filter.update({ e: 0, n: 0, accuracy: 120, timestamp: 0 })).toMatchObject({ accepted: false, reason: 'low-accuracy' });
  });

  it('converges on a stationary visitor and shrinks its uncertainty', () => {
    const filter = createPositionFilter();
    let result;
    for (let i = 0; i < 30; i++) {
      // Alternating ±5 m noise around (10, 20)
      const noise = i % 2 ? 5 : -5;
      result = filter.update({ e: 10 + noise, n: 20 - noise, accuracy: 8, timestamp: i * 1000 });
    }
    // Raw fixes are 7 m off on every sample; the estimate settles within ~1 m
    expect(Math.abs(result.state.e - 10)).toBeLessThan(1.5);
    expect(Math.abs(result.state.n - 20)).toBeLessThan(1.5);
    expect(result.state.sigma).toBeLessThan(3);
  });

  it('rejects a sudden multipath jump the phone still calls accurate', () => {
    const filter = createPositionFilter();
    for (let i = 0; i < 10; i++) filter.update({ e: 0, n: 0, accuracy: 6, timestamp: i * 1000 });
    const jump = filter.update({ e: 60, n: 0, accuracy: 6, timestamp: 10000 });
    expect(jump).toMatchObject({ accepted: false, reason: 'outlier' });
    expect(Math.abs(jump.state.e)).toBeLessThan(2);
  });

  it('re-acquires when the visitor really did move (repeated consistent "outliers")', () => {
    const filter = createPositionFilter({ maxConsecutiveRejects: 3 });
    for (let i = 0; i < 10; i++) filter.update({ e: 0, n: 0, accuracy: 6, timestamp: i * 1000 });
    let result;
    for (let i = 10; i < 15; i++) result = filter.update({ e: 80, n: 0, accuracy: 6, timestamp: i * 1000 });
    expect(result.accepted).toBe(true);
    expect(result.state.e).toBeGreaterThan(70);
  });

  it('tracks a walking visitor and estimates their speed', () => {
    const filter = createPositionFilter();
    let result;
    for (let i = 0; i <= 60; i++) result = filter.update({ e: 1.3 * i, n: 0, accuracy: 6, timestamp: i * 1000 });
    expect(result.state.speed).toBeCloseTo(1.3, 0);
    expect(result.state.e).toBeCloseTo(78, -1);
  });
});

describe('createZoneTracker', () => {
  const zones = [{ id: 'a', name: 'A', e: 0, n: 0 }, { id: 'b', name: 'B', e: 200, n: 0 }];

  it('sets the zone from the first position immediately', () => {
    const tracker = createZoneTracker({ dwellSamples: 3 });
    expect(tracker.update({ e: 5, n: 0 }, zones).zone.id).toBe('a');
  });

  it('changes zone only after the dwell time', () => {
    const tracker = createZoneTracker({ dwellSamples: 3 });
    tracker.update({ e: 5, n: 0 }, zones);
    expect(tracker.update({ e: 195, n: 0 }, zones).zone.id).toBe('a');
    expect(tracker.update({ e: 195, n: 0 }, zones).zone.id).toBe('a');
    expect(tracker.update({ e: 195, n: 0 }, zones).zone.id).toBe('b');
  });

  it("doesn't flicker when hovering around the entry boundary", () => {
    const tracker = createZoneTracker({ enterRadius: 40, exitRadius: 60, dwellSamples: 2 });
    for (let i = 0; i < 3; i++) tracker.update({ e: 10, n: 0 }, zones);
    let changes = 0;
    for (let i = 0; i < 40; i++) {
      // Wobble between 35 m and 55 m from A: inside the exit radius, so stay in A
      if (tracker.update({ e: i % 2 ? 35 : 55, n: 0 }, zones).changed) changes++;
    }
    expect(changes).toBe(0);
    expect(tracker.zone.id).toBe('a');
  });

  it('leaves a zone once clearly outside the exit radius', () => {
    const tracker = createZoneTracker({ dwellSamples: 2 });
    for (let i = 0; i < 3; i++) tracker.update({ e: 0, n: 0 }, zones);
    for (let i = 0; i < 3; i++) tracker.update({ e: 100, n: 0 }, zones);
    expect(tracker.zone).toBeNull();
  });
});

describe('end-to-end on simulated GPS walks', () => {
  const runWalk = (seed) => {
    const fixes = simulateGpsWalk(geo, ROUTE, { seed, startTime: 0 });
    const pipeline = createPositioningPipeline(geo);
    const raw = [];
    const filtered = [];
    const zoneSequence = [];
    let rejectedMultipath = 0;
    let multipath = 0;

    fixes.forEach((fix) => {
      const result = pipeline.process(fix, ZONES);
      raw.push({ estimate: fix, truth: fix.truth });
      if (result.filtered) filtered.push({ estimate: result.filtered, truth: fix.truth });
      if (fix.kind === 'multipath') {
        multipath++;
        if (!result.accepted) rejectedMultipath++;
      }
      const zoneId = result.zone?.id ?? null;
      if (zoneSequence[zoneSequence.length - 1] !== zoneId) zoneSequence.push(zoneId);
    });

    return {
      rawRms: rmsError(geo.frame, raw),
      filteredRms: rmsError(geo.frame, filtered),
      multipath,
      rejectedMultipath,
      zoneSequence: zoneSequence.filter(Boolean),
    };
  };

  it('filtering cuts position error by at least 50% on average, and 30% on every walk', () => {
    const improvements = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((seed) => {
      const { rawRms, filteredRms } = runWalk(seed);
      return 1 - filteredRms / rawRms;
    });
    const average = improvements.reduce((s, x) => s + x, 0) / improvements.length;
    expect(average).toBeGreaterThan(0.5);
    expect(Math.min(...improvements)).toBeGreaterThan(0.3);
  });

  it('rejects most multipath fixes', () => {
    const totals = [1, 2, 3, 4, 5].map(runWalk).reduce(
      (t, r) => ({ multipath: t.multipath + r.multipath, rejected: t.rejected + r.rejectedMultipath }),
      { multipath: 0, rejected: 0 }
    );
    expect(totals.rejected / totals.multipath).toBeGreaterThan(0.5);
  });

  it('reports the zones along the route in order, without flicker', () => {
    expect(runWalk(3).zoneSequence).toEqual(['entrance', 'shop', 'yard', 'green']);
  });

  it('finds the zone once zones load after the first fix', () => {
    const pipeline = createPositioningPipeline(geo);
    const atShop = { ...geo.mapToGps({ x: 55, y: 45 }), accuracy: 8, timestamp: 0 };
    expect(pipeline.process(atShop, []).zone).toBeNull();
    expect(pipeline.refreshZone(ZONES).id).toBe('shop');
  });

  it('is reproducible for a given seed', () => {
    expect(simulateGpsWalk(geo, ROUTE, { seed: 7, startTime: 0 })).toEqual(simulateGpsWalk(geo, ROUTE, { seed: 7, startTime: 0 }));
  });
});
