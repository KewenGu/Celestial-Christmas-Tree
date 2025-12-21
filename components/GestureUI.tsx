import React, { useEffect, useRef, useState } from 'react';
import { AppState, InteractionMode } from '../types';
import Webcam from 'react-webcam';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

interface GestureUIProps {
  appState: AppState;
  interactionMode: InteractionMode;
  setAppState: (s: AppState) => void;
  setInteractionMode: (m: InteractionMode) => void;
  onUserPhotosUpload: (urls: string[]) => void;
  onUserGiftsUpdate: (msgs: string[]) => void;
  userGiftMessages: string[];
}

// Constants
const GESTURE_CONFIDENCE_THRESHOLD = 5;
const MEDIAPIPE_WASM_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const HAND_LANDMARKER_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const PINCH_DISTANCE_THRESHOLD = 0.08;
const THUMB_EXTENDED_DISTANCE_THRESHOLD = 0.2;
const FINGER_EXTENSION_MULTIPLIER = 1.2;

// Default gifts to populate the list if empty (Syncs with InteractiveItems)
const DEFAULT_GIFTS = [
  "New iPhone 16", "World Peace", "A Pair of Socks", "NVIDIA RTX 5090",
  "A Warm Hug", "$1000 Amazon Card", "Coal :(", "Trip to Mars",
  "React Tutorials", "Infinite Coffee"
];

export const GestureUI: React.FC<GestureUIProps> = ({ 
  appState, 
  interactionMode, 
  setAppState, 
  setInteractionMode,
  onUserPhotosUpload,
  onUserGiftsUpdate,
  userGiftMessages
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [debugStatus, setDebugStatus] = useState("Initializing...");
  
  // Custom Modal State
  const [showGiftModal, setShowGiftModal] = useState(false);
  // Replaced simple string with array for list editing
  const [giftList, setGiftList] = useState<string[]>([]);

  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const requestRef = useRef<number>(0);
  const gestureHistoryRef = useRef<string[]>([]);
  const currentStableGestureRef = useRef<string>("UNKNOWN");
  
  // Hidden file input for photo upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initModel = async () => {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
        handLandmarkerRef.current = await HandLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: HAND_LANDMARKER_MODEL_URL,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1,
          minHandDetectionConfidence: 0.5,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
        setModelLoaded(true);
        setDebugStatus("Vision Ready");
        detect();
      } catch (error) {
        console.error(error);
        setDebugStatus("AI Error");
      }
    };
    initModel();
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (handLandmarkerRef.current) handLandmarkerRef.current.close();
    };
  }, []);

  const detect = () => {
    if (webcamRef.current?.video && handLandmarkerRef.current) {
      const video = webcamRef.current.video;
      if (video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;
        const results = handLandmarkerRef.current.detectForVideo(video, performance.now());
        processResults(results);
      }
    }
    requestRef.current = requestAnimationFrame(detect);
  };

  const processResults = (results: any) => {
    // If modal is open, pause gesture detection interactions
    if (showGiftModal) return;

    let detectedGesture = "NONE";

    if (results.landmarks && results.landmarks.length > 0) {
      const landmarks = results.landmarks[0]; 
      const dist = (i1: number, i2: number) => {
        const p1 = landmarks[i1];
        const p2 = landmarks[i2];
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
      };
      
      const isExtended = (tipIdx: number, mcpIdx: number) => {
        return dist(tipIdx, 0) > dist(mcpIdx, 0) * FINGER_EXTENSION_MULTIPLIER;
      };

      const thumbExtended = dist(4, 17) > THUMB_EXTENDED_DISTANCE_THRESHOLD;
      const indexExtended = isExtended(8, 5);
      const middleExtended = isExtended(12, 9);
      const ringExtended = isExtended(16, 13);
      const pinkyExtended = isExtended(20, 17);
      const extendedCount = [thumbExtended, indexExtended, middleExtended, ringExtended, pinkyExtended].filter(Boolean).length;
      
      const pinchDistance = dist(4, 8);
      const isPinching = pinchDistance < PINCH_DISTANCE_THRESHOLD;

      if (isPinching) detectedGesture = "PINCH";
      else if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) detectedGesture = "POINT";
      else if (extendedCount <= 1) detectedGesture = "FIST";
      else if (extendedCount >= 4) detectedGesture = "OPEN";
      else detectedGesture = "NEUTRAL";
    }

    const history = gestureHistoryRef.current;
    history.push(detectedGesture);
    if (history.length > GESTURE_CONFIDENCE_THRESHOLD) history.shift();

    const allMatch = history.length === GESTURE_CONFIDENCE_THRESHOLD && history.every(g => g === detectedGesture);
    
    if (allMatch && detectedGesture !== currentStableGestureRef.current) {
      currentStableGestureRef.current = detectedGesture;
      applyGestureEffect(detectedGesture);
    }
    setDebugStatus(`${detectedGesture}`);
  };

  const applyGestureEffect = (gesture: string) => {
    switch (gesture) {
      case "PINCH": setInteractionMode(InteractionMode.PULLING_FRAME); break;
      case "POINT": setInteractionMode(InteractionMode.PULLING_GIFT); break;
      case "FIST": 
        setInteractionMode(InteractionMode.IDLE);
        setAppState(AppState.TREE_SHAPE); 
        break;
      case "OPEN": 
        setInteractionMode(InteractionMode.IDLE);
        setAppState(AppState.SCATTERED); 
        break;
      default: setInteractionMode(InteractionMode.IDLE); break;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newPhotos: string[] = [];
      Array.from(files).forEach((file) => {
         // Explicitly cast to Blob or File to avoid 'unknown' error
         newPhotos.push(URL.createObjectURL(file as File));
      });
      onUserPhotosUpload(newPhotos);
    }
    // Reset input to allow re-uploading the same file if needed
    if (e.target) e.target.value = '';
  };

  const triggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // --- MODAL LOGIC ---

  const triggerGiftInput = () => {
    // Populate list: if user has data, use it. Else use defaults so they have something to edit.
    if (userGiftMessages && userGiftMessages.length > 0) {
      setGiftList([...userGiftMessages]);
    } else {
      setGiftList([...DEFAULT_GIFTS]);
    }
    setShowGiftModal(true);
  };

  const updateGiftItem = (index: number, value: string) => {
    const newList = [...giftList];
    newList[index] = value;
    setGiftList(newList);
  };

  const deleteGiftItem = (index: number) => {
    const newList = giftList.filter((_, i) => i !== index);
    setGiftList(newList);
  };

  const addGiftItem = () => {
    setGiftList([...giftList, ""]); // Add empty item to scroll to
  };

  const submitGifts = () => {
    // Filter out empty strings before submitting
    const cleanedList = giftList.map(s => s.trim()).filter(s => s.length > 0);
    
    if (cleanedList.length > 0) {
      onUserGiftsUpdate(cleanedList);
    }
    setShowGiftModal(false);
  };

  return (
    <>
      {/* 
        Custom Modal Overlay: Gift List Editor
      */}
      {showGiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-auto" style={{ 
          background: 'radial-gradient(circle at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.95) 100%)',
          backdropFilter: 'blur(20px)'
        }}>
          <div className="w-full max-w-2xl flex flex-col max-h-[85vh] rounded-2xl overflow-hidden shadow-[0_20px_80px_rgba(255,215,0,0.15)]" style={{
            background: 'linear-gradient(135deg, rgba(10,10,15,0.95) 0%, rgba(15,15,20,0.98) 100%)',
            border: '1px solid rgba(255,215,0,0.2)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 0 0 1px rgba(0,0,0,0.5)'
          }}>
             
             {/* Header with Decorative Elements */}
             <div className="relative p-8 border-b border-[#FFD700]/20" style={{
               background: 'linear-gradient(180deg, rgba(255,215,0,0.08) 0%, transparent 100%)'
             }}>
                {/* Decorative Corner Elements */}
                <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-[#FFD700]/40"></div>
                <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-[#FFD700]/40"></div>
                
                <div className="text-center">
                  <div className="inline-flex items-center gap-3 mb-2">
                    <span className="text-3xl">🎁</span>
                    <h2 className="text-4xl font-['Playfair_Display'] italic text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] via-[#FFF8DC] to-[#FFD700]">
                      Your Wish List
                    </h2>
                    <span className="text-3xl">🎁</span>
                  </div>
                  <p className="text-white/50 text-sm font-['Lato'] tracking-wide">
                    Customize the gifts under your celestial tree
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{
                    background: 'rgba(255,215,0,0.1)',
                    border: '1px solid rgba(255,215,0,0.3)'
                  }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    <span className="text-[#FFD700] text-xs font-['Lato'] font-semibold tracking-wider">
                      {giftList.length} GIFTS
                    </span>
                  </div>
                </div>
             </div>
             
             {/* Scrollable List Body with Custom Scrollbar */}
             <div className="flex-1 overflow-y-auto p-6 space-y-3" style={{
               scrollbarWidth: 'thin',
               scrollbarColor: 'rgba(255,215,0,0.3) rgba(255,255,255,0.05)'
             }}>
                <style>{`
                  .gift-scroll::-webkit-scrollbar {
                    width: 8px;
                  }
                  .gift-scroll::-webkit-scrollbar-track {
                    background: rgba(255,255,255,0.05);
                    border-radius: 4px;
                  }
                  .gift-scroll::-webkit-scrollbar-thumb {
                    background: rgba(255,215,0,0.3);
                    border-radius: 4px;
                  }
                  .gift-scroll::-webkit-scrollbar-thumb:hover {
                    background: rgba(255,215,0,0.5);
                  }
                `}</style>
                
                {giftList.map((gift, index) => (
                  <div 
                    key={index} 
                    className="flex gap-3 items-center group"
                    style={{
                      animation: `slideIn 0.3s ease-out ${index * 0.05}s both`
                    }}
                  >
                    <style>{`
                      @keyframes slideIn {
                        from {
                          opacity: 0;
                          transform: translateX(-20px);
                        }
                        to {
                          opacity: 1;
                          transform: translateX(0);
                        }
                      }
                    `}</style>
                    
                    {/* Number Badge */}
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg font-['Lato'] text-sm font-semibold shrink-0" style={{
                      background: 'linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(255,215,0,0.05) 100%)',
                      border: '1px solid rgba(255,215,0,0.2)',
                      color: '#FFD700'
                    }}>
                      {index + 1}
                    </div>
                    
                    {/* Input Field */}
                    <input 
                      type="text"
                      value={gift}
                      onChange={(e) => updateGiftItem(index, e.target.value)}
                      placeholder="✨ Enter your wish..."
                      className="flex-1 px-4 py-3 rounded-lg font-['Lato'] text-white placeholder-white/30 text-sm transition-all duration-200 focus:outline-none"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
                      }}
                      onFocus={(e) => {
                        e.target.style.background = 'rgba(255,215,0,0.05)';
                        e.target.style.borderColor = 'rgba(255,215,0,0.5)';
                        e.target.style.boxShadow = '0 0 0 3px rgba(255,215,0,0.1), inset 0 2px 4px rgba(0,0,0,0.2)';
                      }}
                      onBlur={(e) => {
                        e.target.style.background = 'rgba(255,255,255,0.03)';
                        e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                        e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.2)';
                      }}
                      autoFocus={index === giftList.length - 1 && gift === ""}
                    />
                    
                    {/* Delete Button */}
                    <button 
                      onClick={() => deleteGiftItem(index)}
                      className="w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 shrink-0 opacity-0 group-hover:opacity-100"
                      style={{
                        background: 'rgba(255,100,100,0.1)',
                        border: '1px solid rgba(255,100,100,0.2)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,100,100,0.2)';
                        e.currentTarget.style.borderColor = 'rgba(255,100,100,0.4)';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,100,100,0.1)';
                        e.currentTarget.style.borderColor = 'rgba(255,100,100,0.2)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      title="Remove Gift"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,100,100,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"/>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                ))}

                {/* Empty State */}
                {giftList.length === 0 && (
                   <div className="text-center py-16">
                     <div className="text-6xl mb-4">🎄</div>
                     <p className="text-white/40 text-sm font-['Lato'] italic">
                       No wishes yet. Add your first gift below!
                     </p>
                   </div>
                )}
             </div>
             
             {/* Action Footer */}
             <div className="p-6 border-t border-[#FFD700]/20" style={{
               background: 'linear-gradient(0deg, rgba(255,215,0,0.05) 0%, transparent 100%)'
             }}>
                {/* Add Button */}
                <button 
                  onClick={addGiftItem}
                  className="w-full mb-4 py-3 rounded-lg font-['Lato'] text-sm font-semibold tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 group"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.05) 100%)',
                    border: '2px dashed rgba(255,215,0,0.3)',
                    color: 'rgba(255,215,0,0.8)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,215,0,0.2) 0%, rgba(255,215,0,0.1) 100%)';
                    e.currentTarget.style.borderColor = 'rgba(255,215,0,0.6)';
                    e.currentTarget.style.color = '#FFD700';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.05) 100%)';
                    e.currentTarget.style.borderColor = 'rgba(255,215,0,0.3)';
                    e.currentTarget.style.color = 'rgba(255,215,0,0.8)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-90 transition-transform duration-300">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Add Another Wish
                </button>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                  <button 
                    onClick={() => setShowGiftModal(false)}
                    className="px-6 py-2.5 rounded-lg font-['Lato'] text-sm font-medium transition-all duration-200"
                    style={{
                      color: 'rgba(255,255,255,0.6)',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={submitGifts}
                    className="px-8 py-2.5 rounded-lg font-['Lato'] text-sm font-bold tracking-wide uppercase transition-all duration-200"
                    style={{
                      background: 'linear-gradient(135deg, #FFD700 0%, #FDB931 100%)',
                      color: '#000',
                      boxShadow: '0 4px 20px rgba(255,215,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 30px rgba(255,215,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,215,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)';
                    }}
                  >
                    ✨ Apply Changes
                  </button>
                </div>
             </div>
             
             {/* Decorative Bottom Corners */}
             <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-[#FFD700]/40"></div>
             <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-[#FFD700]/40"></div>
          </div>
        </div>
      )}

      {/* Main Gesture UI Layer */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-8 z-10">
        
        {/* Hidden File Input (Supports Multiple) */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept="image/*" 
          multiple 
          className="hidden pointer-events-auto"
          style={{ display: 'none' }}
        />

        {/* 
          High-End Minimalist Header 
          Mobile Optimized: Smaller text, tighter spacing
        */}
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            <h1 className="font-['Playfair_Display'] text-white/90 drop-shadow-2xl leading-[0.85]">
              <span className="block text-4xl md:text-7xl font-normal tracking-wide">Christmas</span>
              <span className="block text-4xl md:text-7xl font-normal italic opacity-80">Tree</span>
            </h1>
            
            <div className="mt-4 md:mt-8 space-y-1.5 md:space-y-2 pointer-events-auto">
               <InstructionRow label="SCATTER" gesture="Open Hand" active={appState === AppState.SCATTERED} />
               <InstructionRow label="FORM TREE" gesture="Closed Fist" active={appState === AppState.TREE_SHAPE} />
               
               {/* Clickable Area for Upload */}
               <div onClick={triggerUpload} className="group cursor-pointer transition-opacity" title="Secret: Upload your own photo(s)">
                 <InstructionRow label="PICK A PHOTO" gesture="Pinch Index & Thumb" active={interactionMode === InteractionMode.PULLING_FRAME} />
                 {/* Visual Hint on Hover */}
                 <div className="h-0 group-hover:h-0.5 w-0 group-hover:w-full bg-[#FFD700] transition-all duration-300 opacity-0 group-hover:opacity-100 mt-0.5"></div>
               </div>

               {/* Clickable Area for Gift Input */}
               <div onClick={triggerGiftInput} className="group cursor-pointer transition-opacity" title="Secret: Manage your gift list">
                 <InstructionRow label="PICK A GIFT" gesture="Point Finger" active={interactionMode === InteractionMode.PULLING_GIFT} />
                 {/* Visual Hint on Hover */}
                 <div className="h-0 group-hover:h-0.5 w-0 group-hover:w-full bg-[#FFD700] transition-all duration-300 opacity-0 group-hover:opacity-100 mt-0.5"></div>
               </div>
            </div>
          </div>

          {/* Minimalist Camera Frame - Mobile Optimized size */}
          <div className="relative group">
             <div className="w-20 h-16 md:w-40 md:h-32 rounded-sm overflow-hidden border border-white/10 bg-black/40 shadow-2xl transition-all duration-700 opacity-60 hover:opacity-100 pointer-events-auto">
                <Webcam 
                  ref={webcamRef}
                  className="w-full h-full object-cover -scale-x-100 opacity-60 grayscale hover:grayscale-0 transition-all duration-500"
                  mirrored={false} 
                  audio={false}
                  width={320}
                  height={240}
                />
             </div>
             {/* Status Dot */}
             <div className={`absolute top-1 right-1 md:top-2 md:right-2 w-1.5 h-1.5 rounded-full ${modelLoaded ? 'bg-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-rose-500/80'}`} />
          </div>
        </div>

        {/* Manual Controls */}
        <div className="pointer-events-auto self-center mb-6 md:mb-4 transition-opacity duration-500 opacity-100 md:opacity-0 md:hover:opacity-100">
          <div className="flex gap-3 md:gap-6 bg-black/60 backdrop-blur-md px-4 py-3 md:px-6 md:py-3 rounded-full border border-white/10 text-white/90 font-['Lato'] text-[10px] md:text-xs tracking-widest uppercase shadow-lg">
             <button onClick={() => applyGestureEffect('OPEN')} className="active:scale-95 transition-transform hover:text-white">Scatter</button>
             <div className="w-[1px] bg-white/20 h-3 md:h-4 self-center"></div>
             <button onClick={() => applyGestureEffect('FIST')} className="active:scale-95 transition-transform hover:text-white">Tree</button>
             <div className="w-[1px] bg-white/20 h-3 md:h-4 self-center"></div>
             <button onClick={() => applyGestureEffect('PINCH')} className="active:scale-95 transition-transform hover:text-white">Photo</button>
             <div className="w-[1px] bg-white/20 h-3 md:h-4 self-center"></div>
             <button onClick={() => applyGestureEffect('POINT')} className="active:scale-95 transition-transform hover:text-white">Gift</button>
          </div>
        </div>
      </div>
    </>
  );
};

// Helper for clean instruction list
const InstructionRow = ({ label, gesture, active }: { label: string, gesture: string, active: boolean }) => (
  <div className={`flex items-center gap-3 transition-all duration-500 py-1 ${active ? 'opacity-100 translate-x-2' : 'opacity-40 hover:opacity-80'}`}>
    <div className={`w-4 md:w-6 h-[1px] ${active ? 'bg-white' : 'bg-white/30'}`}></div>
    <div className="flex flex-col">
      <span className="text-[9px] md:text-[10px] font-['Lato'] tracking-widest text-white uppercase">{label}</span>
      <span className="text-[8px] md:text-[9px] font-['Lato'] text-white/50 italic block">{gesture}</span>
    </div>
  </div>
);