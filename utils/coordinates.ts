import * as THREE from 'three';

/**
 * Generate a random number within a range
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns Random number between min and max
 */
export const randomRange = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

/**
 * Generate a random point inside a sphere using uniform distribution
 * Uses cube root for uniform volumetric distribution
 * @param radius - Radius of the sphere
 * @returns Random Vector3 position inside the sphere
 */
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

/**
 * Generate a random point on or inside a cone (Christmas tree shape)
 * Uses power distribution for more uniform visual appearance
 * @param height - Height of the cone
 * @param baseRadius - Radius at the base of the cone
 * @param yOffset - Vertical offset to apply to final position (default: 0)
 * @param surfaceOnly - If true, generates points only near the surface (default: false)
 * @returns Random Vector3 position on/in the cone
 */
export const getConePosition = (
  height: number, 
  baseRadius: number, 
  yOffset: number = 0,
  surfaceOnly: boolean = false
): THREE.Vector3 => {
  // Correctly sample height based on volume/area to ensure uniform density.
  // A cone is much wider at the bottom. If we pick Y linearly, the tip looks too dense.
  const u = Math.random();
  let y: number;

  if (surfaceOnly) {
    // Bias towards top (Power ~0.7) for surface distribution.
    // This ensures gifts/frames are well-distributed even near the narrow top.
    y = height * (1 - Math.pow(u, 0.7));
  } else {
    // Square root distribution for volumetric particles.
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