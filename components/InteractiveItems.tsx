import React, { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { AppState, InteractionMode, InteractiveItemData } from '../types';
import { getConePosition, getSpherePosition } from '../utils/coordinates';

interface InteractiveItemsProps {
  appState: AppState;
  interactionMode: InteractionMode;
  userPhotos: string[];
  userGiftMessages: string[];
}

// Constants
const GIFTS_COUNT = 30;
const FRAMES_COUNT = 15;
const MAX_HISTORY_SIZE_RATIO = 0.5;
const TARGETED_DISTANCE = 2.5;
const TARGETED_SCALE_GIFT = 0.40; // Slightly larger than before (was 0.35)
const TARGETED_SCALE_FRAME = 0.45;

// Default gift messages
const DEFAULT_GIFT_MESSAGES = [
  "New iPhone 16", "World Peace", "A Pair of Socks", "NVIDIA RTX 5090",
  "A Warm Hug", "$1000 Amazon Card", "Coal :(", "Trip to Mars",
  "React Tutorials", "Infinite Coffee"
];

// Premium Festive Gift Palette (Rich Reds, Greens, Golds, Creams)
const GIFT_PALETTE = [
  { base: '#800020', stripe: '#D4AF37', ribbon: '#FFD700' }, // Burgundy & Gold stripes & Bright Gold ribbon
  { base: '#004225', stripe: '#E5E4E2', ribbon: '#C41E3A' }, // British Racing Green & Platinum stripes & Red ribbon
  { base: '#F8F8FF', stripe: '#C41E3A', ribbon: '#228B22' }, // Ghost White & Red stripes & Forest Green ribbon
  { base: '#B8860B', stripe: '#191970', ribbon: '#E5E4E2' }, // Dark Goldenrod & Navy stripes & Silver ribbon
  { base: '#660000', stripe: '#FFD700', ribbon: '#FFFAF0' }, // Blood Red & Gold stripes & Cream ribbon
  { base: '#FFFAF0', stripe: '#228B22', ribbon: '#C41E3A' }, // Floral White & Green stripes & Red ribbon
  { base: '#4B0082', stripe: '#F0E68C', ribbon: '#FFD700' }, // Indigo & Khaki stripes & Gold ribbon
];

// Premium Festive Frame Palette
const FRAME_PALETTE = [
  { color: '#FFD700' }, // Classic Gold
  { color: '#D4AF37' }, // Metallic Gold
  { color: '#C0C0C0' }, // Silver
  { color: '#CD7F32' }, // Bronze
  { color: '#B76E79' }, // Rose Gold
  { color: '#8B4513' }, // Saddle Brown (Wood-like)
];

// Curated Festive Images (Reliable URLs from Unsplash)
const FESTIVE_IMAGES = [
  "https://images.unsplash.com/photo-1512474932049-78ea796b6c42?auto=format&fit=crop&w=600&q=80", // Clear Snow Scene
  "https://images.unsplash.com/photo-1576692131267-cf522760a218?auto=format&fit=crop&w=600&q=80", // Ornaments
  "https://images.unsplash.com/photo-1543094209-4c126601b1e9?auto=format&fit=crop&w=600&q=80", // Elk in snow
  "https://images.unsplash.com/photo-1513297887119-d46091b24bfa?auto=format&fit=crop&w=600&q=80", // Classic Balls
  "https://images.unsplash.com/photo-1543589077-47d81606c1bf?auto=format&fit=crop&w=600&q=80", // Red Decoration
  "https://images.unsplash.com/photo-1482638202333-c77d501dd2ec?auto=format&fit=crop&w=600&q=80", // Winter Forest
  "https://images.unsplash.com/photo-1575373803274-a622a8459286?auto=format&fit=crop&w=600&q=80", // Bokeh Lights
  "https://images.unsplash.com/photo-1511108690759-009324a90311?auto=format&fit=crop&w=600&q=80", // Tea/Cozy
  "https://images.unsplash.com/photo-1544979590-2799616a614d?auto=format&fit=crop&w=600&q=80", // Indoor Tree
  "https://images.unsplash.com/photo-1606819717115-9159c900370b?auto=format&fit=crop&w=600&q=80", // Gift Box
];

// Subset of data that doesn't change (Identity)
interface StaticItemData {
  id: string;
  type: 'gift' | 'frame';
  imageUrl?: string;
  giftContent?: string;
  scale: number;
  color: string;       // Base color
  stripeColor?: string; // Color for stripes
  ribbonColor?: string; // Color for ribbons (different from stripes)
  hasStripes: boolean;  // Whether to show stripes or keep it solid
  phase: number; 
}

// Reusable Fallback Component (Visual Placeholder)
const FallbackContent: React.FC<{ label?: string, color?: string }> = ({ label = "🎄", color }) => (
  <group>
    <mesh>
      <planeGeometry args={[0.9, 1.3]} />
      {/* Beautiful gradient-like fallback */}
      <meshStandardMaterial 
        color={color || "#1a472a"} 
        roughness={0.6}
        metalness={0.3}
        emissive={color || "#0d2515"}
        emissiveIntensity={0.5}
      />
    </mesh>
    <Text 
      position={[0, 0, 0.05]} 
      fontSize={0.15}
      color="#FFFFFF"
      maxWidth={0.7} 
      textAlign="center"
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.01}
      outlineColor="#000000"
      fillOpacity={1}
      material-toneMapped={false}
    >
      {label}
    </Text>
  </group>
);

// --- ROBUST IMAGE LOADER COMPONENT ---
// Instead of relying on Suspense/useTexture which can be flaky with Blob URLs and list updates,
// we manually manage the texture loading state. This ensures we always know if we are loading, 
// have loaded successfully, or failed.
const AsyncFrameImage: React.FC<{ url: string }> = ({ url }) => {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    let isMounted = true;
    let loadedTexture: THREE.Texture | null = null;
    
    setStatus('loading');
    
    const loader = new THREE.TextureLoader();
    // Set crossOrigin for external images
    loader.setCrossOrigin('anonymous');
    
    // Only add cache buster for blob URLs (user uploads), not for external URLs
    const safeUrl = url.startsWith('blob:') 
      ? url 
      : url; // Use URL as-is for external images to avoid CORS issues

    // Load the texture
    loader.load(
      safeUrl,
      (loadedTex) => {
        if (isMounted) {
          loadedTex.colorSpace = THREE.SRGBColorSpace;
          // Fix orientation for some uploaded images
          loadedTex.flipY = true; 
          loadedTexture = loadedTex;
          setTexture(loadedTex);
          setStatus('success');
        } else {
          loadedTex.dispose(); // Cleanup if unmounted
        }
      },
      undefined, // onProgress
      (err) => {
        console.warn("Failed to load texture:", url, err);
        if (isMounted) setStatus('error');
      }
    );

    return () => {
      isMounted = false;
      // Clean up texture on unmount to prevent memory leaks
      if (loadedTexture) {
        loadedTexture.dispose();
      }
    };
  }, [url]);

  if (status === 'error') {
    return <FallbackContent label="Tap PICK A PHOTO to add your photo" color="#1a472a" />;
  }

  if (status === 'loading' || !texture) {
    return <FallbackContent label="Loading..." color="#2d5a3d" />;
  }

  return (
    <mesh position={[0, 0, 0]}>
      <planeGeometry args={[0.9, 1.3]} />
      {/* Use Standard Material for proper lighting integration and avoid bloom issues */}
      <meshStandardMaterial 
        map={texture} 
        toneMapped={true}
        emissive="#000000"
        emissiveIntensity={0}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

const Item: React.FC<{ 
  data: InteractiveItemData & { phase: number, stripeColor?: string, ribbonColor?: string, hasStripes?: boolean }; 
  appState: AppState;
  isTargeted: boolean;
}> = ({ data, appState, isTargeted }) => {
  const meshRef = useRef<THREE.Group>(null);
  const lidRef = useRef<THREE.Group>(null);
  const paperRef = useRef<THREE.Group>(null);
  
  // We initialize position ONLY on mount, then lerp to targets.
  const currentPos = useRef(data.scatterPosition.clone());
  const currentRot = useRef(new THREE.Quaternion().setFromEuler(data.rotation));
  
  const logic = useMemo(() => ({
    targetRot: new THREE.Quaternion(),
    dummyObj: new THREE.Object3D()
  }), []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // --- 1. Position Interpolation ---
    let desiredPos = appState === AppState.TREE_SHAPE ? data.treePosition.clone() : data.scatterPosition.clone();
    const time = state.clock.elapsedTime;

    if (isTargeted) {
      // Calculate position relative to camera (HUD style)
      // Keep it close to avoid most particle occlusion
      const camera = state.camera;
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      const up = new THREE.Vector3(0, -1, 0).applyQuaternion(camera.quaternion);
      
      desiredPos = camera.position.clone()
        .add(forward.multiplyScalar(TARGETED_DISTANCE))
        .add(up.multiplyScalar(data.type === 'gift' ? 0.3 : 0.05)); // Frame moved up (0.2 -> 0.05)
    } else {
      // Add "Breathing" motion when not targeted so they don't look frozen
      desiredPos.y += Math.sin(time * 1.5 + data.phase) * 0.2;
    }

    // Smoother speed settings (Lower = Heavier/Smoother)
    const speed = isTargeted ? 3.5 : 1.5; 
    currentPos.current.lerp(desiredPos, delta * speed);
    meshRef.current.position.copy(currentPos.current);

    // --- 2. Rotation Interpolation ---
    if (isTargeted) {
      // Look at camera
      logic.dummyObj.position.copy(currentPos.current);
      logic.dummyObj.lookAt(state.camera.position);
      logic.targetRot.copy(logic.dummyObj.quaternion);
      currentRot.current.slerp(logic.targetRot, delta * 3); // Slower rotation
    } else {
      logic.targetRot.setFromEuler(data.rotation);
      
      // Gentle sway
      if (appState === AppState.SCATTERED) {
         const spin = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), time * 0.2);
         logic.targetRot.multiply(spin);
      } else {
         // Subtle sway in tree mode
         const sway = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.sin(time + data.phase) * 0.05);
         logic.targetRot.multiply(sway);
      }
      
      currentRot.current.slerp(logic.targetRot, delta * 2);
    }
    
    meshRef.current.setRotationFromQuaternion(currentRot.current);

    // --- 3. Animation for Gifts ---
    if (data.type === 'gift') {
      if (lidRef.current) {
        // Open the lid backwards (-X rotation)
        const targetLidRot = isTargeted ? -Math.PI / 1.8 : 0; 
        lidRef.current.rotation.x = THREE.MathUtils.lerp(lidRef.current.rotation.x, targetLidRot, delta * 3);
      }
      if (paperRef.current) {
        const targetPaperScale = isTargeted ? 1 : 0;
        const targetPaperY = isTargeted ? 1.2 : 0.5;
        paperRef.current.scale.setScalar(THREE.MathUtils.lerp(paperRef.current.scale.x, targetPaperScale, delta * 4));
        paperRef.current.position.y = THREE.MathUtils.lerp(paperRef.current.position.y, targetPaperY, delta * 4);
      }
    }
  });

  // --- RENDERERS ---

  if (data.type === 'gift') {
    return (
      <group ref={meshRef} scale={isTargeted ? TARGETED_SCALE_GIFT : data.scale}>
        
        {/* Box Body */}
        <group>
            {/* Main Base Color - Improved Material for "Premium" look */}
            <mesh castShadow receiveShadow position={[0, 0, 0]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial 
                color={data.color} 
                metalness={0.3} 
                roughness={0.4} 
              />
            </mesh>

            {/* Stripes - Only render if hasStripes is true */}
            {data.hasStripes && data.stripeColor && (
              <>
                 {/* Uniform 1:1 Stripes */}
                 {[-0.4, -0.2, 0, 0.2, 0.4].map((yPos, i) => (
                    <mesh key={i} position={[0, yPos, 0]} castShadow>
                       <boxGeometry args={[1.005, 0.1, 1.005]} />
                       <meshStandardMaterial 
                          color={data.stripeColor} 
                          metalness={0.7} 
                          roughness={0.2} 
                       />
                    </mesh>
                 ))}
              </>
            )}
        </group>
        
        {/* Paper Inside */}
        <group ref={paperRef} position={[0, 0.5, 0]} scale={[0, 0, 0]}>
           <mesh castShadow>
             <planeGeometry args={[0.8, 0.6]} />
             <meshStandardMaterial color="#F5F5DC" roughness={0.9} metalness={0} />
           </mesh>
           <Text 
             position={[0, 0, 0.01]} 
             fontSize={0.1} 
             color="black" 
             maxWidth={0.7} 
             textAlign="center"
             font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
           >
             {data.giftContent || "Happy Holidays!"}
           </Text>
        </group>

        {/* Lid Group */}
        <group ref={lidRef} position={[0, 0.5, -0.5]}>
           <group position={[0, 0, 0.5]}> 
              {/* Lid Top */}
              <mesh castShadow receiveShadow position={[0, 0.05, 0]}>
                <boxGeometry args={[1.05, 0.1, 1.05]} />
                <meshStandardMaterial 
                  color={data.color} 
                  metalness={0.3} 
                  roughness={0.4} 
                />
              </mesh>
              
              {/* Lid Ribbon (Cross) */}
              <mesh position={[0, 0.06, 0]}>
                  <boxGeometry args={[1.06, 0.11, 0.15]} />
                  <meshStandardMaterial color={data.ribbonColor || "#FFF"} metalness={0.7} roughness={0.2} />
              </mesh>
              <mesh position={[0, 0.06, 0]} rotation={[0, Math.PI / 2, 0]}>
                  <boxGeometry args={[1.06, 0.11, 0.15]} />
                  <meshStandardMaterial color={data.ribbonColor || "#FFF"} metalness={0.7} roughness={0.2} />
              </mesh>
           </group>
        </group>
        
        {/* Body Vertical Ribbons */}
        <mesh position={[0, 0, 0]}>
            <boxGeometry args={[1.02, 1, 0.1]} />
            <meshStandardMaterial color={data.ribbonColor || "#FFF"} metalness={0.7} roughness={0.2} />
        </mesh>
         <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[1.02, 1, 0.1]} />
            <meshStandardMaterial color={data.ribbonColor || "#FFF"} metalness={0.7} roughness={0.2} />
        </mesh>
      </group>
    );
  }

  // --- FRAME RENDERER (Updated High Fidelity) ---
  const frameW = 1.3;
  const frameH = 1.7;
  const thickness = 0.15;
  const border = 0.1; 
  
  // Reusable Material for the frame structure
  const frameMaterial = (
    <meshStandardMaterial 
      color={data.color} 
      metalness={data.color === '#1C1C1C' ? 0.3 : 0.9} 
      roughness={data.color === '#1C1C1C' ? 0.7 : 0.15}
    />
  );

  return (
    <group ref={meshRef} scale={isTargeted ? TARGETED_SCALE_FRAME : data.scale}>
      
      {/* 1. Main Frame Structure (4 Bars for realistic depth) */}
      <group>
          {/* Top Bar */}
          <mesh position={[0, frameH/2 - border/2, 0]} castShadow receiveShadow>
            <boxGeometry args={[frameW, border, thickness]} />
            {frameMaterial}
          </mesh>
          {/* Bottom Bar */}
          <mesh position={[0, -frameH/2 + border/2, 0]} castShadow receiveShadow>
            <boxGeometry args={[frameW, border, thickness]} />
            {frameMaterial}
          </mesh>
          {/* Left Bar */}
          <mesh position={[-frameW/2 + border/2, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[border, frameH - border*2, thickness]} />
            {frameMaterial}
          </mesh>
          {/* Right Bar */}
          <mesh position={[frameW/2 - border/2, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[border, frameH - border*2, thickness]} />
            {frameMaterial}
          </mesh>
          
          {/* Backing Board (Dark felt/wood back) */}
          <mesh position={[0, 0, -thickness/2 + 0.01]}>
            <planeGeometry args={[frameW - 0.01, frameH - 0.01]} />
            <meshStandardMaterial color="#0A0A0A" roughness={0.9} />
          </mesh>
      </group>

      {/* 2. Mat Board (Passe-Partout) - The white card inner border */}
      <group position={[0, 0, 0.01]}>
          <mesh>
            <planeGeometry args={[frameW - border*2, frameH - border*2]} />
            <meshStandardMaterial color="#FDF5E6" roughness={0.9} /> {/* Creamy Off-White */}
          </mesh>
      </group>
      
      {/* 3. The Image */}
      {/* Centered on the Mat. Increased Z to 0.03 to definitely avoid Z-fighting with Mat (0.01) */}
      <group position={[0, 0, 0.03]}>
        {/* 
           Using manual AsyncFrameImage to avoid Suspense issues with Blob URLs.
           Key ensures clean unmount/mount on URL change.
        */}
        <AsyncFrameImage key={data.imageUrl} url={data.imageUrl!} />
      </group>
      
      {/* 4. Glass Cover */}
      {/* Sits almost flush with the frame front */}
      <mesh position={[0, 0, thickness/2 - 0.02]}>
        <planeGeometry args={[frameW - border, frameH - border]} />
        <meshPhysicalMaterial 
          transmission={0.98} 
          opacity={1} 
          transparent 
          roughness={0} 
          ior={1.5} 
          thickness={0.05}
          clearcoat={1}
          specularIntensity={1}
        />
      </mesh>
    </group>
  );
};

export const InteractiveItems: React.FC<InteractiveItemsProps> = ({ appState, interactionMode, userPhotos, userGiftMessages }) => {
  
  // 1. Static Identity Data
  const staticItems = useMemo<StaticItemData[]>(() => {
    const list: StaticItemData[] = [];
    
    // Determine which message list to use
    const activeMessages = (userGiftMessages && userGiftMessages.length > 0) 
      ? userGiftMessages 
      : DEFAULT_GIFT_MESSAGES;

    // 30 Gifts
    for (let i = 0; i < GIFTS_COUNT; i++) {
      const theme = GIFT_PALETTE[i % GIFT_PALETTE.length];
      list.push({
        id: `gift-${i}`,
        type: 'gift',
        scale: 0.3, 
        color: theme.base,
        stripeColor: theme.stripe,
        ribbonColor: theme.ribbon,
        giftContent: activeMessages[i % activeMessages.length],
        phase: Math.random() * Math.PI * 2,
        hasStripes: Math.random() > 0.5 // 50/50 balance between striped and solid
      });
    }

    // 15 Frames
    for (let i = 0; i < FRAMES_COUNT; i++) {
      const theme = FRAME_PALETTE[i % FRAME_PALETTE.length];
      
      let imgUrl;
      
      // LOGIC: If userPhotos exist, cycle through them. 
      if (userPhotos && userPhotos.length > 0) {
        imgUrl = userPhotos[i % userPhotos.length];
      } else {
        imgUrl = FESTIVE_IMAGES[i % FESTIVE_IMAGES.length];
      }

      list.push({
        id: `frame-${i}`,
        type: 'frame',
        scale: 0.4, 
        color: theme.color,
        imageUrl: imgUrl,
        phase: Math.random() * Math.PI * 2,
        hasStripes: false
      });
    }
    return list;
  }, [userPhotos, userGiftMessages]);

  // 2. Dynamic Position Data
  const dynamicItems = useMemo<InteractiveItemData[]>(() => {
    return staticItems.map((item) => {
      // 1. Calculate Base Positions
      const treePos = item.type === 'gift' 
        ? getConePosition(10, 4, -1, true)
        : getConePosition(8, 3.5, 0, true);
        
      const scatterPos = getSpherePosition(12);

      // 2. Calculate Oriented Rotation for Tree Mode
      let orientedRotation = new THREE.Euler(0, Math.random() * Math.PI * 2, 0);

      if (item.type === 'frame') {
         // Force Frames to face OUTWARDS from the center (0,0,0) so image is visible.
         // Create a dummy object at the tree position
         const dummy = new THREE.Object3D();
         dummy.position.copy(treePos);
         // Make it look at the center vertical axis at its own height
         dummy.lookAt(0, treePos.y, 0); 
         // Rotate 180 deg (PI) so the "Front" (+Z) faces AWAY from center
         dummy.rotateY(Math.PI);
         orientedRotation = dummy.rotation.clone();
      }

      return {
        ...item,
        treePosition: treePos,
        scatterPosition: scatterPos,
        rotation: orientedRotation 
      };
    });
  }, [appState, staticItems]);

  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  
  // HISTORY TRACKING:
  // We keep a history of recently selected IDs to ensure we don't pick the same ones continuously.
  const historyRef = useRef<string[]>([]);

  useEffect(() => {
    const pickRandomWithHistory = (candidates: InteractiveItemData[]) => {
      if (candidates.length === 0) return null;

      // 1. Filter out recently used IDs
      const available = candidates.filter(c => !historyRef.current.includes(c.id));
      
      // 2. Fallback: If we exhausted the available pool (e.g. history is full or list is small),
      // relax the restriction and use the full list to prevent getting stuck.
      const pool = available.length === 0 ? candidates : available;
      
      // 3. Pick Random
      const selected = pool[Math.floor(Math.random() * pool.length)];
      
      // 4. Update History
      // We keep track of the last N items, where N is roughly half the total items.
      // This ensures we cycle through at least 50% of content before repeating.
      historyRef.current.push(selected.id);
      const maxHistory = Math.max(1, Math.floor(candidates.length * MAX_HISTORY_SIZE_RATIO));
      if (historyRef.current.length > maxHistory) {
        historyRef.current.shift();
      }
      
      return selected.id;
    };

    if (interactionMode === InteractionMode.PULLING_GIFT) {
      const gifts = dynamicItems.filter(i => i.type === 'gift');
      if (!activeItemId || dynamicItems.find(i => i.id === activeItemId)?.type !== 'gift') {
         const newId = pickRandomWithHistory(gifts);
         if (newId) setActiveItemId(newId);
      }
    } else if (interactionMode === InteractionMode.PULLING_FRAME) {
      const frames = dynamicItems.filter(i => i.type === 'frame');
      if (!activeItemId || dynamicItems.find(i => i.id === activeItemId)?.type !== 'frame') {
         const newId = pickRandomWithHistory(frames);
         if (newId) setActiveItemId(newId);
      }
    } else {
      setActiveItemId(null);
    }
  }, [interactionMode, dynamicItems, activeItemId]);

  return (
    <group>
      {dynamicItems.map((item, idx) => (
        <Item 
          key={item.id} 
          data={item as InteractiveItemData & { phase: number, stripeColor?: string, hasStripes?: boolean }} 
          appState={appState} 
          isTargeted={item.id === activeItemId} 
        />
      ))}
    </group>
  );
};