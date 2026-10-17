/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Zap, Rocket, Sliders, Hand, Gamepad2 } from 'lucide-react';
import { haptics } from '../utils/haptics';

interface MobileControlsProps {
  paddleNormalizedX: number; // 0 to 1
  onMoveDelta: (deltaNormalized: number) => void;
  onSetPosition: (normalizedX: number) => void;
  onMoveStep: (direction: -1 | 1) => void;
  onStartMoveContinuous: (direction: -1 | 1) => void;
  onStopMoveContinuous: () => void;
  onActionTrigger: () => void;
  isStickyBallActive: boolean;
  isLaserActive: boolean;
}

export const MobileControls: React.FC<MobileControlsProps> = ({
  paddleNormalizedX,
  onMoveDelta,
  onSetPosition,
  onMoveStep,
  onStartMoveContinuous,
  onStopMoveContinuous,
  onActionTrigger,
  isStickyBallActive,
  isLaserActive,
}) => {
  const [controlType, setControlType] = useState<'trackpad' | 'buttons'>('trackpad');
  const [sensitivity, setSensitivity] = useState<number>(1.0); // 0.8, 1.0, 1.3
  const trackpadRef = useRef<HTMLDivElement | null>(null);
  const lastTouchXRef = useRef<number | null>(null);
  const isTouchingRef = useRef<boolean>(false);
  const laserIntervalRef = useRef<number | null>(null);

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const savedType = localStorage.getItem('breakout_mobile_control_type');
      if (savedType === 'buttons' || savedType === 'trackpad') {
        setControlType(savedType);
      }
      const savedSens = localStorage.getItem('breakout_mobile_sensitivity');
      if (savedSens) {
        setSensitivity(parseFloat(savedSens));
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleToggleControlType = () => {
    const nextType = controlType === 'trackpad' ? 'buttons' : 'trackpad';
    setControlType(nextType);
    haptics.buttonTap();
    try {
      localStorage.setItem('breakout_mobile_control_type', nextType);
    } catch {}
  };

  const handleCycleSensitivity = () => {
    const next = sensitivity === 0.8 ? 1.0 : sensitivity === 1.0 ? 1.3 : 0.8;
    setSensitivity(next);
    haptics.buttonTap();
    try {
      localStorage.setItem('breakout_mobile_sensitivity', next.toString());
    } catch {}
  };

  // Trackpad Touch Handlers
  const handleTrackpadTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 0) return;
    isTouchingRef.current = true;
    const touch = e.touches[0];
    lastTouchXRef.current = touch.clientX;

    // Direct touch position targeting if tapped
    if (trackpadRef.current) {
      const rect = trackpadRef.current.getBoundingClientRect();
      const relativeX = (touch.clientX - rect.left) / rect.width;
      const clamped = Math.max(0, Math.min(1, relativeX));
      onSetPosition(clamped);
      haptics.paddleBounce();
    }
  };

  const handleTrackpadTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isTouchingRef.current || e.touches.length === 0) return;
    const touch = e.touches[0];

    if (lastTouchXRef.current !== null && trackpadRef.current) {
      const rect = trackpadRef.current.getBoundingClientRect();
      const deltaPx = touch.clientX - lastTouchXRef.current;
      const normalizedDelta = (deltaPx / rect.width) * sensitivity;
      onMoveDelta(normalizedDelta);
    }

    lastTouchXRef.current = touch.clientX;
  };

  const handleTrackpadTouchEnd = () => {
    isTouchingRef.current = false;
    lastTouchXRef.current = null;
  };

  // Laser continuous auto-fire on hold
  const handleActionTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    onActionTrigger();
    haptics.buttonTap();

    if (isLaserActive) {
      if (laserIntervalRef.current) clearInterval(laserIntervalRef.current);
      laserIntervalRef.current = window.setInterval(() => {
        onActionTrigger();
        haptics.laserShot();
      }, 150);
    }
  };

  const handleActionTouchEnd = () => {
    if (laserIntervalRef.current) {
      clearInterval(laserIntervalRef.current);
      laserIntervalRef.current = null;
    }
  };

  return (
    <div className="w-full flex flex-col gap-2 select-none touch-none bg-slate-950/95 border border-slate-900 p-2 sm:p-3 rounded-2xl shadow-xl backdrop-blur-md">
      {/* Settings Ribbon */}
      <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400 px-1">
        <button
          onClick={handleToggleControlType}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-cyan-400 active:scale-95 transition-all cursor-pointer"
        >
          {controlType === 'trackpad' ? (
            <>
              <Hand size={12} />
              <span>Touchpad Neon</span>
            </>
          ) : (
            <>
              <Gamepad2 size={12} />
              <span>Botões Arcade</span>
            </>
          )}
        </button>

        <button
          onClick={handleCycleSensitivity}
          className="flex items-center gap-1.5 px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 active:scale-95 transition-all cursor-pointer"
          title="Sensibilidade do controle"
        >
          <Sliders size={11} className="text-cyan-400" />
          <span>Sens: {sensitivity.toFixed(1)}x</span>
        </button>
      </div>

      {/* Main Interactive Controls Surface */}
      <div className="flex items-stretch gap-2 w-full min-h-[64px]">
        {/* Trackpad Mode */}
        {controlType === 'trackpad' ? (
          <div
            ref={trackpadRef}
            onTouchStart={handleTrackpadTouchStart}
            onTouchMove={handleTrackpadTouchMove}
            onTouchEnd={handleTrackpadTouchEnd}
            onTouchCancel={handleTrackpadTouchEnd}
            className="flex-1 relative h-16 bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/30 rounded-xl overflow-hidden cursor-ew-resize flex items-center justify-center active:border-cyan-400 transition-colors shadow-inner"
          >
            {/* Background grid markings */}
            <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:12px_12px]" />

            {/* Center deadzone mark */}
            <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-slate-700/60 pointer-events-none" />

            {/* Neon paddle visual indicator track */}
            <div
              className="absolute top-2 bottom-2 w-12 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-500 opacity-80 shadow-[0_0_12px_rgba(6,182,212,0.6)] pointer-events-none transition-all duration-75 flex items-center justify-center"
              style={{
                left: `calc(${paddleNormalizedX * 100}% - 24px)`,
              }}
            >
              <div className="w-1.5 h-6 bg-white rounded-full opacity-70" />
            </div>

            {/* Subtle Guide Caption */}
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold pointer-events-none">
              ◄ Deslize aqui para mover ►
            </span>
          </div>
        ) : (
          /* D-Pad Arcade Buttons Mode */
          <div className="flex-1 flex gap-2">
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                onStartMoveContinuous(-1);
                haptics.buttonTap();
              }}
              onTouchEnd={onStopMoveContinuous}
              onTouchCancel={onStopMoveContinuous}
              onMouseDown={() => onStartMoveContinuous(-1)}
              onMouseUp={onStopMoveContinuous}
              onMouseLeave={onStopMoveContinuous}
              className="flex-1 bg-slate-900 active:bg-cyan-950 border border-slate-800 active:border-cyan-500 rounded-xl flex items-center justify-center text-cyan-400 active:text-cyan-200 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <ArrowLeft size={24} className="stroke-[2.5]" />
            </button>

            <button
              onTouchStart={(e) => {
                e.preventDefault();
                onStartMoveContinuous(1);
                haptics.buttonTap();
              }}
              onTouchEnd={onStopMoveContinuous}
              onTouchCancel={onStopMoveContinuous}
              onMouseDown={() => onStartMoveContinuous(1)}
              onMouseUp={onStopMoveContinuous}
              onMouseLeave={onStopMoveContinuous}
              className="flex-1 bg-slate-900 active:bg-cyan-950 border border-slate-800 active:border-cyan-500 rounded-xl flex items-center justify-center text-cyan-400 active:text-cyan-200 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <ArrowRight size={24} className="stroke-[2.5]" />
            </button>
          </div>
        )}

        {/* Primary Action Button (Launch / Laser) */}
        <button
          onTouchStart={handleActionTouchStart}
          onTouchEnd={handleActionTouchEnd}
          onMouseDown={handleActionTouchStart}
          onMouseUp={handleActionTouchEnd}
          className={`min-w-[100px] sm:min-w-[130px] px-3 rounded-xl border flex flex-col items-center justify-center gap-1 active:scale-95 transition-all shadow-lg cursor-pointer ${
            isLaserActive
              ? 'bg-gradient-to-tr from-pink-600 to-rose-500 border-pink-400 text-white shadow-pink-500/30 animate-pulse'
              : isStickyBallActive
              ? 'bg-gradient-to-tr from-cyan-600 to-indigo-600 border-cyan-400 text-white shadow-cyan-500/30'
              : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
          }`}
        >
          {isLaserActive ? (
            <>
              <Zap size={20} className="fill-current" />
              <span className="text-[10px] font-black font-mono tracking-wider uppercase">
                LASER!
              </span>
            </>
          ) : isStickyBallActive ? (
            <>
              <Rocket size={20} className="animate-bounce" />
              <span className="text-[10px] font-black font-mono tracking-wider uppercase">
                LANÇAR
              </span>
            </>
          ) : (
            <>
              <Zap size={18} />
              <span className="text-[10px] font-bold font-mono tracking-wider uppercase">
                AÇÃO
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
