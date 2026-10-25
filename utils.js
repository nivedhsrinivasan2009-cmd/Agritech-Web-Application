/**
 * Utility functions for the Gracia Visitor App
 */

/**
 * Creates a URL path for a given page name
 * @param {string} page - The page name (e.g., "Home", "Events", "MapZones?zone=123")
 * @returns {string} - The formatted URL path
 */
export function createPageUrl(page) {
  if (!page) return "/";

  // Handle query parameters
  const [pageName, queryString] = page.split("?");

  // Convert page name to URL-friendly format
  const routes = {
    Home: "/",
    Events: "/events",
    Activities: "/activities",
    Shops: "/shops",
    MapZones: "/map",
    About: "/about",
    Assistant: "/assistant",
    Login: "/login",
    Profile: "/profile",
  };

  const basePath = routes[pageName] || `/${pageName.toLowerCase()}`;

  return queryString ? `${basePath}?${queryString}` : basePath;
}

/**
 * Formats a date to a readable string
 * @param {Date|string} date - The date to format
 * @param {string} format - The format type ('short', 'long', 'time')
 * @returns {string} - Formatted date string
 */
export function formatDate(date, format = "short") {
  const d = new Date(date);

  if (format === "time") {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }

  if (format === "long") {
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/**
 * Checks if a shop is currently open based on opening hours string
 * @param {string} openingHours - Opening hours string (e.g., "9:00 AM - 6:00 PM", "Closed", "24 hours")
 * @param {Date} now - The time to check (defaults to the current time)
 * @returns {boolean|null} - true if open, false if closed, null if cannot determine
 */
export function isShopOpen(openingHours, now = new Date()) {
  if (!openingHours) return null;

  const normalized = openingHours.trim().toLowerCase();
  if (normalized === "closed") return false;
  if (/24\s*(hours|hrs|\/\s*7)/.test(normalized)) return true;

  try {
    // Try to parse common formats like "9:00 AM - 6:00 PM" or "08:00 - 18:00"
    const match = openingHours.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)?\s*[-–]\s*(\d{1,2}):?(\d{2})?\s*(AM|PM)?/i);

    if (!match) return null;

    let [, openHour, openMin = "00", openPeriod, closeHour, closeMin = "00", closePeriod] = match;

    openHour = parseInt(openHour, 10);
    closeHour = parseInt(closeHour, 10);
    openMin = parseInt(openMin, 10);
    closeMin = parseInt(closeMin, 10);

    // Convert to 24-hour format if AM/PM is specified
    if (openPeriod?.toUpperCase() === "PM" && openHour !== 12) openHour += 12;
    if (openPeriod?.toUpperCase() === "AM" && openHour === 12) openHour = 0;
    if (closePeriod?.toUpperCase() === "PM" && closeHour !== 12) closeHour += 12;
    if (closePeriod?.toUpperCase() === "AM" && closeHour === 12) closeHour = 0;

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;

    // Overnight hours such as "6:00 PM - 2:00 AM" wrap past midnight
    if (closeMinutes <= openMinutes) {
      return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
    }
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  } catch {
    return null;
  }
}

/**
 * Truncates text to a specified length
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} - Truncated text with ellipsis if needed
 */
export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

/**
 * Generates a unique ID
 * @returns {string} - A unique identifier
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Debounce function for search inputs
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Classname utility for conditional classes
 * @param  {...any} classes - Class names or conditional objects
 * @returns {string} - Combined class string
 */
export function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}
