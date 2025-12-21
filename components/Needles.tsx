import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { AppState } from '../types';
import { getConePosition, getSpherePosition } from '../utils/coordinates';

interface NeedlesProps {
  count: number;
  appState: AppState;
}

// Reuse objects to avoid garbage collection
const dummy = new THREE.Object3D();
const tempPos = new THREE.Vector3();
const targetPos = new THREE.Vector3();
const driftOffset = new THREE.Vector3();

// Palette constants moved outside component to avoid recreation
const GREEN_PALETTE = ['#004225', '#0f5132', '#146c43', '#198754', '#2E8B57'];
const GOLD_PALETTE = ['#FFD700', '#D4AF37', '#DAA520', '#B8860B'];
const GOLD_CHANCE = 0.15;

export const Needles: React.FC<NeedlesProps> = ({ count, appState }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // 1. Static Attributes - Memoized with stable dependencies
  const staticData = useMemo(() => {
    const data = [];
    
    for (let i = 0; i < count; i++) {
      // Increased to 15% Chance of gold leaves for better visibility
      const isGold = Math.random() < GOLD_CHANCE;
      const palette = isGold ? GOLD_PALETTE : GREEN_PALETTE;
      const color = palette[Math.floor(Math.random() * palette.length)];

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
    const isTreeMode = appState === AppState.TREE_SHAPE;
    
    // Pre-calculate common values
    const scatterDriftMult = 0.5;
    const treeDriftMult = 0.05;

    for (let i = 0; i < count; i++) {
      const s = staticData[i];
      const t = targets[i];
      
      // Read current position
      meshRef.current.getMatrixAt(i, dummy.matrix);
      dummy.position.setFromMatrixPosition(dummy.matrix);
      
      // Determine base target
      const baseTarget = isTreeMode ? t.treePosition : t.scatterPosition;
      targetPos.copy(baseTarget);

      // --- ORGANIC MOVEMENT LOGIC ---
      // Calculate drift offset once
      const timePhase = time + s.phase;
      
      if (isTreeMode) {
        // Gentle shivering/twinkling on the tree
        driftOffset.set(
          Math.sin(time * 2 + s.phase) * treeDriftMult,
          Math.cos(time * 1.5 + s.phase) * treeDriftMult,
          Math.sin(time + s.phase) * treeDriftMult
        );
      } else {
        // Large, lazy floating in space
        driftOffset.set(
          Math.sin(time * 0.5 + s.phase) * scatterDriftMult,
          Math.cos(time * 0.3 + s.phase) * scatterDriftMult,
          Math.sin(time * 0.4 + s.phase * 0.5) * scatterDriftMult
        );
      }
      
      targetPos.add(driftOffset);

      // 2. Interpolate with VARIABLE speed
      const moveSpeed = isTreeMode ? s.speed * 4.0 : s.speed;
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