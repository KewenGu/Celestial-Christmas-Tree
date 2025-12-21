import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { AppState } from '../types';
import { getConePosition, getSpherePosition } from '../utils/coordinates';

interface NeedlesProps {
  count: number;
  appState: AppState;
}

const dummy = new THREE.Object3D();
const tempPos = new THREE.Vector3();
const targetPos = new THREE.Vector3();

export const Needles: React.FC<NeedlesProps> = ({ count, appState }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // 1. Static Attributes
  // Added 'speed' for varied velocity (no more uniform movement)
  // Added 'phase' for asynchronous hovering
  // Added Gold palette for luxurious accents
  const staticData = useMemo(() => {
    const data = [];
    const greenPalette = ['#004225', '#0f5132', '#146c43', '#198754', '#2E8B57']; 
    const goldPalette = ['#FFD700', '#D4AF37', '#DAA520', '#B8860B']; // Gold, Metallic Gold, Goldenrod, Dark Goldenrod
    
    for (let i = 0; i < count; i++) {
      // Increased to 15% Chance of gold leaves for better visibility
      const isGold = Math.random() < 0.15;
      const color = isGold 
        ? goldPalette[Math.floor(Math.random() * goldPalette.length)]
        : greenPalette[Math.floor(Math.random() * greenPalette.length)];

      data.push({
        rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0),
        scale: Math.random() * 0.5 + 0.2,
        color: color,
        speed: 0.5 + Math.random() * 1.5, // Random speed factor between 0.5 and 2.0
        phase: Math.random() * Math.PI * 2, // Random starting phase for sine waves
      });
    }
    return data;
  }, [count]);

  // 2. Position Targets
  const targets = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      data.push({
        treePosition: getConePosition(12, 4.5, -1),
        scatterPosition: getSpherePosition(15),
      });
    }
    return data;
  }, [count, appState]);

  // Initial Setup
  useEffect(() => {
    if (meshRef.current) {
      staticData.forEach((d, i) => {
        meshRef.current!.setColorAt(i, new THREE.Color(d.color));
        
        const initialPos = appState === AppState.TREE_SHAPE ? targets[i].treePosition : targets[i].scatterPosition;
        
        dummy.position.copy(initialPos);
        dummy.rotation.copy(d.rotation);
        dummy.scale.setScalar(d.scale);
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
      meshRef.current.instanceColor!.needsUpdate = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]); 

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const time = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const s = staticData[i];
      const t = targets[i];
      
      // Read current position
      meshRef.current.getMatrixAt(i, dummy.matrix);
      dummy.position.setFromMatrixPosition(dummy.matrix);
      
      // Determine base target
      const baseTarget = appState === AppState.TREE_SHAPE ? t.treePosition : t.scatterPosition;
      targetPos.copy(baseTarget);

      // --- ORGANIC MOVEMENT LOGIC ---
      
      // 1. Add subtle drift/breathing to the TARGET itself before we lerp to it.
      // This ensures that even when they reach the destination, they aren't frozen.
      // We use the particle's unique 'phase' so they don't bob up and down in unison.
      if (appState === AppState.SCATTERED) {
        // Large, lazy floating in space
        targetPos.x += Math.sin(time * 0.5 + s.phase) * 0.5;
        targetPos.y += Math.cos(time * 0.3 + s.phase) * 0.5;
        targetPos.z += Math.sin(time * 0.4 + s.phase * 0.5) * 0.5;
      } else {
        // Gentle shivering/twinkling on the tree
        targetPos.x += Math.sin(time * 2 + s.phase) * 0.05;
        targetPos.y += Math.cos(time * 1.5 + s.phase) * 0.05;
        targetPos.z += Math.sin(time * 1 + s.phase) * 0.05;
      }

      // 2. Interpolate with VARIABLE speed
      // We check if we are forming the tree, and if so, we boost speed.
      let moveSpeed = s.speed;
      if (appState === AppState.TREE_SHAPE) {
        moveSpeed *= 4.0; // Significant boost to ensure needles arrive before decorations
      }

      const lerpFactor = THREE.MathUtils.clamp(moveSpeed * delta, 0, 1);
      tempPos.lerpVectors(dummy.position, targetPos, lerpFactor);
      
      dummy.position.copy(tempPos);
      dummy.rotation.copy(s.rotation);
      dummy.scale.setScalar(s.scale);
      
      // Continuous rotation (tumbling)
      dummy.rotation.x += delta * 0.1 * s.speed;
      dummy.rotation.y += delta * 0.15 * s.speed;

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <tetrahedronGeometry args={[0.2, 0]} />
      <meshStandardMaterial 
        roughness={0.4} 
        metalness={0.6}
        emissive="#050505" // Neutral dark emissive (was green #001100) to support gold leaves
        emissiveIntensity={0.2}
      />
    </instancedMesh>
  );
};