/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HelpCircle, X, Zap, Target, Flame, Shield, ArrowUp, ZapOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InstructionsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Instructions: React.FC<InstructionsProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 text-slate-100 shadow-2xl font-sans"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-full transition-all duration-200 cursor-pointer"
              aria-label="Fechar"
            >
              <X size={20} />
            </button>

            {/* Title */}
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-6">
              <HelpCircle className="text-cyan-400" size={28} />
              <h2 className="text-2xl font-bold font-sans tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
                Como Jogar & Segredos
              </h2>
            </div>

            {/* Content Section */}
            <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
              {/* Controls */}
              <div>
                <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-cyan-500 rounded-full"></span>
                  Controles Dinâmicos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-400">
                  <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-800/80">
                    <span className="font-semibold text-cyan-400 block mb-1">Mouse ou Touch</span>
                    Mova o cursor/toque para os lados para guiar o paddle. Clique na tela para lançar a bola ou disparar lasers!
                  </div>
                  <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-800/80">
                    <span className="font-semibold text-cyan-400 block mb-1">Teclado</span>
                    Use <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs text-slate-200">Seta Esquerda</kbd> e <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs text-slate-200">Seta Direita</kbd> ou <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs text-slate-200">A / D</kbd> para mover. <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-xs text-slate-200">Espaço</kbd> lança a bola ou atira!
                  </div>
                </div>
              </div>

              {/* Special Bricks */}
              <div>
                <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
                  Comportamento dos Blocos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-start gap-3 bg-slate-800/30 p-3 rounded-xl border border-slate-800/50">
                    <div className="w-6 h-4 bg-emerald-500 rounded mt-1 flex-shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                    <div>
                      <strong className="text-white block">Normal</strong>
                      Quebra com 1 acerto. Cores indicam pontuação padrão.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-800/30 p-3 rounded-xl border border-slate-800/50">
                    <div className="w-6 h-4 bg-slate-400 border border-slate-300 rounded mt-1 flex-shrink-0 relative overflow-hidden shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                      <div className="absolute inset-0 bg-gradient-to-tr from-slate-600 to-transparent"></div>
                    </div>
                    <div>
                      <strong className="text-white block">Armored (Blindado)</strong>
                      Exige 3 acertos. Muda de cor e racha visualmente a cada pancada.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-800/30 p-3 rounded-xl border border-slate-800/50">
                    <div className="w-6 h-4 bg-red-500 animate-pulse rounded mt-1 flex-shrink-0 shadow-[0_0_12px_rgba(239,68,68,0.7)] border border-yellow-400"></div>
                    <div>
                      <strong className="text-white block flex items-center gap-1">
                        Explosivo <span className="text-[10px] bg-red-950 text-red-400 px-1 rounded border border-red-800 font-mono">BOOM</span>
                      </strong>
                      Causa uma reação em cadeia de destruição ao explodir, limpando blocos próximos.
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-800/30 p-3 rounded-xl border border-slate-800/50">
                    <div className="w-6 h-4 bg-zinc-600 rounded mt-1 flex-shrink-0 border-2 border-zinc-500 shadow-inner"></div>
                    <div>
                      <strong className="text-white block">Indestrutível</strong>
                      Obstáculo eterno de ferro. Serve de ricochete estratégico em ondas avançadas.
                    </div>
                  </div>
                </div>
              </div>

              {/* Power-Ups */}
              <div>
                <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-pink-500 rounded-full"></span>
                  Os 7 Power-Ups do Caos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-3 bg-slate-800/20 p-2.5 rounded-lg">
                    <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/30"><ArrowUp size={16} className="rotate-90" /></div>
                    <div><span className="font-semibold text-emerald-400 block">Raquete Larga (Wide)</span>Aumenta o paddle para defesas tranquilas.</div>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-800/20 p-2.5 rounded-lg">
                    <div className="p-1.5 bg-red-500/10 text-red-400 rounded border border-red-500/30"><ArrowUp size={16} className="-rotate-90" /></div>
                    <div><span className="font-semibold text-red-400 block">Raquete Estreita (Narrow)</span>Encolhe o paddle! Um teste de reflexos absoluto.</div>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-800/20 p-2.5 rounded-lg">
                    <div className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded border border-cyan-500/30"><Zap size={16} /></div>
                    <div><span className="font-semibold text-cyan-400 block">Multi-Bola (Multi-ball)</span>Triplica as bolas na tela para o caos produtivo.</div>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-800/20 p-2.5 rounded-lg">
                    <div className="p-1.5 bg-orange-500/10 text-orange-400 rounded border border-orange-500/30"><Flame size={16} /></div>
                    <div><span className="font-semibold text-orange-400 block">Bola de Fogo (Fireball)</span>Atravessa e destrói tudo instantaneamente sem rebater.</div>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-800/20 p-2.5 rounded-lg">
                    <div className="p-1.5 bg-yellow-500/10 text-yellow-400 rounded border border-yellow-500/30"><Target size={16} /></div>
                    <div><span className="font-semibold text-yellow-400 block">Bola Lenta (Slow Ball)</span>Diminui o ritmo da bola para retomar o controle.</div>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-800/20 p-2.5 rounded-lg">
                    <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded border border-indigo-500/30"><Shield size={16} /></div>
                    <div><span className="font-semibold text-indigo-400 block">Raquete Aderente (Sticky)</span>Prende a bola no paddle para mira de precisão.</div>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-800/20 p-2.5 rounded-lg">
                    <div className="p-1.5 bg-pink-500/10 text-pink-400 rounded border border-pink-500/30"><ZapOff size={16} /></div>
                    <div><span className="font-semibold text-pink-400 block">Raquete Laser (Laser)</span>Permite disparar lasers destrutivos contra blocos!</div>
                  </div>
                </div>
              </div>

              {/* Score & Combo */}
              <div className="bg-gradient-to-r from-cyan-950/40 to-indigo-950/40 border border-cyan-500/20 rounded-xl p-4">
                <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                  🏆 Multiplicador & Combo
                </h4>
                <p className="text-slate-300">
                  Destrua blocos consecutivamente para manter o combo. Alcançar combos altos ativa multiplicadores generosos:
                  <span className="block mt-2 font-mono text-cyan-400">
                    Combo 5+ → 1.5× pontos | Combo 10+ → 2.0× pontos | Combo 15+ → 3.0× pontos!
                  </span>
                  Lembre-se: O tempo também te dá pontos! Sobreviver a cada segundo acumula score.
                </p>
              </div>
            </div>

            {/* Footer button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-600 hover:to-indigo-600 text-white font-semibold rounded-xl tracking-tight transition-all duration-200 cursor-pointer shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98]"
              >
                Entendido, Vamos Lá!
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
