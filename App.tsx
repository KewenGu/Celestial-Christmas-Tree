import React, { useState, Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import { Experience } from './components/Experience';
import { GestureUI } from './components/GestureUI';
import { AppState, InteractionMode } from './types';

const App: React.FC = () => {
  // State Management
  const [appState, setAppState] = useState<AppState>(AppState.TREE_SHAPE);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>(InteractionMode.IDLE);
  const [userPhotos, setUserPhotos] = useState<string[]>([]);
  const [userGiftMessages, setUserGiftMessages] = useState<string[]>([]);

  // Responsive Camera Position
  // On mobile (portrait), we need to step back further to see the whole tree height.
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const cameraPosition: [number, number, number] = isMobile ? [0, 0, 28] : [0, 0, 18];

  return (
    <div className="w-full h-screen bg-black relative select-none overflow-hidden">
      
      {/* 3D Scene */}
      <Canvas 
        shadows 
        camera={{ position: cameraPosition, fov: 45 }}
        dpr={[1, 2]} // Support high-res displays
        gl={{ antialias: false }} // Let post-processing handle AA logic if needed, usually bloom prefers false
      >
        <Suspense fallback={null}>
          <Experience 
            appState={appState} 
            interactionMode={interactionMode} 
            userPhotos={userPhotos}
            userGiftMessages={userGiftMessages}
          />
        </Suspense>
      </Canvas>

      {/* Loading Overlay */}
      <Loader 
        containerStyles={{ background: 'black' }} 
        innerStyles={{ width: '200px', height: '10px', background: '#333' }}
        barStyles={{ background: '#FFD700', height: '10px' }}
        dataInterpolation={(p) => `Loading Christmas Magic ${p.toFixed(0)}%`}
      />

      {/* UI Overlay / Gesture Simulation */}
      <GestureUI 
        appState={appState} 
        setAppState={setAppState}
        interactionMode={interactionMode}
        setInteractionMode={setInteractionMode}
        onUserPhotosUpload={setUserPhotos}
        onUserGiftsUpdate={setUserGiftMessages}
        userGiftMessages={userGiftMessages}
      />

    </div>
  );
};

export default App;