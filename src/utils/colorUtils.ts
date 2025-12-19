/**
 * Color utility functions for the canvas engine
 * Handles color manipulation, contrast calculation, and adaptive theming
 */

/**
 * Parse a hex color string to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB to hex color string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Calculate relative luminance of a color (0-1)
 * Based on WCAG 2.0 formula
 */
export function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Check if a color is considered "dark" (luminance < 0.5)
 */
export function isDarkColor(hex: string): boolean {
  return getLuminance(hex) < 0.5;
}

/**
 * Check if a color is considered "light" (luminance >= 0.5)
 */
export function isLightColor(hex: string): boolean {
  return getLuminance(hex) >= 0.5;
}

/**
 * Get contrasting grid colors based on background color
 * Returns colors that will be visible against the background
 */
export function getContrastingGridColors(backgroundColor: string): {
  gridColor: string;
  subGridColor: string;
} {
  const luminance = getLuminance(backgroundColor);
  
  if (luminance < 0.3) {
    // Very dark background - use light grid
    return {
      gridColor: 'rgba(255, 255, 255, 0.25)',
      subGridColor: 'rgba(255, 255, 255, 0.12)',
    };
  } else if (luminance < 0.5) {
    // Dark background - use lighter grid
    return {
      gridColor: 'rgba(255, 255, 255, 0.2)',
      subGridColor: 'rgba(255, 255, 255, 0.1)',
    };
  } else if (luminance < 0.7) {
    // Light background - use darker grid
    return {
      gridColor: 'rgba(0, 0, 0, 0.15)',
      subGridColor: 'rgba(0, 0, 0, 0.08)',
    };
  } else {
    // Very light background - use dark grid
    return {
      gridColor: 'rgba(0, 0, 0, 0.2)',
      subGridColor: 'rgba(0, 0, 0, 0.1)',
    };
  }
}

/**
 * Get contrasting axis colors based on background color
 * Returns colors that will be visible against the background
 */
export function getContrastingAxisColors(backgroundColor: string): {
  axisColor: string;
  tickColor: string;
  labelColor: string;
} {
  const luminance = getLuminance(backgroundColor);
  
  if (luminance < 0.4) {
    // Dark background - use light axis
    return {
      axisColor: 'rgba(255, 255, 255, 0.7)',
      tickColor: 'rgba(255, 255, 255, 0.6)',
      labelColor: 'rgba(255, 255, 255, 0.85)',
    };
  } else {
    // Light background - use dark axis
    return {
      axisColor: 'rgba(100, 100, 100, 0.9)',
      tickColor: 'rgba(80, 80, 80, 0.8)',
      labelColor: 'rgba(60, 60, 60, 1)',
    };
  }
}

/**
 * Blend two colors together
 */
export function blendColors(color1: string, color2: string, ratio: number): string {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return color1;
  
  const r = Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio);
  const g = Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio);
  const b = Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio);
  
  return rgbToHex(r, g, b);
}
