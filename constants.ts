/**
 * Global constants for the Celestial Christmas Tree application
 * Centralized configuration for easy maintenance and consistency
 */

// ============================================================================
// TREE GEOMETRY
// ============================================================================
export const TREE_HEIGHT = 12;
export const TREE_BASE_RADIUS = 4.5;
export const TREE_Y_OFFSET = -1;

// ============================================================================
// PARTICLE COUNTS
// ============================================================================
export const NEEDLES_COUNT = 2400;
export const BAUBLES_COUNT = 150;
export const SPIRAL_LIGHTS_COUNT = 400;

// ============================================================================
// ANIMATION SPEEDS
// ============================================================================
export const AUTO_ROTATE_SPEED = 0.3;

// ============================================================================
// CAMERA SETTINGS
// ============================================================================
export const CAMERA_POSITION_DESKTOP: [number, number, number] = [0, 0, 18];
export const CAMERA_POSITION_MOBILE: [number, number, number] = [0, 0, 28];
export const CAMERA_FOV = 45;

// ============================================================================
// COLOR PALETTES
// ============================================================================
export const GREEN_PALETTE = ['#004225', '#0f5132', '#146c43', '#198754', '#2E8B57'];
export const GOLD_PALETTE = ['#FFD700', '#D4AF37', '#DAA520', '#B8860B'];
export const GOLD_NEEDLE_CHANCE = 0.15;

export const BAUBLE_COLORS = [
  '#D42426', // Classic Red
  '#FFD700', // Gold
  '#C0C0C0', // Silver
  '#1E90FF', // Bright Blue
  '#9B59B6', // Purple
  '#2ECC71', // Emerald Green
  '#E91E63', // Pink
  '#F39C12'  // Bronze/Orange
];

