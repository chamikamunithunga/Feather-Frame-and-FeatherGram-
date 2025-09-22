// Utility functions for scroll management

/**
 * Scroll to the top of the page instantly
 */
export const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'instant'
  });
};

/**
 * Scroll to the top of the page smoothly
 */
export const smoothScrollToTop = () => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'smooth'
  });
};

/**
 * Scroll to a specific element by ID
 * @param {string} elementId - The ID of the element to scroll to
 * @param {string} behavior - 'smooth' or 'instant' (default: 'smooth')
 */
export const scrollToElement = (elementId, behavior = 'smooth') => {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({
      behavior,
      block: 'start',
      inline: 'nearest'
    });
  }
};

/**
 * Scroll to a specific position
 * @param {number} top - The vertical position to scroll to
 * @param {string} behavior - 'smooth' or 'instant' (default: 'smooth')
 */
export const scrollToPosition = (top, behavior = 'smooth') => {
  window.scrollTo({
    top,
    left: 0,
    behavior
  });
};

/**
 * Get the current scroll position
 * @returns {number} The current vertical scroll position
 */
export const getCurrentScrollPosition = () => {
  return window.pageYOffset || document.documentElement.scrollTop;
};

/**
 * Check if the page is scrolled to the top
 * @returns {boolean} True if at the top, false otherwise
 */
export const isAtTop = () => {
  return getCurrentScrollPosition() === 0;
}; 