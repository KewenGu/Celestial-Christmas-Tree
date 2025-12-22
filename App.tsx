import React, { useState, Suspense, useMemo, useCallback, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import { Experience } from './components/Experience';
import { GestureUI } from './components/GestureUI';
import { AppState, InteractionMode } from './types';
import { CAMERA_POSITION_DESKTOP, CAMERA_POSITION_MOBILE, CAMERA_FOV } from './constants';

// LocalStorage keys
const STORAGE_KEYS = {
  USER_PHOTOS: 'celestial-tree-user-photos',
  USER_GIFTS: 'celestial-tree-user-gifts',
};

const App: React.FC = () => {
  // State Management with localStorage initialization
  const [appState, setAppState] = useState<AppState>(AppState.TREE_SHAPE);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>(InteractionMode.IDLE);
  
  // Initialize from localStorage
  const [userPhotos, setUserPhotos] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER_PHOTOS);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load photos from localStorage:', error);
      return [];
    }
  });
  
  const [userGiftMessages, setUserGiftMessages] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER_GIFTS);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load gifts from localStorage:', error);
      return [];
    }
  });

  // Persist userPhotos to localStorage whenever it changes
  useEffect(() => {
    try {
      if (userPhotos.length > 0) {
        localStorage.setItem(STORAGE_KEYS.USER_PHOTOS, JSON.stringify(userPhotos));
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER_PHOTOS);
      }
    } catch (error) {
      console.error('Failed to save photos to localStorage:', error);
    }
  }, [userPhotos]);

  // Persist userGiftMessages to localStorage whenever it changes
  useEffect(() => {
    try {
      if (userGiftMessages.length > 0) {
        localStorage.setItem(STORAGE_KEYS.USER_GIFTS, JSON.stringify(userGiftMessages));
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER_GIFTS);
      }
    } catch (error) {
      console.error('Failed to save gifts to localStorage:', error);
    }
  }, [userGiftMessages]);

  // Canvas container ref for screenshot
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Responsive Camera Position - memoized
  const cameraPosition = useMemo(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    return isMobile ? CAMERA_POSITION_MOBILE : CAMERA_POSITION_DESKTOP;
  }, []);

  // Update photos handler - no need to cleanup blob URLs since we're using base64
  const handlePhotosUpload = useCallback((newPhotos: string[]) => {
    setUserPhotos(newPhotos);
  }, []);

  // Screenshot function
  const takeScreenshot = useCallback(() => {
    if (!canvasContainerRef.current) return;
    
    const canvas = canvasContainerRef.current.querySelector('canvas');
    if (!canvas) return;

    try {
      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        if (isMobile && navigator.share) {
          // Mobile: Use Web Share API to save to Photos/Gallery
          try {
            const file = new File([blob], `christmas-tree-${Date.now()}.png`, { type: 'image/png' });
            await navigator.share({
              files: [file],
              title: 'My Christmas Tree',
              text: 'Check out my Christmas tree! 🎄'
            });
          } catch (shareError) {
            // If share is cancelled or fails, fallback to opening image
            console.log('Share cancelled or failed:', shareError);
            openImageInNewTab(blob);
          }
        } else {
          // Desktop or no share support: Download file
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `christmas-tree-${Date.now()}.png`;
          link.click();
          URL.revokeObjectURL(url);
        }
      }, 'image/png', 1.0);
    } catch (error) {
      console.error('Screenshot failed:', error);
    }
  }, []);

  // Helper function to open image in new tab (fallback for mobile)
  const openImageInNewTab = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');
    if (newWindow) {
      newWindow.onload = () => URL.revokeObjectURL(url);
    } else {
      URL.revokeObjectURL(url);
    }
  };

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
          powerPreference: 'high-performance',
          preserveDrawingBuffer: true // Required for screenshots
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