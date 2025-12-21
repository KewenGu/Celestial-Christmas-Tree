/**
 * Global constants for the Celestial Christmas Tree application
 */

// Tree Geometry
export const TREE_HEIGHT = 12;
export const TREE_BASE_RADIUS = 4.5;
export const TREE_Y_OFFSET = -1;

// Particle Counts
export const NEEDLES_COUNT = 2400;
export const BAUBLES_COUNT = 150;
export const SPIRAL_LIGHTS_COUNT = 400;
export const GIFTS_COUNT = 30;
export const FRAMES_COUNT = 15;

// Animation Speeds
export const AUTO_ROTATE_SPEED = 0.3;
export const PARTICLE_LERP_SPEED = 2;
export const TARGETED_ITEM_LERP_SPEED = 3.5;
export const IDLE_ITEM_LERP_SPEED = 1.5;

// Gesture Recognition
export const GESTURE_CONFIDENCE_THRESHOLD = 5;
export const PINCH_DISTANCE_THRESHOLD = 0.08;
export const THUMB_EXTENDED_DISTANCE = 0.2;
export const FINGER_EXTENSION_MULTIPLIER = 1.2;

// Camera
export const CAMERA_POSITION_DESKTOP: [number, number, number] = [0, 0, 18];
export const CAMERA_POSITION_MOBILE: [number, number, number] = [0, 0, 28];
export const CAMERA_FOV = 45;

// Interactive Items
export const TARGETED_DISTANCE = 2.5;
export const TARGETED_SCALE_GIFT = 0.5;  // 从 0.35 增加到 0.5，更大
export const TARGETED_SCALE_FRAME = 0.45;
export const MAX_HISTORY_SIZE_RATIO = 0.5;

// Color Palettes
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

export const GIFT_PALETTE = [
  { base: '#800020', stripe: '#D4AF37' }, // Burgundy & Gold
  { base: '#004225', stripe: '#E5E4E2' }, // British Racing Green & Platinum
  { base: '#F8F8FF', stripe: '#C41E3A' }, // Ghost White & Cardinal Red
  { base: '#B8860B', stripe: '#191970' }, // Dark Goldenrod & Midnight Blue
  { base: '#660000', stripe: '#FFD700' }, // Blood Red & Bright Gold
  { base: '#FFFAF0', stripe: '#228B22' }, // Floral White & Forest Green
  { base: '#4B0082', stripe: '#F0E68C' }, // Indigo & Khaki
];

export const FRAME_PALETTE = [
  { color: '#FFD700' }, // Classic Gold
  { color: '#D4AF37' }, // Metallic Gold
  { color: '#C0C0C0' }, // Silver
  { color: '#CD7F32' }, // Bronze
  { color: '#B76E79' }, // Rose Gold
  { color: '#8B4513' }, // Saddle Brown
];

// Default Content
export const DEFAULT_GIFT_MESSAGES = [
  "New iPhone 16", 
  "World Peace", 
  "A Pair of Socks", 
  "NVIDIA RTX 5090",
  "A Warm Hug", 
  "$1000 Amazon Card", 
  "Coal :(", 
  "Trip to Mars",
  "React Tutorials", 
  "Infinite Coffee"
];

export const FESTIVE_IMAGES = [
  "https://images.unsplash.com/photo-1512474932049-78ea796b6c42?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1576692131267-cf522760a218?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1543094209-4c126601b1e9?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1513297887119-d46091b24bfa?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1543589077-47d81606c1bf?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1482638202333-c77d501dd2ec?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1575373803274-a622a8459286?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1511108690759-009324a90311?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1544979590-2799616a614d?auto=format&fit=crop&w=600&q=80",
  "https://images.unsplash.com/photo-1606819717115-9159c900370b?auto=format&fit=crop&w=600&q=80",
];

// External URLs
export const MEDIAPIPE_WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
export const HAND_LANDMARKER_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

