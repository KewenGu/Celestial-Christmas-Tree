import * as THREE from 'three';

/**
 * Application state enumeration
 */
export enum AppState {
  /** Particles scattered in space */
  SCATTERED = 'SCATTERED',
  /** Particles formed into a Christmas tree shape */
  TREE_SHAPE = 'TREE_SHAPE',
}

/**
 * User interaction mode enumeration
 */
export enum InteractionMode {
  /** No active interaction */
  IDLE = 'IDLE',
  /** User is pulling/viewing a photo frame (pinch gesture) */
  PULLING_FRAME = 'PULLING_FRAME',
  /** User is pulling/opening a gift (point gesture) */
  PULLING_GIFT = 'PULLING_GIFT',
}

/**
 * Base interface for objects with dual positions (tree and scattered)
 */
export interface DualPosition {
  /** Position when in tree formation */
  treePosition: THREE.Vector3;
  /** Position when scattered */
  scatterPosition: THREE.Vector3;
  /** Rotation of the object */
  rotation: THREE.Euler;
  /** Scale factor */
  scale: number;
  /** Base color */
  color: string;
}

/**
 * Interactive item data (gifts and photo frames)
 */
export interface InteractiveItemData extends DualPosition {
  /** Unique identifier */
  id: string;
  /** Type of interactive item */
  type: 'gift' | 'frame';
  /** Image URL for frames */
  imageUrl?: string;
  /** Text message for gifts */
  giftContent?: string;
}