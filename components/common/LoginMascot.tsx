import React, { useEffect, useState, useRef } from 'react';
import confetti from 'canvas-confetti';

export type MascotState = 'idle' | 'email' | 'password' | 'peek' | 'success' | 'error';

interface LoginMascotProps {
  state: MascotState;
  role?: 'teacher' | 'student' | null;
}

// --- Reusable Eye Component ---
const MascotEye: React.FC<{
  r: number; // radius
  pupilR: number; // pupil radius
  offset: { x: number; y: number };
  state: MascotState;
  colors: any;
  showSclera?: boolean;
}> = ({ r, pupilR, offset, state, colors, showSclera = true }) => {
  const strokeWidth = Math.max(2, r * 0.4);

  // 1. Password State: Closed Eyes (Curved Line Down)
  if (state === 'password') {
    return (
      <path 
        d={`M -${r} 0 Q 0 ${r*0.8} ${r} 0`} 
        fill="none" 
        stroke={colors.pupil} 
        strokeWidth={strokeWidth} 
        strokeLinecap="round" 
        className="animate-in fade-in duration-200"
      />
    );
  }

  // 2. Success State: Happy Eyes (Curved Line Up)
  if (state === 'success') {
    return (
      <path 
        d={`M -${r} ${r/2} Q 0 -${r} ${r} ${r/2}`} 
        fill="none" 
        stroke={colors.pupil} 
        strokeWidth={strokeWidth} 
        strokeLinecap="round"
        className="animate-in fade-in duration-200"
      />
    );
  }

  // 3. Error State: X Eyes or > <
  if (state === 'error') {
    const xSize = r * 0.8;
    return (
      <g className="animate-in zoom-in duration-200">
        <path d={`M -${xSize} -${xSize} L ${xSize} ${xSize}`} stroke={colors.pupil} strokeWidth={strokeWidth} strokeLinecap="round" />
        <path d={`M ${xSize} -${xSize} L -${xSize} ${xSize}`} stroke={colors.pupil} strokeWidth={strokeWidth} strokeLinecap="round" />
      </g>
    );
  }

  // 4. Default State: Open Eyes with Tracking
  return (
    <g>
      {showSclera && <circle r={r} fill={colors.eyeWhite} />}
      <circle 
        r={pupilR} 
        fill={colors.pupil} 
        cx={offset.x} 
        cy={offset.y} 
        className="transition-all duration-75 ease-out"
      />
    </g>
  );
};

const LoginMascot: React.FC<LoginMascotProps> = ({ state, role }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  // Use a ref to track state inside event listener
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Confetti Logic
  useEffect(() => {
    let myConfetti: any = null;
    
    const canvas = canvasRef.current;
    if (state === 'success' && canvas && canvas instanceof HTMLCanvasElement && typeof canvas.getBoundingClientRect === 'function') {
      try {
        // Disable resize and useWorker to avoid potential detached canvas issues
        myConfetti = confetti.create(canvas, {
          resize: false,
          useWorker: false
        });

        // Manually trigger a resize once to ensure correct dimensions
        const rect = canvas.getBoundingClientRect();
        if (rect && rect.width > 0 && rect.height > 0) {
          canvas.width = rect.width;
          canvas.height = rect.height;
        }

        // Upward "cannon" burst from bottom center
        myConfetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 1 }, // Start from bottom
          colors: ['#4B3F72', '#FFC857', '#F45B69', '#FFFFFF'],
          shapes: ['circle', 'square'],
          startVelocity: 60,
          gravity: 0.8,
          scalar: 1.2,
          drift: 0,
          ticks: 300
        });
      } catch (err) {
        console.warn("Confetti initialization failed", err);
      }
    }

    // Cleanup
    return () => {
      if (myConfetti) {
        try {
          myConfetti.reset();
        } catch (e) {}
      }
    };
  }, [state]);

  // Handle Mouse Move for Eye Tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const currentState = stateRef.current;
      
      if (currentState !== 'idle' && currentState !== 'email') {
          setMousePos({ x: 0, y: 0 });
          return;
      }
      
      const svgEl = svgRef.current;
      
      // Robust check for element and method existence
      if (!svgEl || typeof svgEl.getBoundingClientRect !== 'function') {
          return;
      }

      try {
          const rect = svgEl.getBoundingClientRect();
          if (!rect || rect.width === 0 || rect.height === 0) return;

          const x = (e.clientX - rect.left) / rect.width; 
          const y = (e.clientY - rect.top) / rect.height; 
          
          setMousePos({
            x: Math.min(Math.max((x - 0.5) * 2, -1), 1),
            y: Math.min(Math.max((y - 0.5) * 2, -1), 1),
          });
      } catch (err) {
          // Ignore
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // --- Animation Logic Helpers ---

  const getPupilOffset = (sensitivity: number = 3) => {
    let targetX = mousePos.x * sensitivity;
    let targetY = mousePos.y * sensitivity;

    if (state === 'peek') {
      return { x: 0, y: -2 }; // Look up
    }
    if (state !== 'idle' && state !== 'email') {
        return { x: 0, y: 0 };
    }
    
    return { x: targetX, y: targetY };
  };

  const getJumpTransform = (delay: number) => {
    if (state === 'success') return `translateY(-40px)`;
    if (state === 'email') return `translateY(0)`; 
    if (state === 'error') return `translateY(5px)`;
    return `translateY(0)`;
  };

  const commonTransition = "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)";
  const groupTransform = "translate(15, 30) scale(0.95)";

  const colors = {
      purple: '#8b5cf6', // violet-500
      purpleDark: '#7c3aed', // violet-600
      black: '#27272a',
      blackDark: '#18181b',
      orange: '#f97316',
      orangeDark: '#c2410c',
      yellow: '#facc15',
      yellowDark: '#ca8a04',
      eyeWhite: '#ffffff',
      pupil: '#0f172a'
  };

  // Dynamic Background Blob Color based on state and role
  const blobColorClass = state === 'error' 
    ? 'bg-red-200/50' 
    : role === 'student' 
        ? 'bg-indigo-200/40' // Changed to a nice blue-ish background
        : 'bg-primary-200/30';

  return (
    <div className={`w-full h-full flex items-center justify-center bg-transparent transition-colors duration-500 overflow-hidden relative`}>
      
      {/* 0. Bottom: Dynamic Background Blob */}
      <div 
        className={`absolute w-[500px] h-[500px] rounded-full blur-[100px] transition-all duration-1000 opacity-60 z-0 ${blobColorClass}`} 
        style={{ transform: 'translateY(10%)' }}
      />

      {/* 1. LAYER 1 (Z-10): Background Props & Shadow Base */}
      <svg 
        viewBox="0 0 400 300" 
        className="absolute inset-0 w-full h-full max-w-[600px] z-10 pointer-events-none"
        style={{ overflow: 'visible' }}
      >
        <g transform={groupTransform}>
            {/* Teacher: Blackboard */}
            <g className={`transition-opacity duration-500 ${role === 'teacher' ? 'opacity-100' : 'opacity-0'}`}>
               <rect x="0" y="20" width="360" height="200" rx="4" fill="#2d3330" stroke="#5c4d45" strokeWidth="8" />
               <path d="M 20 200 L 80 200" stroke="#fff" strokeWidth="2" strokeOpacity="0.3" strokeLinecap="round" />
               <text x="30" y="60" fontFamily="sans-serif" fontSize="14" fill="#fff" opacity="0.3" style={{fontStyle: 'italic'}}>Welcome Class!</text>
               <text x="260" y="180" fontFamily="sans-serif" fontSize="24" fill="#fff" opacity="0.1">E=mc²</text>
            </g>

            {/* Student: School Building (Vibrant Campus Theme) */}
            <g className={`transition-opacity duration-500 ${role === 'student' ? 'opacity-100' : 'opacity-0'}`}>
               {/* Ground (Green Grass) */}
               <rect x="10" y="210" width="340" height="10" fill="#86efac" /> 
               <rect x="20" y="200" width="320" height="10" fill="#4ade80" /> 
               
               {/* Building Body (White/Cream) */}
               <rect x="30" y="90" width="300" height="110" fill="#fff" stroke="#e2e8f0" strokeWidth="2" />
               
               {/* Windows (Glass Blue) */}
               <g fill="#bfdbfe" stroke="#60a5fa" strokeWidth="1">
                   <rect x="45" y="100" width="20" height="30" rx="2" />
                   <rect x="45" y="140" width="20" height="30" rx="2" />
                   
                   <rect x="85" y="100" width="20" height="30" rx="2" />
                   <rect x="85" y="140" width="20" height="30" rx="2" />
                   
                   <rect x="125" y="100" width="20" height="30" rx="2" />
                   <rect x="125" y="140" width="20" height="30" rx="2" />
                   
                   <rect x="215" y="100" width="20" height="30" rx="2" />
                   <rect x="215" y="140" width="20" height="30" rx="2" />
                   
                   <rect x="255" y="100" width="20" height="30" rx="2" />
                   <rect x="255" y="140" width="20" height="30" rx="2" />
                   
                   <rect x="295" y="100" width="20" height="30" rx="2" />
                   <rect x="295" y="140" width="20" height="30" rx="2" />
               </g>

               {/* Door & Entrance (Warm Yellow) */}
               <rect x="160" y="130" width="40" height="70" fill="#fcd34d" rx="4" stroke="#f59e0b" strokeWidth="2" />
               
               {/* Roof (Vibrant Blue) */}
               <path d="M 20 90 L 340 90 L 180 15 Z" fill="#60a5fa" stroke="#2563eb" strokeWidth="4" strokeLinejoin="round" />
               
               {/* Clock (Gold) */}
               <circle cx="180" cy="60" r="12" fill="#fff" stroke="#2563eb" strokeWidth="2" />
               <line x1="180" y1="60" x2="180" y2="52" stroke="#2563eb" strokeWidth="2" />
               <line x1="180" y1="60" x2="185" y2="60" stroke="#2563eb" strokeWidth="2" />
               
               {/* Flag Pole & Flag (Red) */}
               <line x1="180" y1="15" x2="180" y2="-10" stroke="#94a3b8" strokeWidth="2" />
               <path d="M 180 -10 L 210 0 L 180 10" fill="#f43f5e" />
            </g>

            {/* Shadow Base (On the floor) */}
            <ellipse cx="180" cy="255" rx="180" ry="14" fill="#000" opacity="0.08" 
                style={{ 
                    transition: commonTransition,
                    transformOrigin: 'center',
                    transform: state === 'success' ? 'scale(0.8)' : 'scale(1)' 
                }} 
            />
        </g>
      </svg>

      {/* 2. LAYER 2 (Z-20): Confetti Canvas */}
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-20"
        data-html2canvas-ignore="true"
      />

      {/* 3. LAYER 3 (Z-30): Mascots */}
      <svg 
        ref={svgRef}
        viewBox="0 0 400 300" 
        className="absolute inset-0 w-full h-full max-w-[600px] z-30"
        style={{ overflow: 'visible' }}
      >
        <g transform={groupTransform}>
            {/* 1. Purple (Back Left) */}
            <g transform="translate(85, 30)">
                <g style={{ transform: getJumpTransform(0), transition: commonTransition, transformOrigin: 'bottom center' }}>
                    <rect x="0" y="0" width="100" height="220" rx="6" fill={colors.purple} />
                    <g transform="translate(50, 60)">
                        <g transform="translate(-18, 0)">
                            <MascotEye r={7} pupilR={3} offset={getPupilOffset(4)} state={state} colors={colors} />
                        </g>
                        <g transform="translate(18, 0)">
                            <MascotEye r={7} pupilR={3} offset={getPupilOffset(4)} state={state} colors={colors} />
                        </g>
                        <rect x="-1.5" y="18" width="3" height="10" rx="1.5" fill="#1e1b4b" opacity="0.6" />
                    </g>
                    <g className={`transition-opacity duration-300 ${role === 'teacher' ? 'opacity-100' : 'opacity-0'}`} transform="translate(50, 100)">
                        <polygon points="0,0 -10,25 0,35 10,25" fill="#fff" />
                        <circle cx="0" cy="0" r="4" fill="#fff" />
                    </g>
                </g>
            </g>

            {/* 2. Black (Back Right) */}
            <g transform="translate(175, 90)">
                <g style={{ transform: getJumpTransform(100), transition: commonTransition, transformOrigin: 'bottom center' }}>
                    <rect x="0" y="0" width="90" height="160" rx="6" fill={colors.black} />
                    <g transform="translate(45, 50)">
                        <g transform="translate(-14, 0)">
                            <MascotEye r={6} pupilR={2.5} offset={getPupilOffset(3)} state={state} colors={colors} />
                        </g>
                        <g transform="translate(14, 0)">
                            <MascotEye r={6} pupilR={2.5} offset={getPupilOffset(3)} state={state} colors={colors} />
                        </g>
                        <circle cx="0" cy="18" r="2.5" fill="white" opacity="0.8" />
                    </g>
                </g>
            </g>

            {/* 3. Orange (Front Left) */}
            <g transform="translate(40, 180)">
                <g style={{ transform: getJumpTransform(50), transition: commonTransition, transformOrigin: 'bottom center' }}>
                    <path d="M 0 70 A 70 65 0 0 1 140 70 L 140 70 L 0 70 Z" fill={colors.orange} />
                    <g transform="translate(70, 45)">
                        <g className={`transition-opacity duration-300 ${role === 'teacher' ? 'opacity-100' : 'opacity-0'}`}>
                           <circle cx="-22" cy="-5" r="12" fill="none" stroke="#000" strokeWidth="3" />
                           <circle cx="22" cy="-5" r="12" fill="none" stroke="#000" strokeWidth="3" />
                           <line x1="-10" y1="-5" x2="10" y2="-5" stroke="#000" strokeWidth="3" />
                        </g>
                        <g transform="translate(-22, -5)">
                            <MascotEye r={8} pupilR={3} offset={getPupilOffset(3)} state={state} colors={colors} showSclera={role !== 'teacher'} />
                        </g>
                        <g transform="translate(22, -5)">
                            <MascotEye r={8} pupilR={3} offset={getPupilOffset(3)} state={state} colors={colors} showSclera={role !== 'teacher'} />
                        </g>
                        <path d="M -12 12 Q 0 20 12 12" fill="none" stroke={colors.pupil} strokeWidth="3" strokeLinecap="round" />
                    </g>
                </g>
            </g>

            {/* 4. Yellow (Front Right) */}
            <g transform="translate(215, 140)">
                <g style={{ transform: getJumpTransform(150), transition: commonTransition, transformOrigin: 'bottom center' }}>
                    <path d="M 0 50 A 50 50 0 0 1 100 50 L 100 110 L 0 110 Z" fill={colors.yellow} />
                    <g transform="translate(50, 50)">
                        <g transform="translate(-18, 0)">
                            <MascotEye r={5} pupilR={2} offset={getPupilOffset(3)} state={state} colors={colors} showSclera={false} />
                        </g>
                        <rect x="8" y="-2.5" width="55" height="5" rx="2.5" fill={colors.pupil} />
                    </g>
                </g>
            </g>
        </g>
      </svg>
    </div>
  );
};

export default LoginMascot;