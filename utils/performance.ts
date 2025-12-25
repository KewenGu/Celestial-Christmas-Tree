/**
 * Performance utilities for monitoring and optimization
 */

/**
 * Throttle a function to execute at most once per specified time interval
 * @param func - Function to throttle
 * @param delay - Minimum time between executions in milliseconds
 * @returns Throttled function
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

/**
 * Debounce a function to execute only after it stops being called for specified time
 * @param func - Function to debounce
 * @param delay - Wait time in milliseconds
 * @returns Debounced function
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Check if the device is likely a mobile device based on screen size
 * @returns True if mobile device
 */
export const isMobileDevice = (): boolean => {
  return typeof window !== 'undefined' && window.innerWidth < 768;
};

/**
 * Get optimal particle count based on device capabilities
 * @param baseCount - Base particle count for desktop
 * @param mobileReduction - Reduction factor for mobile (default: 0.5)
 * @returns Optimized particle count
 */
export const getOptimalParticleCount = (
  baseCount: number,
  mobileReduction: number = 0.5
): number => {
  return isMobileDevice() ? Math.floor(baseCount * mobileReduction) : baseCount;
};



