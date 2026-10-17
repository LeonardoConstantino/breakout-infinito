/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, Volume2, VolumeX, HelpCircle, Trophy, Sparkles, Gamepad2, PlayCircle, Pause, LogOut, Star } from 'lucide-react';
import { GameCanvas } from './components/GameCanvas';
import { Leaderboard } from './components/Leaderboard';
import { Instructions } from './components/Instructions';
import { GameStats, HighScore } from './types';
import { audio } from './components/AudioEngine';

export default function App() {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [playerName, setPlayerName] = useState<string>('PILOTO');
  const [currentStats, setCurrentStats] = useState<GameStats | null>(null);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState<boolean>(false);
  const [gameResetToken, setGameResetToken] = useState<number>(0);
  const [latestGrade, setLatestGrade] = useState<string>('C');
  const [latestScore, setLatestScore] = useState<number>(0);

  // Load username from localStorage if preset
  useEffect(() => {
    try {
      const savedName = localStorage.getItem('breakout_infinito_player_name');
      if (savedName) {
        setPlayerName(savedName);
      }
    } catch (e) {
      console.warn("Storage access failed:", e);
    }
  }, []);

  // Sync sounds with state
  useEffect(() => {
    audio.enabled = soundEnabled;
  }, [soundEnabled]);

  // Handle Nickname formatting (retro 6-letters max, uppercase)
  const handleNameChange = (val: string) => {
    const formatted = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setPlayerName(formatted);
    try {
      localStorage.setItem('breakout_infinito_player_name', formatted);
    } catch (e) {
      console.error(e);
    }
  };

  // Grade calculator based on user's score-to-wave ratios and totals
  const calculateGrade = (score: number, wave: number): string => {
    if (score >= 15000 || (score / wave >= 2500 && wave >= 4)) {
      return 'S';
    }
    if (score >= 8000 || (score / wave >= 1800 && wave >= 3)) {
      return 'A';
    }
    if (score >= 4000 || (score / wave >= 1000)) {
      return 'B';
    }
    return 'C';
  };

  // Start the game loop
  const handleStartGame = () => {
    setIsPaused(false);
    setGameState('playing');
    setGameResetToken((prev) => prev + 1);
  };

  // Triggered when all balls fall and lives drop to 0
  const handleGameOver = (finalStats: GameStats) => {
    setLatestScore(finalStats.score);
    const grade = calculateGrade(finalStats.score, finalStats.wave);
    setLatestGrade(grade);
    setCurrentStats(finalStats);

    // Save Score to high scores list
    try {
      const stored = localStorage.getItem('breakout_infinito_high_scores');
      let highScores: HighScore[] = stored ? JSON.parse(stored) : [];

      const today = new Date();
      const dateStr = today.toLocaleDateString('pt-BR');

      const newScoreEntry: HighScore = {
        name: playerName || 'PILOTO',
        score: finalStats.score,
        wave: finalStats.wave,
        maxCombo: finalStats.maxCombo,
        date: dateStr,
        grade,
      };

      highScores.push(newScoreEntry);
      // Sort and keep top 10
      highScores.sort((a, b) => b.score - a.score);
      highScores = highScores.slice(0, 10);

      localStorage.setItem('breakout_infinito_high_scores', JSON.stringify(highScores));

      // Update Lifetime aggregate career statistics
      const storedStats = localStorage.getItem('breakout_infinito_lifetime_stats');
      let lifetime: GameStats;

      if (storedStats) {
        const parsed = JSON.parse(storedStats) as GameStats;
        lifetime = {
          score: Math.max(parsed.score, finalStats.score),
          wave: Math.max(parsed.wave, finalStats.wave),
          maxCombo: Math.max(parsed.maxCombo, finalStats.maxCombo),
          bricksDestroyed: parsed.bricksDestroyed + finalStats.bricksDestroyed,
          timeSurvived: parsed.timeSurvived + finalStats.timeSurvived,
          normalDestroyed: parsed.normalDestroyed + finalStats.normalDestroyed,
          armoredDestroyed: parsed.armoredDestroyed + finalStats.armoredDestroyed,
          explosiveDestroyed: parsed.explosiveDestroyed + finalStats.explosiveDestroyed,
          powerUpsCollected: parsed.powerUpsCollected + finalStats.powerUpsCollected,
          ballsLost: (parsed.ballsLost || 0) + 1, // acts as match counter
        };
      } else {
        lifetime = {
          ...finalStats,
          ballsLost: 1, // first match
        };
      }

      localStorage.setItem('breakout_infinito_lifetime_stats', JSON.stringify(lifetime));
    } catch (e) {
      console.error("Failed to save high scores / statistics:", e);
    }

    setGameState('gameover');
  };

  const handleStatsUpdate = (stats: GameStats) => {
    setCurrentStats(stats);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      
      {/* Top Header */}
      <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-cyan-500 to-indigo-500 rounded-xl shadow-lg shadow-cyan-500/20">
            <Gamepad2 className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
              BREAKOUT INFINITO
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">SOBREVIVÊNCIA NEON</p>
          </div>
        </div>

        {/* Toolbar controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            title={soundEnabled ? "Mudar para Mudo" : "Ativar Som"}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          
          <button
            onClick={() => setIsInstructionsOpen(true)}
            className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
          >
            <HelpCircle size={18} />
            <span className="hidden sm:inline">Como Jogar</span>
          </button>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className={`flex-1 max-w-7xl w-full mx-auto ${gameState === 'playing' ? 'p-1 sm:p-4' : 'p-2 sm:p-4 md:p-6 lg:p-8'} grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6 items-start`}>
        
        {/* Game viewport column */}
        <div className="lg:col-span-8 flex flex-col gap-2 sm:gap-4">
          <AnimatePresence mode="wait">
            
            {/* 1. MENU STATE */}
            {gameState === 'menu' && (
              <motion.div
                key="menu-screen"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="bg-slate-950/60 border border-slate-900 rounded-3xl p-6 md:p-10 text-center flex flex-col items-center justify-center min-h-[480px] shadow-2xl relative overflow-hidden"
              >
                {/* Background ambient lighting blobs */}
                <div className="absolute top-0 left-1/4 w-72 h-72 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

                <div className="mb-4">
                  <span className="px-3 py-1 bg-cyan-950/60 text-cyan-400 border border-cyan-800/80 rounded-full text-xs font-mono tracking-widest uppercase">
                    MODERNO • VICIANTE • SEM FIM
                  </span>
                </div>

                <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-3">
                  Destrua Blocos. <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-500">
                    Supere Limites.
                  </span>
                </h2>
                
                <p className="text-slate-400 max-w-md text-sm md:text-base mb-8 leading-relaxed">
                  O clássico arcade transformado em uma corrida infinita por sobrevivência. Ondas de blocos explosivos, combos multiplicadores e powerups caóticos aguardam seu comando.
                </p>

                {/* Username panel */}
                <div className="w-full max-w-xs bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl mb-8">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">
                    APELIDO NO PLACAR (MÁX 6 LETRAS)
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="PLAYER"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-center text-xl font-mono font-bold text-cyan-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all uppercase"
                  />
                </div>

                {/* Action Button */}
                <button
                  onClick={handleStartGame}
                  className="group px-8 py-4 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 hover:from-cyan-600 hover:via-indigo-600 hover:to-purple-600 text-white font-bold text-lg rounded-2xl tracking-wide transition-all duration-300 shadow-xl shadow-indigo-500/10 hover:shadow-indigo-500/25 hover:scale-[1.03] active:scale-[0.98] cursor-pointer flex items-center gap-2"
                >
                  <PlayCircle size={22} className="animate-pulse" />
                  <span>DECOLAR PARTIDA</span>
                </button>

                {/* Secondary guide triggers */}
                <div className="mt-8 flex gap-6 text-xs text-slate-500 font-mono">
                  <span>🎮 TECLADO / MOUSE / TOUCH</span>
                  <span>•</span>
                  <button
                    onClick={() => setIsInstructionsOpen(true)}
                    className="text-cyan-400 hover:underline cursor-pointer"
                  >
                    VER GUIA COMPLETO
                  </button>
                </div>
              </motion.div>
            )}

            {/* 2. PLAYING STATE */}
            {gameState === 'playing' && (
              <motion.div
                key="playing-screen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-2 sm:gap-3"
              >
                {/* Active Match Toolbar */}
                <div className="flex items-center justify-between bg-slate-950/70 border border-slate-900/80 px-3 py-1.5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                    <span className="text-[10px] sm:text-xs font-mono text-slate-400 font-semibold tracking-wider">
                      SOBREVIVÊNCIA
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      onClick={() => setIsPaused(!isPaused)}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-[11px] font-bold text-slate-300 hover:text-white rounded-lg border border-slate-800 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Pause size={11} />
                      <span>{isPaused ? "Retomar" : "Pausar"}</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        if (confirm("Tem certeza que deseja desistir desta partida? Seu progresso atual não será registrado.")) {
                          setGameState('menu');
                        }
                      }}
                      className="px-2.5 py-1 bg-red-950/40 hover:bg-red-950/80 text-[11px] font-bold text-red-400 hover:text-red-300 rounded-lg border border-red-900/40 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <LogOut size={11} />
                      <span>Sair</span>
                    </button>
                  </div>
                </div>

                {/* Active Interactive Canvas */}
                <GameCanvas
                  isPlaying={gameState === 'playing'}
                  isPaused={isPaused}
                  onGameOver={handleGameOver}
                  onStatsUpdate={handleStatsUpdate}
                  soundEnabled={soundEnabled}
                  gameResetToken={gameResetToken}
                />

                {/* Quick Pause overlay modal */}
                {isPaused && (
                  <div className="absolute inset-x-4 top-24 bottom-4 z-30 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm rounded-2xl border border-slate-800">
                    <h3 className="text-3xl font-black text-white tracking-tight mb-2">JOGO PAUSADO</h3>
                    <p className="text-slate-400 text-sm max-w-xs text-center mb-6">
                      A velocidade da bola e seu combo multiplicador foram congelados. Retome quando estiver pronto para continuar a destruir blocos!
                    </p>
                    <button
                      onClick={() => setIsPaused(false)}
                      className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20 hover:scale-105 cursor-pointer"
                    >
                      RETOMAR BATALHA
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* 3. GAMEOVER SCOREBOARD STATE */}
            {gameState === 'gameover' && currentStats && (
              <motion.div
                key="gameover-screen"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', damping: 20 }}
                className="bg-slate-950/80 border border-slate-900 rounded-3xl p-6 md:p-10 text-center flex flex-col items-center shadow-2xl relative overflow-hidden"
              >
                {/* Background glow vignette */}
                <div className="absolute inset-0 bg-radial-gradient from-indigo-900/10 to-transparent pointer-events-none"></div>

                <div className="mb-4">
                  <span className="px-3.5 py-1 bg-red-950/60 text-red-400 border border-red-800/80 rounded-full text-xs font-mono font-bold tracking-widest uppercase">
                    PARTIDA CONCLUÍDA
                  </span>
                </div>

                {/* Score Big Display */}
                <h3 className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-1">PONTUAÇÃO ALCANÇADA</h3>
                <div className="text-4xl md:text-5xl font-black tracking-tight text-emerald-400 font-mono mb-4">
                  {currentStats.score.toLocaleString()}
                </div>

                {/* Score Grade Badge Card */}
                <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl w-full max-w-sm mb-6 flex items-center justify-around">
                  <div className="text-left">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Onda Final</span>
                    <span className="text-xl font-extrabold text-white font-mono">Onda {currentStats.wave}</span>
                  </div>
                  <div className="h-10 w-[1px] bg-slate-800"></div>
                  <div className="text-center">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">Grade</span>
                    <div className="relative">
                      <span className={`text-4xl font-black font-sans tracking-wider ${
                        latestGrade === 'S' ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300 drop-shadow-[0_0_15px_rgba(251,191,36,0.6)] font-black' :
                        latestGrade === 'A' ? 'text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.4)]' :
                        latestGrade === 'B' ? 'text-indigo-400' : 'text-slate-400'
                      }`}>
                        {latestGrade}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stat Breakdown Grid */}
                <div className="w-full max-w-md grid grid-cols-2 gap-3 mb-8">
                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-900 flex flex-col items-center">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Tempo Sobrevivido</span>
                    <span className="font-mono text-sm font-bold text-slate-300">
                      {Math.floor(currentStats.timeSurvived / 60)}m {currentStats.timeSurvived % 60}s
                    </span>
                  </div>
                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-900 flex flex-col items-center">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-0.5">Combo Máximo</span>
                    <span className="font-mono text-sm font-bold text-pink-400">{currentStats.maxCombo} hits</span>
                  </div>
                  <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-900 flex flex-col items-center col-span-2">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">Blocos Destruídos</span>
                    <div className="grid grid-cols-3 gap-3 w-full text-xs font-mono">
                      <div>
                        <span className="text-emerald-400 font-bold block">{currentStats.normalDestroyed}</span>
                        <span className="text-[9px] text-slate-500">Normal</span>
                      </div>
                      <div>
                        <span className="text-cyan-400 font-bold block">{currentStats.armoredDestroyed}</span>
                        <span className="text-[9px] text-slate-500">Blindado</span>
                      </div>
                      <div>
                        <span className="text-orange-400 font-bold block">{currentStats.explosiveDestroyed}</span>
                        <span className="text-[9px] text-slate-500">Explosivo</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                  <button
                    onClick={handleStartGame}
                    className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-600 hover:to-indigo-600 text-slate-950 hover:text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw size={16} />
                    <span>REVANCHE INSTANTÂNEA</span>
                  </button>

                  <button
                    onClick={() => setGameState('menu')}
                    className="py-3 px-5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold rounded-xl border border-slate-800 transition-all cursor-pointer"
                  >
                    Menu Principal
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* High score and scoreboard column (stacked or sidebar) */}
        <div className={`lg:col-span-4 h-full ${gameState === 'playing' ? 'hidden lg:block' : 'block'}`}>
          <Leaderboard highlightLatestScore={latestScore} />
        </div>
      </main>

      {/* Popovers and modals */}
      <Instructions
        isOpen={isInstructionsOpen}
        onClose={() => setIsInstructionsOpen(false)}
      />

      {/* Humble credit footer */}
      <footer className="border-t border-slate-950 bg-slate-950/30 py-4 text-center text-xs text-slate-600 font-mono mt-auto">
        BREAKOUT INFINITO ARCADE ENGINE v1.2.0 • COMPILADO EM CANVAS PURO
      </footer>
    </div>
  );
}
