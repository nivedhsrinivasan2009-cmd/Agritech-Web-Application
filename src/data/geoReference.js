/**
 * Georeference survey for the farm map.
 *
 * The map places zones by percentage (map_x/map_y, 0-100, origin top-left), while phones report
 * GPS latitude/longitude. These control points tie the two together: each one is a landmark
 * whose GPS position was measured on site AND whose position on the map is known. A
 * least-squares affine fit over the points (src/lib/positioning.js) then converts any GPS fix
 * into map coordinates, absorbing the map's scale, rotation and skew.
 *
 * HOW TO SURVEY (about 15 minutes on site):
 *   1. Pick 3-6 landmarks spread around the farm (corners are best), e.g. the Main Entrance gate,
 *      the Greenhouse door, the Animal Yard gate, the far corner of the Parking Area.
 *   2. Stand at each one with a phone, wait ~30 s for GPS to settle, and note latitude/longitude
 *      (Google Maps: long-press your blue dot).
 *   3. Note the same landmark's position on the app map as percentages (x from the left, y from the top).
 *   4. Replace CONTROL_POINTS below and set IS_PLACEHOLDER to false.
 * More points than 3 average out survey error; the map page shows the fit's residual error.
 */

// Placeholder: the corners of the approximate venue rectangle used before the survey
export const IS_PLACEHOLDER = true;

export const CONTROL_POINTS = [
  { name: "North-west corner", lat: 25.04, lng: 55.15, mapX: 0, mapY: 0 },
  { name: "North-east corner", lat: 25.04, lng: 55.157, mapX: 100, mapY: 0 },
  { name: "South-east corner", lat: 25.035, lng: 55.157, mapX: 100, mapY: 100 },
  { name: "South-west corner", lat: 25.035, lng: 55.15, mapX: 0, mapY: 100 },
];
