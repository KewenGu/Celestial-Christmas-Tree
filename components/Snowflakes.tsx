import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const SNOWFLAKE_COUNT = 2000;
const SPREAD_AREA = 30;
const HEIGHT_RANGE = 20;
const FALL_SPEED = 0.02;
const DRIFT_SPEED = 0.3;

/**
 * Snowflakes component - Creates falling snow particles effect
 * Uses THREE.Points for optimal performance with thousands of particles
 */
export const Snowflakes: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Generate snowflake positions and properties
  const { positions, velocities, sizes } = useMemo(() => {
    const positions = new Float32Array(SNOWFLAKE_COUNT * 3);
    const velocities = new Float32Array(SNOWFLAKE_COUNT);
    const sizes = new Float32Array(SNOWFLAKE_COUNT);
    
    for (let i = 0; i < SNOWFLAKE_COUNT; i++) {
      const i3 = i * 3;
      
      // Random position in a cube around the tree
      positions[i3] = (Math.random() - 0.5) * SPREAD_AREA;     // x
      positions[i3 + 1] = Math.random() * HEIGHT_RANGE;         // y
      positions[i3 + 2] = (Math.random() - 0.5) * SPREAD_AREA; // z
      
      // Random fall speed variation
      velocities[i] = 0.5 + Math.random() * 0.5;
      
      // Random size variation
      sizes[i] = 0.05 + Math.random() * 0.1;
    }
    
    return { positions, velocities, sizes };
  }, []);

  // Animate snowflakes
  useFrame((state) => {
    if (!pointsRef.current) return;
    
    const positionAttribute = pointsRef.current.geometry.attributes.position;
    const time = state.clock.elapsedTime;
    
    for (let i = 0; i < SNOWFLAKE_COUNT; i++) {
      const i3 = i * 3;
      
      // Horizontal drift (sine wave for gentle swaying)
      positionAttribute.array[i3] += Math.sin(time * DRIFT_SPEED + i) * 0.001;
      positionAttribute.array[i3 + 2] += Math.cos(time * DRIFT_SPEED + i * 1.5) * 0.001;
      
      // Vertical fall
      positionAttribute.array[i3 + 1] -= FALL_SPEED * velocities[i];
      
      // Reset snowflake to top when it falls below ground
      if (positionAttribute.array[i3 + 1] < -2) {
        positionAttribute.array[i3 + 1] = HEIGHT_RANGE;
        positionAttribute.array[i3] = (Math.random() - 0.5) * SPREAD_AREA;
        positionAttribute.array[i3 + 2] = (Math.random() - 0.5) * SPREAD_AREA;
      }
    }
    
    positionAttribute.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={SNOWFLAKE_COUNT}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={SNOWFLAKE_COUNT}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#ffffff"
        transparent
        opacity={0.8}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

