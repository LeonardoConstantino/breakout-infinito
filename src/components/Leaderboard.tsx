/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Trophy, Calendar, Zap, RefreshCw, BarChart2, Star, ShieldAlert } from 'lucide-react';
import { HighScore, GameStats } from '../types';

interface LeaderboardProps {
  onClose?: () => void;
  highlightLatestScore?: number;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ onClose, highlightLatestScore }) => {
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [lifetimeStats, setLifetimeStats] = useState<GameStats | null>(null);

  useEffect(() => {
    // Load high scores
    try {
      const stored = localStorage.getItem('breakout_infinito_high_scores');
      if (stored) {
        setHighScores(JSON.parse(stored));
      } else {
        // Seeding mock high scores to make the arcade feel authentic on first launch!
        const defaultScores: HighScore[] = [
          { name: 'KOS', score: 18450, wave: 9, maxCombo: 24, date: '14/07/2026', grade: 'S' },
          { name: 'ARC', score: 12100, wave: 6, maxCombo: 16, date: '13/07/2026', grade: 'A' },
          { name: 'N00B', score: 3200, wave: 2, maxCombo: 4, date: '12/07/2026', grade: 'C' }
        ];
        localStorage.setItem('breakout_infinito_high_scores', JSON.stringify(defaultScores));
        setHighScores(defaultScores);
      }

      // Load lifetime stats
      const storedStats = localStorage.getItem('breakout_infinito_lifetime_stats');
      if (storedStats) {
        setLifetimeStats(JSON.parse(storedStats));
      }
    } catch (e) {
      console.error("Failed to access localStorage:", e);
    }
  }, []);

  const clearLeaderboard = () => {
    if (confirm("Tem certeza que deseja zerar o placar de líderes e estatísticas? Isso não pode ser desfeito!")) {
      try {
        localStorage.removeItem('breakout_infinito_high_scores');
        localStorage.removeItem('breakout_infinito_lifetime_stats');
        setHighScores([]);
        setLifetimeStats(null);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'S': return 'text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300 font-black drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]';
      case 'A': return 'text-red-400 font-extrabold';
      case 'B': return 'text-indigo-400 font-bold';
      case 'C': return 'text-slate-400 font-semibold';
      default: return 'text-white';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 text-slate-200 h-full flex flex-col font-sans">
      
      {/* Tab Header */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Trophy className="text-amber-400" size={20} />
          <h3 className="text-lg font-bold text-white tracking-tight">HALL DA FAMA</h3>
        </div>
        <button
          onClick={clearLeaderboard}
          className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1 transition-all duration-200 cursor-pointer p-1.5 hover:bg-slate-800 rounded"
          title="Zerar Placar"
        >
          <RefreshCw size={12} />
          <span>Reset</span>
        </button>
      </div>

      {/* High Scores List */}
      <div className="flex-1 overflow-y-auto max-h-[320px] pr-1 space-y-2 mb-6 scrollbar-thin">
        {highScores.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs">
            Nenhuma pontuação registrada. Seja o primeiro!
          </div>
        ) : (
          highScores
            .sort((a, b) => b.score - a.score)
            .slice(0, 8)
            .map((score, index) => {
              const isFirst = index === 0;
              const isSecond = index === 1;
              const isThird = index === 2;
              const isHighlighted = highlightLatestScore === score.score;

              return (
                <div
                  key={`${score.name}-${score.score}-${score.date}-${index}`}
                  className={`flex items-center justify-between p-2.5 rounded-lg border transition-all duration-300 ${
                    isHighlighted
                      ? 'bg-cyan-950/40 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.15)] scale-[1.01]'
                      : isFirst
                      ? 'bg-amber-500/10 border-amber-500/20'
                      : 'bg-slate-800/40 border-slate-800/80 hover:border-slate-700/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Rank Badge */}
                    <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                      isFirst ? 'bg-amber-400 text-slate-900 shadow-[0_0_8px_rgba(250,204,21,0.4)]' :
                      isSecond ? 'bg-slate-300 text-slate-900' :
                      isThird ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {index + 1}
                    </div>

                    {/* Name */}
                    <div>
                      <span className="font-mono font-bold text-white uppercase tracking-wider">{score.name}</span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-0.5 mt-0.5">
                        <Calendar size={8} /> {score.date}
                      </span>
                    </div>
                  </div>

                  {/* Score Info */}
                  <div className="text-right flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <span className="font-mono text-sm font-bold text-emerald-400">
                        {score.score.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Onda {score.wave} • Combo {score.maxCombo}
                      </span>
                    </div>
                    {/* Grade */}
                    <div className="w-8 flex justify-center text-lg font-black tracking-wider">
                      <span className={getGradeColor(score.grade)}>{score.grade}</span>
                    </div>
                  </div>
                </div>
              );
            })
        )}
      </div>

      {/* Lifetime Stats */}
      {lifetimeStats && (
        <div className="border-t border-slate-800 pt-4 mb-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
            <BarChart2 size={14} className="text-cyan-400" />
            <span>Estatísticas de Carreira</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-800/30 p-2 rounded border border-slate-800/40">
              <span className="text-slate-500 block">Total de Partidas</span>
              <span className="font-mono text-white font-bold">{lifetimeStats.ballsLost || 0}</span>
            </div>
            <div className="bg-slate-800/30 p-2 rounded border border-slate-800/40">
              <span className="text-slate-500 block">Blocos Destruídos</span>
              <span className="font-mono text-white font-bold text-cyan-400">{lifetimeStats.bricksDestroyed.toLocaleString()}</span>
            </div>
            <div className="bg-slate-800/30 p-2 rounded border border-slate-800/40">
              <span className="text-slate-500 block">Máximo Combo</span>
              <span className="font-mono text-white font-bold text-pink-400">{lifetimeStats.maxCombo}</span>
            </div>
            <div className="bg-slate-800/30 p-2 rounded border border-slate-800/40">
              <span className="text-slate-500 block">Onda Mais Alta</span>
              <span className="font-mono text-white font-bold text-amber-400">{lifetimeStats.wave}</span>
            </div>
          </div>
        </div>
      )}

      {/* Grading Help */}
      <div className="mt-auto bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-[11px] text-slate-400">
        <span className="font-bold text-slate-300 block mb-1 flex items-center gap-1">
          <Star size={11} className="text-amber-400" /> Sistema de Notas (S a C)
        </span>
        As notas dependem da agressividade e sobrevivência:
        <ul className="list-disc pl-3.5 mt-1 space-y-0.5 font-mono text-[10px]">
          <li><b className="text-yellow-400">S:</b> 15k+ pontos total ou média de 2.5k por onda.</li>
          <li><b className="text-red-400">A:</b> 8k+ pontos total ou média de 1.8k por onda.</li>
          <li><b className="text-indigo-400">B:</b> 4k+ pontos.</li>
          <li><b className="text-slate-400">C:</b> Menos de 4k pontos.</li>
        </ul>
      </div>
    </div>
  );
};
export default Leaderboard;
