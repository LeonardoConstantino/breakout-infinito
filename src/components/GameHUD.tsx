/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ActivePowerUp } from '../types';
import { getComboMultiplier } from '../utils/gameConstants';

interface GameHUDProps {
  score: number;
  wave: number;
  lives: number;
  combo: number;
}

export const GameHUD: React.FC<GameHUDProps> = ({ score, wave, lives, combo }) => {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4 select-none font-sans w-full bg-slate-950/80 border border-slate-900 p-3 rounded-2xl shadow-xl">
      {/* Score & Combo HUD */}
      <div className="flex flex-col justify-center items-start">
        <div className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">PONTUAÇÃO</div>
        <div className="text-base sm:text-xl font-black font-mono tracking-tight text-emerald-400">
          {score.toLocaleString()}
        </div>
        {combo > 0 && (
          <div className="flex items-center gap-1 mt-0.5 animate-bounce">
            <span className="text-[8px] sm:text-[10px] bg-amber-500 text-slate-950 px-1 py-0.2 rounded font-black font-mono">
              x{getComboMultiplier(combo).toFixed(1)}
            </span>
            <span className="text-[10px] sm:text-xs font-mono font-bold text-amber-400">
              {combo} hits
            </span>
          </div>
        )}
      </div>

      {/* Level / Wave info */}
      <div className="flex flex-col items-center justify-center text-center">
        <span className="text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-widest font-mono">ONDA ATUAL</span>
        <span className="text-sm sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 font-mono">
          {wave}
        </span>
        <span className="text-[7px] sm:text-[9px] text-cyan-400/80 mt-0.5 uppercase tracking-wide font-mono line-clamp-1">
          {['GRADE CLÁSSICA', 'TABULEIRO XADREZ', 'GRADE PIRÂMIDE', 'FORTALEZA BLINDADA'][(wave - 1) % 4]}
        </span>
      </div>

      {/* Hearts / Lives Counter */}
      <div className="flex flex-col justify-center items-end">
        <div className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">VIDAS</div>
        <div className="flex gap-1 mt-1">
          {Array.from({ length: 3 }).map((_, idx) => (
            <span
              key={idx}
              className={`text-sm sm:text-base transition-transform duration-300 ${
                idx < lives ? 'text-red-500 scale-100' : 'text-slate-800 scale-75'
              }`}
            >
              ❤️
            </span>
          ))}
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

  return (
    <div className="absolute bottom-4 left-4 flex flex-col gap-2 max-w-[200px] bg-slate-900/95 border border-slate-800/80 p-2 rounded-xl pointer-events-none shadow-lg z-10">
      {activePowerUps.map((p) => {
        const percentage = (p.timeLeft / p.maxDuration) * 100;
        return (
          <div key={p.type} className="flex flex-col gap-0.5">
            <div className="flex justify-between items-center text-[9px] font-bold text-slate-300 font-mono uppercase">
              <span>
                {p.type === 'wide'
                  ? 'Raquete Ampla'
                  : p.type === 'narrow'
                  ? 'Raquete Encolhida'
                  : p.type === 'fireball'
                  ? 'Bola de Fogo'
                  : p.type === 'slow'
                  ? 'Bola Lenta'
                  : p.type === 'sticky'
                  ? 'Raquete Imã'
                  : 'Canhão Laser'}
              </span>
              <span className="text-cyan-400">{p.timeLeft}s</span>
            </div>
            <div className="w-32 h-1.5 bg-slate-950 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  p.type === 'narrow' ? 'bg-red-500' : 'bg-cyan-400'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
