import * as THREE from 'three';

export enum AppState {
  SCATTERED = 'SCATTERED',
  TREE_SHAPE = 'TREE_SHAPE',
}

export enum InteractionMode {
  IDLE = 'IDLE',
  PULLING_FRAME = 'PULLING_FRAME', // Index + Thumb
  PULLING_GIFT = 'PULLING_GIFT',   // 5 Fingers
}

export interface DualPosition {
  treePosition: THREE.Vector3;
  scatterPosition: THREE.Vector3;
  rotation: THREE.Euler;
  scale: number;
  color: string;
}

export interface InteractiveItemData extends DualPosition {
  id: string;
  type: 'gift' | 'frame';
  imageUrl?: string;
  giftContent?: string; // Text to display on the paper inside the gift
}