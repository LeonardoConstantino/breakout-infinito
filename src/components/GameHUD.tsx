/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ActivePowerUp } from '../types';
import { getComboMultiplier } from '../utils/gameConstants';
import { Zap, Shield, Flame, Gauge, Magnet, Crosshair, ArrowLeftRight } from 'lucide-react';

interface GameHUDProps {
  score: number;
  wave: number;
  lives: number;
  combo: number;
}

export const GameHUD: React.FC<GameHUDProps> = ({ score, wave, lives, combo }) => {
  const waveNames = ['CLÁSSICA', 'XADREZ', 'PIRÂMIDE', 'FORTALEZA'];
  const wavePatternName = waveNames[(wave - 1) % waveNames.length];

  return (
    <div className="w-full flex items-center justify-between gap-2 bg-slate-950/90 border border-slate-800/80 px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl shadow-xl select-none backdrop-blur-md">
      {/* 1. Score & Combo */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div>
          <div className="text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-wider font-mono leading-none">
            SCORE
          </div>
          <div className="text-base sm:text-xl font-black font-mono tracking-tight text-emerald-400 tabular-nums leading-tight">
            {score.toLocaleString()}
          </div>
        </div>

        {combo > 0 && (
          <div className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/40 px-1.5 py-0.5 rounded-lg">
            <span className="text-[9px] sm:text-[10px] text-amber-300 font-black font-mono">
              x{getComboMultiplier(combo).toFixed(1)}
            </span>
            <span className="text-[8px] sm:text-[9px] text-amber-400/80 font-mono hidden xs:inline">
              {combo}x
            </span>
          </div>
        )}
      </div>

      {/* 2. Wave Level */}
      <div className="flex flex-col items-center justify-center text-center px-1">
        <div className="flex items-center gap-1.5 leading-none">
          <span className="text-[8px] sm:text-[9px] text-slate-400 font-bold uppercase tracking-widest font-mono">
            ONDA
          </span>
          <span className="text-sm sm:text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 font-mono tabular-nums">
            {wave}
          </span>
        </div>
        <span className="text-[7px] sm:text-[8px] text-cyan-400/70 font-mono tracking-wider mt-0.5 uppercase hidden sm:block">
          {wavePatternName}
        </span>
      </div>

      {/* 3. Lives Counter */}
      <div className="flex items-center gap-1.5">
        <span className="text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-widest font-mono hidden xs:inline">
          VIDAS
        </span>
        <div className="flex items-center gap-1">
          {Array.from({ length: 3 }).map((_, idx) => {
            const hasLife = idx < lives;
            return (
              <span
                key={idx}
                className={`text-xs sm:text-sm transition-all duration-300 ${
                  hasLife ? 'opacity-100 scale-100 drop-shadow-[0_0_6px_rgba(239,68,68,0.7)]' : 'opacity-20 grayscale scale-75'
                }`}
              >
                ❤️
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface PowerUpTimersProps {
  activePowerUps: ActivePowerUp[];
}

export const PowerUpTimers: React.FC<PowerUpTimersProps> = ({ activePowerUps }) => {
  if (activePowerUps.length === 0) return null;

  const getPowerUpConfig = (type: string) => {
    switch (type) {
      case 'wide':
        return { label: 'Raquete Ampla', color: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/40', icon: ArrowLeftRight };
      case 'narrow':
        return { label: 'Raquete Estreita', color: 'bg-red-500', text: 'text-red-400', border: 'border-red-500/40', icon: Shield };
      case 'fireball':
        return { label: 'Bola de Fogo', color: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500/40', icon: Flame };
      case 'slow':
        return { label: 'Bola Lenta', color: 'bg-yellow-500', text: 'text-yellow-400', border: 'border-yellow-500/40', icon: Gauge };
      case 'sticky':
        return { label: 'Raquete Imã', color: 'bg-indigo-500', text: 'text-indigo-400', border: 'border-indigo-500/40', icon: Magnet };
      case 'laser':
        return { label: 'Canhões Laser', color: 'bg-pink-500', text: 'text-pink-400', border: 'border-pink-500/40', icon: Crosshair };
      default:
        return { label: 'Power-Up', color: 'bg-cyan-500', text: 'text-cyan-400', border: 'border-cyan-500/40', icon: Zap };
    }
  };

  return (
    <div className="w-full flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 px-1 py-1">
      {activePowerUps.map((p) => {
        const config = getPowerUpConfig(p.type);
        const Icon = config.icon;
        const percentage = Math.max(0, Math.min(100, (p.timeLeft / p.maxDuration) * 100));

        return (
          <div
            key={p.type}
            className={`flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/90 border ${config.border} rounded-xl shadow-md backdrop-blur-sm transition-all`}
          >
            <Icon size={12} className={config.text} />
            <span className={`text-[10px] sm:text-xs font-bold font-mono ${config.text}`}>
              {config.label}
            </span>
            <span className="text-[10px] font-mono font-bold text-slate-300 tabular-nums">
              {p.timeLeft}s
            </span>
            <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden ml-1">
              <div
                className={`h-full ${config.color} transition-all duration-300`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
