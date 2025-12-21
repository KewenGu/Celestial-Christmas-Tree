import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { AppState } from '../types';
import { getSpherePosition } from '../utils/coordinates';

interface DecorationsProps {
  appState: AppState;
}

const dummy = new THREE.Object3D();
const tempPos = new THREE.Vector3();

// --- STAR TOPPER COMPONENT ---
const StarTopper: React.FC<{ appState: AppState }> = ({ appState }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  
  // Create the 5-pointed star shape
  const { shape, extrudeSettings } = useMemo(() => {
    const shape = new THREE.Shape();
    const points = 5;
    const outerRadius = 0.9;
    const innerRadius = 0.45;

    for (let i = 0; i < points * 2; i++) {
      // Calculate angle: Start from top (PI/2)
      const angle = (i * Math.PI) / points + Math.PI / 2;
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();

    const extrudeSettings = {
      depth: 0.25, // Slightly thicker for better 3D look
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.05,
      bevelSegments: 5 // Smoother bevels
    };

    return { shape, extrudeSettings };
  }, []);
  
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    
    // 1. Position Logic
    const treePos = new THREE.Vector3(0, 5.5, 0); 
    const scatterPos = new THREE.Vector3(0, 10, 0); 
    const target = appState === AppState.TREE_SHAPE ? treePos : scatterPos;
    meshRef.current.position.lerp(target, delta * 2);
    
    // 2. Rotation Logic (Refined)
    // Removed fast spin. Now it's a slow, majestic float.
    meshRef.current.rotation.y = time * 0.15; // Very slow rotation
    // Add subtle organic tilt (floating in anti-gravity)
    meshRef.current.rotation.z = Math.sin(time * 0.5) * 0.05; 
    meshRef.current.rotation.x = Math.cos(time * 0.3) * 0.05; 
    
    // 3. Scale/Light Logic (Refined)
    // Removed geometry scaling. Instead, we pulse the LIGHT intensity.
    // This looks like a glowing energy source rather than a balloon.
    const pulse = Math.sin(time * 1.5); // -1 to 1
    const intensity = 2 + pulse * 0.5; // Range 1.5 to 2.5
    
    // Update material emission
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    if (mat) {
      mat.emissiveIntensity = intensity;
    }

    // Update physical light source
    if (lightRef.current) {
      lightRef.current.intensity = intensity * 1.5;
      lightRef.current.distance = 10 + pulse * 2; // Subtle breathing of light radius
    }

    // Stabilize scale (no wobbly size)
    meshRef.current.scale.setScalar(1.0); 
  });

  return (
    <mesh ref={meshRef}>
      <extrudeGeometry args={[shape, extrudeSettings]} />
      {/* 
        High quality material settings for a "Star" 
        High metalness for reflections, low roughness for shine.
      */}
      <meshStandardMaterial 
        color="#FFD700" 
        emissive="#FFD700" 
        emissiveIntensity={2} 
        toneMapped={false}
        roughness={0.1}
        metalness={0.9}
      />
      {/* Light moves with the star */}
      <pointLight 
        ref={lightRef} 
        intensity={3} 
        color="#FFD700" 
        distance={10} 
        decay={2} 
      />
    </mesh>
  );
};

// --- BAUBLES (ORNAMENTS) COMPONENT ---
const Baubles: React.FC<{ appState: AppState }> = ({ appState }) => {
  const count = 150; // Decreased count to 150 as requested
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // 1. Static Props (Color, Scale, Phase) - Computed ONCE
  const staticData = useMemo(() => {
    const data = [];
    // Enriched palette with Purple, Emerald, Pink, Bronze
    const colors = [
      '#D42426', // Classic Red
      '#FFD700', // Gold
      '#C0C0C0', // Silver
      '#1E90FF', // Bright Blue
      '#9B59B6', // Purple
      '#2ECC71', // Emerald Green
      '#E91E63', // Pink
      '#F39C12'  // Bronze/Orange
    ];

    for (let i = 0; i < count; i++) {
      data.push({
        scale: Math.random() * 0.1 + 0.1, // Small scale 0.1-0.2
        color: colors[Math.floor(Math.random() * colors.length)],
        phase: Math.random() * Math.PI * 2,
      });
    }
    return data;
  }, []);

  // 2. Targets - Computed whenever appState changes to reshuffle positions
  const targets = useMemo(() => {
    const data = [];
    
    // Tree Parameters
    const h = 12;
    const baseRadius = 4.5;

    for (let i = 0; i < count; i++) {
      // RANDOMIZATION LOGIC:
      // Regenerate fresh positions every time state changes.
      
      const u = Math.random();
      const y = h * (1 - Math.sqrt(u)); // Uniform vertical density

      // Perfect surface radius
      const rSurface = (1 - y / h) * baseRadius;

      // Random Depth (Volumetric)
      // FIX: Constrain to 85%-100% of radius (Stay INSIDE or ON surface).
      const rRandom = rSurface * (0.85 + Math.random() * 0.15);

      const theta = Math.random() * Math.PI * 2;
      
      // Calculate base position
      let x = rRandom * Math.cos(theta);
      let z = rRandom * Math.sin(theta);
      
      // FIX: Align Y-offset with Needles (-1.0) instead of -0.5.
      let yPos = y - h / 2 - 1.0;

      // Local Jitter
      const jitter = 0.15;
      x += (Math.random() - 0.5) * jitter;
      yPos += (Math.random() - 0.5) * jitter;
      z += (Math.random() - 0.5) * jitter;
      
      const treePos = new THREE.Vector3(x, yPos, z);

      data.push({
        treePosition: treePos,
        scatterPosition: getSpherePosition(14),
      });
    }
    return data;
  }, [appState]); // Depend on appState to trigger regeneration

  useEffect(() => {
    if (meshRef.current) {
      staticData.forEach((d, i) => {
        meshRef.current!.setColorAt(i, new THREE.Color(d.color));
        
        // Initialize position based on the current (initial) targets
        // This runs only once on mount to prevent flying in from 0,0,0
        const t = targets[i];
        const initialPos = appState === AppState.TREE_SHAPE ? t.treePosition : t.scatterPosition;
        
        dummy.position.copy(initialPos);
        dummy.scale.setScalar(d.scale);
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
      meshRef.current.instanceColor!.needsUpdate = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staticData]); 

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const { treePosition, scatterPosition } = targets[i];
      const { phase, scale } = staticData[i];

      const target = appState === AppState.TREE_SHAPE ? treePosition : scatterPosition;
      
      // Read current
      meshRef.current.getMatrixAt(i, dummy.matrix);
      dummy.position.setFromMatrixPosition(dummy.matrix);

      // Add floaty movement
      const floatX = Math.sin(time + phase) * 0.05;
      const floatY = Math.cos(time * 0.8 + phase) * 0.05;

      tempPos.copy(target).add(new THREE.Vector3(floatX, floatY, 0));
      
      // Lerp
      dummy.position.lerp(tempPos, delta * 2);
      dummy.scale.setScalar(scale);
      
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshPhysicalMaterial 
        roughness={0.15} 
        metalness={0.9} 
        reflectivity={1}
        clearcoat={1}
      />
    </instancedMesh>
  );
};

// --- SPIRAL LIGHTS COMPONENT ---
const SpiralLights: React.FC<{ appState: AppState }> = ({ appState }) => {
  const count = 400;
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const { staticData, targets } = useMemo(() => {
    const sData = [];
    const tData = [];
    // Unified Warm White for an elegant, classic look
    const unifiedColor = new THREE.Color('#FFF8E7'); 

    // Spiral Parameters
    const height = 13;
    const baseRadius = 5.0;
    const turns = 8;
    
    // START ADJUSTMENT: Remove the bottom 1/3 of a turn
    // 1 full turn corresponds to 1/8th of the normalized path (since turns=8)
    // We want to skip 1/3 of that first turn.
    // Normalized offset = (1/3) * (1 / turns)
    const startOffset = (1/3) / turns;

    for (let i = 0; i < count; i++) {
      sData.push({
        phase: Math.random() * Math.PI * 2,
        blinkSpeed: Math.random() * 2 + 1,
        color: unifiedColor,
      });

      // Calculate Spiral Position
      // We map our iteration (0..count) to the range [startOffset, 1]
      // This ensures we start generating positions slightly 'up' the spiral path
      const pct = i / count; 
      const t = startOffset + pct * (1 - startOffset); // Interpolate from offset to 1
      
      const y = t * height - (height / 2) - 1; // Vertical position
      const angle = t * Math.PI * 2 * turns; // Angle
      const r = (1 - t) * baseRadius; // Radius shrinks as we go up

      const treePos = new THREE.Vector3(
        r * Math.cos(angle),
        y,
        r * Math.sin(angle)
      );

      tData.push({
        treePosition: treePos,
        scatterPosition: getSpherePosition(16),
      });
    }
    return { staticData: sData, targets: tData };
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const { treePosition, scatterPosition } = targets[i];
      const { phase, blinkSpeed, color } = staticData[i];

      const target = appState === AppState.TREE_SHAPE ? treePosition : scatterPosition;

      // Position logic
      meshRef.current.getMatrixAt(i, dummy.matrix);
      dummy.position.setFromMatrixPosition(dummy.matrix);
      
      // Add drift
      const drift = appState === AppState.SCATTERED ? Math.sin(time + phase) * 0.2 : 0;
      tempPos.copy(target).addScalar(drift);

      dummy.position.lerp(tempPos, delta * 3);
      dummy.scale.setScalar(0.08); // Small bulbs
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Blink Logic
      const blink = Math.sin(time * blinkSpeed + phase);
      const intensity = blink > 0 ? 1.5 : 0.5; // Flicker
      
      meshRef.current.setColorAt(i, color.clone().multiplyScalar(intensity));
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial 
        emissive="white" // Base emissive, color applied via instanceColor
        emissiveIntensity={1}
        toneMapped={false}
      />
    </instancedMesh>
  );
};

export const Decorations: React.FC<DecorationsProps> = ({ appState }) => {
  return (
    <group>
      <StarTopper appState={appState} />
      <Baubles appState={appState} />
      <SpiralLights appState={appState} />
    </group>
  );
};