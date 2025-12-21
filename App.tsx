import React, { useState, Suspense, useMemo, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import { Experience } from './components/Experience';
import { GestureUI } from './components/GestureUI';
import { AppState, InteractionMode } from './types';
import { CAMERA_POSITION_DESKTOP, CAMERA_POSITION_MOBILE, CAMERA_FOV } from './constants';

const App: React.FC = () => {
  // State Management
  const [appState, setAppState] = useState<AppState>(AppState.TREE_SHAPE);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>(InteractionMode.IDLE);
  const [userPhotos, setUserPhotos] = useState<string[]>([]);
  const [userGiftMessages, setUserGiftMessages] = useState<string[]>([]);

  // Canvas container ref for screenshot
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Responsive Camera Position - memoized
  const cameraPosition = useMemo(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    return isMobile ? CAMERA_POSITION_MOBILE : CAMERA_POSITION_DESKTOP;
  }, []);

  // Cleanup old blob URLs when new photos are uploaded
  const handlePhotosUpload = useCallback((newPhotos: string[]) => {
    // Revoke old blob URLs to free memory
    userPhotos.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    setUserPhotos(newPhotos);
  }, [userPhotos]);

  // Screenshot function
  const takeScreenshot = useCallback(() => {
    if (!canvasContainerRef.current) return;
    
    const canvas = canvasContainerRef.current.querySelector('canvas');
    if (!canvas) return;

    try {
      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (!blob) return;
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `christmas-tree-${Date.now()}.png`;
        link.click();
        
        // Cleanup
        URL.revokeObjectURL(url);
      }, 'image/png', 1.0);
    } catch (error) {
      console.error('Screenshot failed:', error);
    }
  }, []);

  return (
    <div ref={canvasContainerRef} className="w-full h-screen bg-black relative select-none overflow-hidden">
      
      {/* 3D Scene */}
      <Canvas 
        shadows 
        camera={{ position: cameraPosition, fov: CAMERA_FOV }}
        dpr={[1, 3]} // Support up to 3x pixel ratio for high-DPI mobile displays
        gl={{ 
          antialias: true, // Enable antialiasing for sharper edges
          alpha: false,
          powerPreference: 'high-performance'
        }}
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
        onUserPhotosUpload={handlePhotosUpload}
        onUserGiftsUpdate={setUserGiftMessages}
        userGiftMessages={userGiftMessages}
        onScreenshot={takeScreenshot}
      />

    </div>
  );
};

export default App;