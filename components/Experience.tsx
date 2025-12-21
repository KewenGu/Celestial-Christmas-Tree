import React from 'react';
import { OrbitControls, Stars, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { Needles } from './Needles';
import { InteractiveItems } from './InteractiveItems';
import { Decorations } from './Decorations';
import { Snowflakes } from './Snowflakes';
import { AppState, InteractionMode } from '../types';
import { NEEDLES_COUNT, AUTO_ROTATE_SPEED } from '../constants';

interface ExperienceProps {
  appState: AppState;
  interactionMode: InteractionMode;
  userPhotos: string[];
  userGiftMessages: string[];
}

/**
 * Main 3D experience component that orchestrates the entire Christmas tree scene
 * Includes lighting, particle systems, decorations, and post-processing effects
 */
export const Experience: React.FC<ExperienceProps> = ({ appState, interactionMode, userPhotos, userGiftMessages }) => {
  return (
    <>
      <color attach="background" args={['#050505']} />
      
      {/* Camera Controls */}
      <OrbitControls 
        enablePan={false} 
        minDistance={8} 
        maxDistance={25}
        autoRotate={appState === AppState.TREE_SHAPE && interactionMode === InteractionMode.IDLE}
        autoRotateSpeed={AUTO_ROTATE_SPEED}
      />

      {/* Lighting - Luxury Gold Mood */}
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#ffaa00" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#0044ff" />
      <spotLight 
        position={[0, 15, 0]} 
        angle={0.3} 
        penumbra={1} 
        intensity={2} 
        color="#FFD700" 
        castShadow 
      />

      {/* Environment */}
      <Stars 
        radius={200} // Push stars further back for better depth
        depth={50} 
        count={5000} 
        factor={4} 
        saturation={0} 
        fade 
        speed={0.2} // Much slower twinkling for a natural feel
      />
      <Environment preset="city" />

      {/* Particle Systems */}
      <Needles count={NEEDLES_COUNT} appState={appState} />
      <Decorations appState={appState} />
      <InteractiveItems 
        appState={appState} 
        interactionMode={interactionMode} 
        userPhotos={userPhotos} 
        userGiftMessages={userGiftMessages} 
      />
      <Snowflakes />
      
      {/* Post Processing for Cinematic Feel */}
      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={0.9}
          mipmapBlur 
          intensity={1.2} 
          radius={0.5}
        />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </>
  );
};