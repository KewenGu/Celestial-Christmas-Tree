import * as THREE from 'three';

// Helper to get a random number between min and max
export const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

// Generate a point inside a sphere (for SCATTERED state)
export const getSpherePosition = (radius: number): THREE.Vector3 => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius;
  
  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  const z = r * Math.cos(phi);
  
  return new THREE.Vector3(x, y, z);
};

// Generate a point on/in a cone (for TREE_SHAPE state)
export const getConePosition = (
  height: number, 
  baseRadius: number, 
  yOffset: number = 0,
  surfaceOnly: boolean = false
): THREE.Vector3 => {
  // Correctly sample height based on volume/area to ensure uniform density.
  // A cone is much wider at the bottom. If we pick Y linearly, the tip looks too dense.
  const u = Math.random();
  let y;

  if (surfaceOnly) {
    // OLD: y = height * (1 - Math.sqrt(u));
    // NEW: Bias towards top (Power ~0.7). 
    // This ensures gifts/frames are well-distributed even near the narrow top.
    y = height * (1 - Math.pow(u, 0.7));
  } else {
    // OLD: y = height * (1 - Math.cbrt(u));
    // NEW: y = height * (1 - Math.sqrt(u));
    // Switching from Cubic Root (Volume) to Square Root (Area-like) distribution.
    // This artificially increases density at the top compared to a real cone,
    // making the tip visually distinct and "solid" rather than fading away.
    y = height * (1 - Math.sqrt(u));
  }

  // Radius at this height (linear interpolation from base to tip)
  const rAtY = (1 - y / height) * baseRadius;
  
  // Random angle
  const theta = Math.random() * Math.PI * 2;
  
  // Random distance from center (if surfaceOnly is true, push to edge)
  const r = surfaceOnly ? rAtY * randomRange(0.9, 1.0) : Math.sqrt(Math.random()) * rAtY;
  
  const x = r * Math.cos(theta);
  const z = r * Math.sin(theta);
  
  // Adjust y to center the tree vertically (y calculated above is 0..height from base)
  return new THREE.Vector3(x, y - height / 2 + yOffset, z);
};