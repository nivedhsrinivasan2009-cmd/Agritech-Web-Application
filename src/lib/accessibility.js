/**
 * Accessibility utilities for Gracia Visitor App
 * Provides helper functions for WCAG compliance
 */

// Screen reader only text (visually hidden but accessible)
export const srOnly = "sr-only";

// Skip to main content link styles
export const skipLinkStyles = `
  absolute -top-10 left-0 z-[100] bg-[#2D5016] text-white px-4 py-2 rounded-b-lg
  focus:top-0 transition-all duration-200
`;

// Focus visible styles for keyboard navigation
export const focusVisibleStyles = `
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5016]
  focus-visible:ring-offset-2 focus-visible:ring-offset-white
`;

// Reduced motion media query class
export const reducedMotionStyles = `
  motion-reduce:transition-none motion-reduce:animate-none
`;

// High contrast mode support
export const highContrastStyles = `
  forced-colors:border-current forced-colors:outline-current
`;

// Announce message to screen readers
export function announceToScreenReader(message, priority = "polite") {
  const announcement = document.createElement("div");
  announcement.setAttribute("role", "status");
  announcement.setAttribute("aria-live", priority);
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = "sr-only";
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// Generate unique IDs for ARIA relationships
let idCounter = 0;
export function generateAriaId(prefix = "aria") {
  return `${prefix}-${++idCounter}`;
}

// Check if user prefers reduced motion
export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Check if user prefers high contrast
export function prefersHighContrast() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(forced-colors: active)").matches;
}

// Trap focus within a container (for modals/dialogs)
export function trapFocus(containerElement) {
  const focusableElements = containerElement.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  function handleKeyDown(e) {
    if (e.key !== "Tab") return;

    if (e.shiftKey && document.activeElement === firstFocusable) {
      e.preventDefault();
      lastFocusable.focus();
    } else if (!e.shiftKey && document.activeElement === lastFocusable) {
      e.preventDefault();
      firstFocusable.focus();
    }
  }

  containerElement.addEventListener("keydown", handleKeyDown);

  return () => {
    containerElement.removeEventListener("keydown", handleKeyDown);
  };
}

// Default export
export default {
  srOnly,
  skipLinkStyles,
  focusVisibleStyles,
  reducedMotionStyles,
  highContrastStyles,
  announceToScreenReader,
  generateAriaId,
  prefersReducedMotion,
  prefersHighContrast,
  trapFocus,
};
