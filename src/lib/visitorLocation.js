/**
 * The visitor's current zone, as determined by the GPS positioning pipeline on the map page.
 * Shared in memory so the AI assistant (on any page) can answer "what's near me?".
 */

// After this long without a position update the zone is considered unknown
const MAX_AGE_MS = 10 * 60 * 1000;

let current = null;

export function setVisitorZone(zone, { simulated = false } = {}) {
  current = zone ? { id: zone.id, name: zone.name, simulated, updatedAt: Date.now() } : null;
}

export function getVisitorZone() {
  if (!current || Date.now() - current.updatedAt > MAX_AGE_MS) return null;
  return current;
}
