/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Brick, Ball, Paddle, PowerUp, PowerUpType, Particle, Laser, ComboIndicator, GameStats, WavePattern, ActivePowerUp } from '../types';
import { audio } from './AudioEngine';
import { LOGICAL_WIDTH, LOGICAL_HEIGHT, getComboMultiplier } from '../utils/gameConstants';
import { generateWaveBricks } from '../utils/brickGenerator';
import { GameHUD, PowerUpTimers } from './GameHUD';

interface GameCanvasProps {
  isPlaying: boolean;
  isPaused: boolean;
  onGameOver: (finalStats: GameStats) => void;
  onStatsUpdate: (stats: GameStats) => void;
  soundEnabled: boolean;
  gameResetToken: number; // Incrementing this resets the game
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  isPlaying,
  isPaused,
  onGameOver,
  onStatsUpdate,
  soundEnabled,
  gameResetToken,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync sound settings with the AudioEngine
  useEffect(() => {
    audio.enabled = soundEnabled;
  }, [soundEnabled]);

  // Core Game State Refs to avoid re-renders during the high-speed canvas loop
  const stateRef = useRef({
    score: 0,
    wave: 1,
    lives: 3,
    maxCombo: 0,
    currentCombo: 0,
    bricksDestroyed: 0,
    timeSurvived: 0,
    normalDestroyed: 0,
    armoredDestroyed: 0,
    explosiveDestroyed: 0,
    powerUpsCollected: 0,
    ballsLost: 0,

    paddle: { x: 350, y: 550, width: 100, height: 16, speed: 8.5 } as Paddle,
    balls: [] as Ball[],
    bricks: [] as Brick[],
    powerUps: [] as PowerUp[],
    particles: [] as Particle[],
    lasers: [] as Laser[],
    comboIndicators: [] as ComboIndicator[],

    // Controls
    keysPressed: {} as Record<string, boolean>,
    mousePos: { x: 400, y: 0 },
    controlMode: 'mouse' as 'mouse' | 'keyboard',

    // Powerup durations (in frames or ms)
    activePowerUps: [] as ActivePowerUp[],

    // Visual juice
    screenShake: 0, // intensity of shake in pixels
    flashOpacity: 0, // full screen flash
    isFireballVignette: false,
    paddleTilt: 0,
    paddleFlash: 0,
    paddleScaleX: 1,
    paddleScaleY: 1,
    slowMotion: 1,
    slowMotionTimer: 0,
    powerUpVignetteColor: null as string | null,

    // Time keeping
    lastTime: 0,
    lastSecondTime: 0,
    isFirstLaunch: true,
    staticSeconds: 0,
  });

  // Export React-friendly list of active power-ups and stats for HUD
  const [hudStats, setHudStats] = useState({
    score: 0,
    wave: 1,
    lives: 3,
    combo: 0,
    activePowerUps: [] as ActivePowerUp[],
  });

  // Initialize/Reset Game when reset token changes or starting
  useEffect(() => {
    if (!isPlaying) return;

    const state = stateRef.current;
    state.score = 0;
    state.wave = 1;
    state.lives = 3;
    state.maxCombo = 0;
    state.currentCombo = 0;
    state.bricksDestroyed = 0;
    state.timeSurvived = 0;
    state.normalDestroyed = 0;
    state.armoredDestroyed = 0;
    state.explosiveDestroyed = 0;
    state.powerUpsCollected = 0;
    state.ballsLost = 0;

    state.paddle = { x: 350, y: 550, width: 100, height: 16, speed: 9 };
    state.balls = [];
    state.powerUps = [];
    state.particles = [];
    state.lasers = [];
    state.comboIndicators = [];
    state.activePowerUps = [];
    state.screenShake = 0;
    state.flashOpacity = 0;
    state.isFireballVignette = false;
    state.paddleTilt = 0;
    state.paddleFlash = 0;
    state.paddleScaleX = 1;
    state.paddleScaleY = 1;
    state.slowMotion = 1;
    state.slowMotionTimer = 0;
    state.powerUpVignetteColor = null;
    state.isFirstLaunch = true;
    state.controlMode = 'mouse';
    state.staticSeconds = 0;

    // Spawn first ball stuck to paddle
    spawnStickyBall();

    // Generate Bricks for Wave 1
    state.bricks = generateWaveBricks(1);

    // Update Hud State
    syncHudState();

    // Play start sound
    audio.playLaunch();
  }, [isPlaying, gameResetToken]);

  const syncHudState = () => {
    const state = stateRef.current;
    setHudStats({
      score: state.score,
      wave: state.wave,
      lives: state.lives,
      combo: state.currentCombo,
      activePowerUps: [...state.activePowerUps],
    });

    // Notify parent App component
    onStatsUpdate({
      score: state.score,
      wave: state.wave,
      maxCombo: state.maxCombo,
      bricksDestroyed: state.bricksDestroyed,
      timeSurvived: state.timeSurvived,
      normalDestroyed: state.normalDestroyed,
      armoredDestroyed: state.armoredDestroyed,
      explosiveDestroyed: state.explosiveDestroyed,
      powerUpsCollected: state.powerUpsCollected,
      ballsLost: state.ballsLost,
    });
  };

  const spawnStickyBall = () => {
    const state = stateRef.current;
    state.staticSeconds = 0; // Reset inactivity detection
    const baseSpeed = 4.5 + Math.min(3, state.wave * 0.25); // Ball speed scales with wave
    const id = Math.random().toString();
    state.balls.push({
      id,
      x: state.paddle.x + state.paddle.width / 2,
      y: state.paddle.y - 10,
      radius: 8,
      vx: 0,
      vy: 0,
      speed: baseSpeed,
      isFireball: false,
      stickyToPaddle: true,
      stickyOffset: 0,
    });
  };

  // Launch any sticky ball
  const launchBalls = () => {
    const state = stateRef.current;
    let launchedAny = false;

    state.balls.forEach((ball) => {
      if (ball.stickyToPaddle) {
        ball.stickyToPaddle = false;
        // Launch at an angle slightly offset from vertical to add dynamics
        const angle = (Math.random() * 0.4 - 0.2) * Math.PI; // -36 to +36 degrees
        ball.vx = ball.speed * Math.sin(angle);
        ball.vy = -ball.speed * Math.cos(angle);
        launchedAny = true;
      }
    });

    if (launchedAny) {
      audio.playLaunch();
      state.isFirstLaunch = false;
    }
  };

  // Set Up Controls & Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = stateRef.current;
      state.keysPressed[e.key] = true;

      // Switch to keyboard control mode when paddle movement keys are pressed
      if (['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'].includes(e.key)) {
        state.controlMode = 'keyboard';
      }

      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
        launchBalls();
        // Fire lasers if active!
        if (state.activePowerUps.some((p) => p.type === 'laser')) {
          fireLasers();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      stateRef.current.keysPressed[e.key] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      // Map mouse position correctly considering CSS scaling
      const relativeX = ((e.clientX - rect.left) / rect.width) * LOGICAL_WIDTH;
      const relativeY = ((e.clientY - rect.top) / rect.height) * LOGICAL_HEIGHT;

      const state = stateRef.current;
      state.mousePos = { x: relativeX, y: relativeY };
      state.controlMode = 'mouse';
    };

    let lastTouchX = 0;
    let isDragging = false;
    let touchStartX = 0;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];
      lastTouchX = touch.clientX;
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      isDragging = true;
      
      const state = stateRef.current;
      state.controlMode = 'mouse';
    };

    const handleTouchMove = (e: TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas || !isDragging || e.touches.length === 0) return;
      
      const touch = e.touches[0];
      const deltaX = touch.clientX - lastTouchX;
      lastTouchX = touch.clientX;
      
      const rect = canvas.getBoundingClientRect();
      const logicalDeltaX = (deltaX / rect.width) * LOGICAL_WIDTH;
      
      const state = stateRef.current;
      state.paddle.x += logicalDeltaX;
      state.mousePos.x = state.paddle.x + state.paddle.width / 2;
      state.controlMode = 'mouse';
    };

    const handleTouchEnd = (e: TouchEvent) => {
      isDragging = false;
      const touch = e.changedTouches[0];
      if (touch) {
        const dx = touch.clientX - touchStartX;
        const dy = touch.clientY - touchStartY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 10) {
          launchBalls();
          const state = stateRef.current;
          if (state.activePowerUps.some((p) => p.type === 'laser')) {
            fireLasers();
          }
        }
      }
    };

    const handleCanvasClick = (e: MouseEvent) => {
      e.preventDefault();
      launchBalls();
      const state = stateRef.current;
      if (state.activePowerUps.some((p) => p.type === 'laser')) {
        fireLasers();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
      canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
      canvas.addEventListener('touchend', handleTouchEnd, { passive: true });
      canvas.addEventListener('mousedown', handleCanvasClick);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
        canvas.removeEventListener('mousedown', handleCanvasClick);
      }
    };
  }, [isPlaying]);

  const fireLasers = () => {
    const state = stateRef.current;
    // Debounce/limit laser firing rate (e.g., max 1 shot per 18 frames)
    const activeLaserPowerUp = state.activePowerUps.find((p) => p.type === 'laser');
    if (!activeLaserPowerUp) return;

    // Spawn two laser beams from the ends of the paddle
    const laserLeftX = state.paddle.x + 5;
    const laserRightX = state.paddle.x + state.paddle.width - 11;
    const laserY = state.paddle.y - 12;

    state.lasers.push({
      id: Math.random().toString(),
      x: laserLeftX,
      y: laserY,
      vy: -8,
      width: 6,
      height: 16,
      color: '#f43f5e',
    });

    state.lasers.push({
      id: Math.random().toString(),
      x: laserRightX,
      y: laserY,
      vy: -8,
      width: 6,
      height: 16,
      color: '#f43f5e',
    });

    audio.playLaserShot();
  };

  // Brick Explosion Chain Reactions
  const triggerBrickExplosion = (brick: Brick) => {
    const state = stateRef.current;
    state.screenShake = Math.max(state.screenShake, 14);
    state.flashOpacity = 0.35;

    // Spawn a burst of golden-orange particles
    spawnParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, '#f97316', 22);

    // Blast radius: 105 pixels (covers roughly adjacent bricks)
    const radius = 105;
    const brickCenterX = brick.x + brick.width / 2;
    const brickCenterY = brick.y + brick.height / 2;

    // Copy array to prevent index shifting while editing during loops
    const candidateBricks = [...state.bricks];

    candidateBricks.forEach((other) => {
      if (other.id === brick.id || other.type === 'indestructible') return;

      const otherCenterX = other.x + other.width / 2;
      const otherCenterY = other.y + other.height / 2;
      const dx = otherCenterX - brickCenterX;
      const dy = otherCenterY - brickCenterY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= radius) {
        // Damage brick by 1 point (or destroy normal/explosives instantly)
        other.hp -= 1;
        
        if (other.hp <= 0) {
          // Remove from main bricks array
          state.bricks = state.bricks.filter((b) => b.id !== other.id);
          
          // Track statistics
          state.bricksDestroyed += 1;
          if (other.type === 'normal') state.normalDestroyed += 1;
          if (other.type === 'armored') state.armoredDestroyed += 1;

          // Points based on combo
          const basePoints = other.points;
          const comboMult = getComboMultiplier(state.currentCombo);
          state.score += Math.floor(basePoints * comboMult);
          state.currentCombo += 1;
          if (state.currentCombo > state.maxCombo) {
            state.maxCombo = state.currentCombo;
          }

          // Trigger chain explosion if another explosive was hit!
          if (other.type === 'explosive') {
            state.explosiveDestroyed += 1;
            // Delay slightly to create an incredible rolling ripple domino effect
            setTimeout(() => {
              if (isPlaying && !isPaused) {
                triggerBrickExplosion(other);
              }
            }, 100);
          } else {
            // Spawn normal death particles for chained brick
            spawnParticles(other.x + other.width / 2, other.y + other.height / 2, other.color, 10);
            rollPowerUpChance(other);
          }
        } else {
          // Update colors or textures for armored bricks as they crack
          if (other.type === 'armored') {
            if (other.hp === 2) other.color = '#64748b'; // Cracked steel
            if (other.hp === 1) other.color = '#475569'; // Heavily cracked steel
          }
          spawnParticles(otherCenterX, otherCenterY, other.color, 4);
        }
      }
    });

    audio.playBrickHit('explosive', true);
  };

  // Helper to spawn visual explosion fragments
  const spawnParticles = (x: number, y: number, color: string, count: number) => {
    const state = stateRef.current;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4.5;
      state.particles.push({
        id: Math.random().toString(),
        x,
        y,
        vx: speed * Math.cos(angle),
        vy: speed * Math.sin(angle) - 1.2, // slight upward bias
        size: 2 + Math.random() * 4,
        color,
        alpha: 1,
        decay: 0.015 + Math.random() * 0.02,
        gravity: 0.12,
        shape: Math.random() < 0.6 ? 'square' : 'circle',
      });
    }
  };

  const addComboIndicator = (x: number, y: number, points: number, combo: number) => {
    const state = stateRef.current;
    const mult = getComboMultiplier(combo);
    let text = `+${points}`;
    let color = '#38bdf8'; // light cyan

    if (mult > 1) {
      text = `+${points} Combo x${mult}!`;
      color = mult === 1.5 ? '#10b981' : mult === 2.0 ? '#a855f7' : '#fbbf24';
    }

    state.comboIndicators.push({
      id: Math.random().toString(),
      x,
      y,
      text,
      color,
      alpha: 1,
      scale: mult > 1 ? 1.25 : 1.0,
    });
  };

  const addTextIndicator = (x: number, y: number, text: string, color: string = '#38bdf8', scale: number = 1.0) => {
    const state = stateRef.current;
    state.comboIndicators.push({
      id: Math.random().toString(),
      x,
      y,
      text,
      color,
      alpha: 1,
      scale,
    });
  };

  const startSlowMotion = (multiplier: number, durationMs: number) => {
    const state = stateRef.current;
    state.slowMotion = multiplier;
    state.slowMotionTimer = durationMs;
  };

  // Roll a random power-up drop
  const rollPowerUpChance = (brick: Brick) => {
    const state = stateRef.current;
    const spawnChance = 0.20; // 20% drop chance

    if (Math.random() < spawnChance) {
      const types: PowerUpType[] = ['wide', 'narrow', 'multiball', 'fireball', 'slow', 'sticky', 'laser'];
      // Weighing slightly towards positive power-ups
      const weighedTypes: PowerUpType[] = [
        'wide', 'wide',
        'narrow', // negative/hazard
        'multiball', 'multiball',
        'fireball',
        'slow', 'slow',
        'sticky',
        'laser', 'laser'
      ];
      const type = weighedTypes[Math.floor(Math.random() * weighedTypes.length)];

      let color = '#10b981'; // Green (Wide, Multi-ball)
      let label = 'POWERUP';

      switch (type) {
        case 'wide':
          color = '#10b981'; // Green
          label = 'AMPLIAR raquete';
          break;
        case 'narrow':
          color = '#ef4444'; // Red
          label = 'ENCURTAR raquete';
          break;
        case 'multiball':
          color = '#06b6d4'; // Cyan
          label = 'MULTI-BOLA';
          break;
        case 'fireball':
          color = '#f97316'; // Orange
          label = 'BOLA DE FOGO';
          break;
        case 'slow':
          color = '#eab308'; // Yellow
          label = 'BOLA LENTA';
          break;
        case 'sticky':
          color = '#6366f1'; // Indigo
          label = 'IMÃ ADERENTE';
          break;
        case 'laser':
          color = '#ec4899'; // Pink
          label = 'LASER CANHÃO';
          break;
      }

      state.powerUps.push({
        id: Math.random().toString(),
        x: brick.x + brick.width / 2 - 30,
        y: brick.y + brick.height,
        width: 60,
        height: 18,
        vy: 2.2,
        type,
        color,
        label,
      });
    }
  };

  // Trigger Power-Up Activation
  const collectPowerUp = (powerUp: PowerUp) => {
    const state = stateRef.current;
    const isGood = powerUp.type !== 'narrow';
    audio.playPowerUp(isGood);

    state.powerUpsCollected += 1;

    // Handle Multi-ball instant trigger
    if (powerUp.type === 'multiball') {
      const originalBalls = [...state.balls];
      
      // If there are no balls (safety), spawn one
      if (originalBalls.length === 0) {
        spawnStickyBall();
        state.balls[0].stickyToPaddle = false;
        state.balls[0].vx = 2;
        state.balls[0].vy = -4;
      } else {
        // Double each ball!
        originalBalls.forEach((ball) => {
          if (ball.stickyToPaddle) return;

          // Split ball 1
          const b1Vx = ball.vx * Math.cos(0.2) - ball.vy * Math.sin(0.2);
          const b1Vy = ball.vx * Math.sin(0.2) + ball.vy * Math.cos(0.2);
          
          // Split ball 2
          const b2Vx = ball.vx * Math.cos(-0.2) - ball.vy * Math.sin(-0.2);
          const b2Vy = ball.vx * Math.sin(-0.2) + ball.vy * Math.cos(-0.2);

          state.balls.push({
            id: Math.random().toString(),
            x: ball.x,
            y: ball.y,
            radius: ball.radius,
            vx: b1Vx,
            vy: b1Vy,
            speed: ball.speed,
            isFireball: ball.isFireball,
            stickyToPaddle: false,
            stickyOffset: 0,
          });

          state.balls.push({
            id: Math.random().toString(),
            x: ball.x,
            y: ball.y,
            radius: ball.radius,
            vx: b2Vx,
            vy: b2Vy,
            speed: ball.speed,
            isFireball: ball.isFireball,
            stickyToPaddle: false,
            stickyOffset: 0,
          });
        });
      }
      return;
    }

    // Set durations for timers (in seconds)
    let duration = 10;
    if (powerUp.type === 'wide') duration = 12;
    if (powerUp.type === 'narrow') duration = 8;
    if (powerUp.type === 'fireball') duration = 8;
    if (powerUp.type === 'sticky') duration = 15;
    if (powerUp.type === 'slow') duration = 10;
    if (powerUp.type === 'laser') duration = 10;

    // Remove conflicting or existing of same type
    state.activePowerUps = state.activePowerUps.filter((p) => {
      // Wide cancels Narrow and vice versa
      if (powerUp.type === 'wide' && p.type === 'narrow') return false;
      if (powerUp.type === 'narrow' && p.type === 'wide') return false;
      return p.type !== powerUp.type;
    });

    state.activePowerUps.push({
      type: powerUp.type,
      timeLeft: duration,
      maxDuration: duration,
    });

    // Instant impact changes
    if (powerUp.type === 'slow') {
      state.balls.forEach((b) => {
        b.vx *= 0.65;
        b.vy *= 0.65;
      });
    }

    if (powerUp.type === 'fireball') {
      state.balls.forEach((b) => {
        b.isFireball = true;
      });
      state.isFireballVignette = true;
    }
  };

  // Main Canvas Render and Game Loop
  useEffect(() => {
    let animationFrameId: number;

    const gameLoop = (timestamp: number) => {
      if (!isPlaying || isPaused) {
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }

      const state = stateRef.current;
      
      // Fixed time step handling
      if (!state.lastTime) state.lastTime = timestamp;
      if (!state.lastSecondTime) state.lastSecondTime = timestamp;

      const elapsed = timestamp - state.lastTime;
      state.lastTime = timestamp;

      // Handle slow motion decay
      if (state.slowMotionTimer > 0) {
        state.slowMotionTimer -= elapsed;
        if (state.slowMotionTimer <= 0) {
          state.slowMotion = 1;
          state.slowMotionTimer = 0;
        }
      }

      // Update Survival clock (every second)
      if (timestamp - state.lastSecondTime >= 1000) {
        state.lastSecondTime = timestamp;

        // Decrement active powerup timers
        state.activePowerUps = state.activePowerUps
          .map((p) => ({ ...p, timeLeft: parseFloat((p.timeLeft - 1).toFixed(1)) }))
          .filter((p) => p.timeLeft > 0);

        // Reset fireball/paddle sizes if powerup expired
        const hasFireball = state.activePowerUps.some((p) => p.type === 'fireball');
        state.isFireballVignette = hasFireball;
        state.balls.forEach((b) => {
          b.isFireball = hasFireball;
        });

        if (!state.isFirstLaunch) {
          state.timeSurvived += 1;
          state.score += 15; // Give 15 survival points per second
          syncHudState();
        } else {
          // Player is static/AFK before launching!
          state.staticSeconds = (state.staticSeconds || 0) + 1;

          if (state.staticSeconds >= 7) {
            // Deduct points as a funny penalty
            const penalty = Math.min(250, 25 * (state.staticSeconds - 6));
            state.score = Math.max(0, state.score - penalty);

            // Floating text above paddle
            addTextIndicator(
              state.paddle.x + state.paddle.width / 2,
              state.paddle.y - 20,
              `-${penalty} PONTOS POR PREGUIÇA! 💤`,
              '#f87171'
            );

            // Comical sound and screenshake
            audio.playBrickHit('armored', false);
            state.screenShake = Math.max(state.screenShake, 6);
          }

          if (state.staticSeconds >= 12) {
            // EXPLODE!
            state.lives -= 1;
            state.staticSeconds = 0;
            audio.playGameOver(); // play retro explosion
            state.screenShake = 25; // massive shake!

            // Firey explosion particles
            spawnParticles(state.paddle.x + state.paddle.width / 2, state.paddle.y - 10, '#ef4444', 35);
            spawnParticles(state.paddle.x + state.paddle.width / 2, state.paddle.y - 10, '#f97316', 35);

            addTextIndicator(
              state.paddle.x + state.paddle.width / 2,
              state.paddle.y - 50,
              'A BOLA EXPLODIU DE TÉDIO! -1 VIDA! 💥',
              '#ef4444',
              1.3
            );

            if (state.lives <= 0) {
              onGameOver({
                score: state.score,
                wave: state.wave,
                maxCombo: state.maxCombo,
                bricksDestroyed: state.bricksDestroyed,
                timeSurvived: state.timeSurvived,
                normalDestroyed: state.normalDestroyed,
                armoredDestroyed: state.armoredDestroyed,
                explosiveDestroyed: state.explosiveDestroyed,
                powerUpsCollected: state.powerUpsCollected,
                ballsLost: state.ballsLost,
              });
            } else {
              state.balls = [];
              spawnStickyBall();
            }
          }
          syncHudState();
        }
      }

      // 1. UPDATE GAME PHYSICS
      updatePhysics();

      // 2. RENDER GRAPHICS
      renderGraphics();

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    const updatePhysics = () => {
      const state = stateRef.current;
      const prevPaddleX = state.paddle.x;

      // Adjust paddle width based on active power-ups
      let targetPaddleWidth = 100;
      if (state.activePowerUps.some((p) => p.type === 'wide')) targetPaddleWidth = 145;
      if (state.activePowerUps.some((p) => p.type === 'narrow')) targetPaddleWidth = 65;

      if (state.paddle.width !== targetPaddleWidth) {
        // Smoothly adjust width
        const diff = targetPaddleWidth - state.paddle.width;
        state.paddle.width += diff * 0.15;
        // Adjust paddle position so it resizes centered
        state.paddle.x -= (diff * 0.15) / 2;
      }

      // Update Paddle Position via Keyboard / Mouse with priority separation
      if (state.controlMode === 'keyboard') {
        let paddleMove = 0;
        if (state.keysPressed['ArrowLeft'] || state.keysPressed['a'] || state.keysPressed['A']) {
          paddleMove = -state.paddle.speed;
        }
        if (state.keysPressed['ArrowRight'] || state.keysPressed['d'] || state.keysPressed['D']) {
          paddleMove = state.paddle.speed;
        }

        if (paddleMove !== 0) {
          state.paddle.x += paddleMove;
        }
      } else {
        // Follow Mouse position with a subtle smooth easing lerp
        const mouseDiffX = state.mousePos.x - (state.paddle.x + state.paddle.width / 2);
        state.paddle.x += mouseDiffX * 0.35;
      }

      // Constrain Paddle inside logical borders
      state.paddle.x = Math.max(0, Math.min(LOGICAL_WIDTH - state.paddle.width, state.paddle.x));

      const paddleDiffX = state.paddle.x - prevPaddleX;
      // Calculate target tilt (max tilt of ~10 degrees)
      const targetTilt = (paddleDiffX / state.paddle.speed) * 0.15;
      // Smoothly lerp paddle tilt
      state.paddleTilt += (targetTilt - state.paddleTilt) * 0.15;

      // Smoothly decay paddle scale and hit flash
      state.paddleScaleX += (1.0 - state.paddleScaleX) * 0.12;
      state.paddleScaleY += (1.0 - state.paddleScaleY) * 0.12;
      state.paddleFlash += (0.0 - state.paddleFlash) * 0.15;

      // Update Ball positions and colliders
      for (let i = state.balls.length - 1; i >= 0; i--) {
        const ball = state.balls[i];

        if (ball.stickyToPaddle) {
          // Ball follows paddle motion
          ball.x = state.paddle.x + state.paddle.width / 2 + ball.stickyOffset;
          ball.y = state.paddle.y - ball.radius - 2;
          continue;
        }

        // Apply velocities with slow motion scaling
        ball.x += ball.vx * state.slowMotion;
        ball.y += ball.vy * state.slowMotion;

        // Record trail for visual juice
        if (!ball.trail) ball.trail = [];
        ball.trail.push({ x: ball.x, y: ball.y });
        if (ball.trail.length > 8) {
          ball.trail.shift();
        }

        // Wall collisions
        if (ball.x - ball.radius <= 0) {
          ball.x = ball.radius;
          ball.vx = -ball.vx;
          audio.playWallBounce();
        } else if (ball.x + ball.radius >= LOGICAL_WIDTH) {
          ball.x = LOGICAL_WIDTH - ball.radius;
          ball.vx = -ball.vx;
          audio.playWallBounce();
        }

        if (ball.y - ball.radius <= 0) {
          ball.y = ball.radius;
          ball.vy = -ball.vy;
          audio.playWallBounce();
        }

        // Paddle Collision detection (AABB vs Circle)
        const paddleTopY = state.paddle.y;
        if (
          ball.y + ball.radius >= paddleTopY &&
          ball.y - ball.radius <= paddleTopY + state.paddle.height &&
          ball.x >= state.paddle.x &&
          ball.x <= state.paddle.x + state.paddle.width
        ) {
          // Squash paddle on hit (X stretches, Y squashes)
          state.paddleScaleX = 1.25;
          state.paddleScaleY = 0.65;
          state.paddleFlash = 1.0;

          // Emit visual neon bubbles/sparks from paddle contact point
          spawnParticles(ball.x, paddleTopY, '#22d3ee', 8);

          // Is sticky power-up active?
          const isStickyActive = state.activePowerUps.some((p) => p.type === 'sticky');

          if (isStickyActive) {
            ball.stickyToPaddle = true;
            ball.stickyOffset = ball.x - (state.paddle.x + state.paddle.width / 2);
            ball.vx = 0;
            ball.vy = 0;
            audio.playPaddleBounce();
            continue;
          }

          // Bounce ball based on where it hit the paddle (adds aim!)
          const paddleCenter = state.paddle.x + state.paddle.width / 2;
          const hitPoint = (ball.x - paddleCenter) / (state.paddle.width / 2); // value -1 to 1

          // Calculate angle: max reflection of 60 degrees
          const maxAngle = (60 * Math.PI) / 180;
          const angle = hitPoint * maxAngle;

          // Ball speed boosts slightly per bounce in high waves
          const waveSpeedBoost = 1 + Math.min(0.4, (state.wave - 1) * 0.05);
          const currentSpeed = ball.speed * waveSpeedBoost;

          ball.vx = currentSpeed * Math.sin(angle);
          ball.vy = -currentSpeed * Math.cos(angle);

          // Force ball slightly above paddle to avoid multi-colliding glitches
          ball.y = paddleTopY - ball.radius - 1;

          audio.playPaddleBounce();
        }

        // Brick collisions
        let hitBrickThisFrame = false;

        for (let j = state.bricks.length - 1; j >= 0; j--) {
          const brick = state.bricks[j];

          // Check intersection using AABB clamping
          const closestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
          const closestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));
          const distanceX = ball.x - closestX;
          const distanceY = ball.y - closestY;
          const distanceSquared = distanceX * distanceX + distanceY * distanceY;

          if (distanceSquared < ball.radius * ball.radius) {
            hitBrickThisFrame = true;

            // Handle Indestructible brick
            if (brick.type === 'indestructible') {
              audio.playBrickHit('indestructible', false);
              bounceBallOffBrick(ball, brick, closestX, closestY);
              break; // exit brick loop
            }

            // Damage Brick
            brick.hp -= 1;

            if (brick.hp <= 0) {
              // Destroy Brick
              state.bricks.splice(j, 1);
              state.bricksDestroyed += 1;
              if (brick.type === 'normal') state.normalDestroyed += 1;
              if (brick.type === 'armored') state.armoredDestroyed += 1;

              // Combo scaling
              state.currentCombo += 1;
              if (state.currentCombo > state.maxCombo) {
                state.maxCombo = state.currentCombo;
              }

              // Award points
              const basePoints = brick.points;
              const comboMult = getComboMultiplier(state.currentCombo);
              const earned = Math.floor(basePoints * comboMult);
              state.score += earned;

              // Play combo chimes and indicators
              if (state.currentCombo % 5 === 0) {
                audio.playComboChime(state.currentCombo / 5);
                // Hitstop (micro-slowdown) on milestone combos for extreme juice!
                startSlowMotion(0.2, 160);
              } else {
                audio.playBrickHit(brick.type, true);
              }

              addComboIndicator(brick.x + brick.width / 2, brick.y, earned, state.currentCombo);
              spawnParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color, 12);

              // Power-up chance
              rollPowerUpChance(brick);

              // Handle explosive reactions
              if (brick.type === 'explosive') {
                state.explosiveDestroyed += 1;
                triggerBrickExplosion(brick);
                // Explosive chain slow-motion effect
                startSlowMotion(0.25, 220);
              }

              // Shake screen slightly on brick death
              state.screenShake = Math.max(state.screenShake, ball.isFireball ? 11 : 4);
            } else {
              // Armored brick got hit but not destroyed
              audio.playBrickHit(brick.type, false);
              if (brick.type === 'armored') {
                if (brick.hp === 2) brick.color = '#64748b'; // Cracked
                if (brick.hp === 1) brick.color = '#475569'; // Heavily Cracked
              }
              spawnParticles(closestX, closestY, brick.color, 4);
            }

            // Bounce Ball if not in fireball pierce mode
            if (!ball.isFireball) {
              bounceBallOffBrick(ball, brick, closestX, closestY);
            }
            break; // Handle 1 brick collision per frame per ball
          }
        }

        // Lose ball out of bounds
        if (ball.y - ball.radius > LOGICAL_HEIGHT) {
          state.balls.splice(i, 1);
          state.ballsLost += 1;

          // If no balls are left, player loses a life!
          if (state.balls.length === 0) {
            state.lives -= 1;
            state.currentCombo = 0; // Reset combo

            // Dramatic slow-motion penalty to give player time to process and breathe
            startSlowMotion(0.2, 1200);

            if (state.lives <= 0) {
              // Game Over
              audio.playGameOver();
              onGameOver({
                score: state.score,
                wave: state.wave,
                maxCombo: state.maxCombo,
                bricksDestroyed: state.bricksDestroyed,
                timeSurvived: state.timeSurvived,
                normalDestroyed: state.normalDestroyed,
                armoredDestroyed: state.armoredDestroyed,
                explosiveDestroyed: state.explosiveDestroyed,
                powerUpsCollected: state.powerUpsCollected,
                ballsLost: state.ballsLost,
              });
            } else {
              // Spawn a new ball stuck to paddle
              spawnStickyBall();
              state.isFirstLaunch = true;
              syncHudState();
            }
          } else {
            syncHudState();
          }
        }
      }

      // Bounce algorithm helper
      function bounceBallOffBrick(ball: Ball, brick: Brick, closestX: number, closestY: number) {
        const fromLeft = ball.x < brick.x;
        const fromRight = ball.x > brick.x + brick.width;
        const fromTop = ball.y < brick.y;
        const fromBottom = ball.y > brick.y + brick.height;

        // If ball center is exactly on border, fallbacks
        const overlapX = ball.radius - Math.abs(ball.x - closestX);
        const overlapY = ball.radius - Math.abs(ball.y - closestY);

        if (overlapX < overlapY) {
          // Left or Right face hit
          ball.vx = -ball.vx;
          if (fromLeft) ball.x = brick.x - ball.radius - 0.5;
          if (fromRight) ball.x = brick.x + brick.width + ball.radius + 0.5;
        } else {
          // Top or Bottom face hit
          ball.vy = -ball.vy;
          if (fromTop) ball.y = brick.y - ball.radius - 0.5;
          if (fromBottom) ball.y = brick.y + brick.height + ball.radius + 0.5;
        }
      }

      // Update Powerups position with slowMotion scaling
      for (let i = state.powerUps.length - 1; i >= 0; i--) {
        const p = state.powerUps[i];
        p.y += p.vy * state.slowMotion;

        // Collect Powerup
        if (
          p.y + p.height >= state.paddle.y &&
          p.y <= state.paddle.y + state.paddle.height &&
          p.x + p.width >= state.paddle.x &&
          p.x <= state.paddle.x + state.paddle.width
        ) {
          collectPowerUp(p);
          state.powerUps.splice(i, 1);
          syncHudState();
          continue;
        }

        // Out of bounds
        if (p.y > LOGICAL_HEIGHT) {
          state.powerUps.splice(i, 1);
        }
      }

      // Update Lasers position with slowMotion scaling
      for (let i = state.lasers.length - 1; i >= 0; i--) {
        const laser = state.lasers[i];
        laser.y += laser.vy * state.slowMotion;

        // Collision with top border
        if (laser.y < 0) {
          state.lasers.splice(i, 1);
          continue;
        }

        // Collide with bricks
        let hitBrick = false;
        for (let j = state.bricks.length - 1; j >= 0; j--) {
          const brick = state.bricks[j];

          if (
            laser.x + laser.width >= brick.x &&
            laser.x <= brick.x + brick.width &&
            laser.y + laser.height >= brick.y &&
            laser.y <= brick.y + brick.height
          ) {
            hitBrick = true;

            if (brick.type === 'indestructible') {
              audio.playBrickHit('indestructible', false);
              spawnParticles(laser.x + laser.width / 2, laser.y, '#94a3b8', 4);
              break;
            }

            brick.hp -= 1;
            if (brick.hp <= 0) {
              state.bricks.splice(j, 1);
              state.bricksDestroyed += 1;
              if (brick.type === 'normal') state.normalDestroyed += 1;
              if (brick.type === 'armored') state.armoredDestroyed += 1;

              state.currentCombo += 1;
              if (state.currentCombo > state.maxCombo) {
                state.maxCombo = state.currentCombo;
              }

              const basePoints = brick.points;
              const comboMult = getComboMultiplier(state.currentCombo);
              const earned = Math.floor(basePoints * comboMult);
              state.score += earned;

              audio.playBrickHit(brick.type, true);
              addComboIndicator(brick.x + brick.width / 2, brick.y, earned, state.currentCombo);
              spawnParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color, 12);
              rollPowerUpChance(brick);

              if (brick.type === 'explosive') {
                state.explosiveDestroyed += 1;
                triggerBrickExplosion(brick);
              }
            } else {
              audio.playBrickHit(brick.type, false);
              if (brick.type === 'armored') {
                if (brick.hp === 2) brick.color = '#64748b';
                if (brick.hp === 1) brick.color = '#475569';
              }
              spawnParticles(laser.x + laser.width / 2, laser.y, brick.color, 4);
            }

            state.screenShake = Math.max(state.screenShake, 3);
            break;
          }
        }

        if (hitBrick) {
          state.lasers.splice(i, 1);
        }
      }

      // Update Particles physics with slowMotion scaling
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx * state.slowMotion;
        p.y += p.vy * state.slowMotion;
        p.vy += p.gravity * state.slowMotion;
        p.alpha -= p.decay * state.slowMotion;

        if (p.alpha <= 0) {
          state.particles.splice(i, 1);
        }
      }

      // Update Combo Floating Indicators with slowMotion scaling
      for (let i = state.comboIndicators.length - 1; i >= 0; i--) {
        const ind = state.comboIndicators[i];
        ind.y -= 0.8 * state.slowMotion; // float up
        ind.alpha -= 0.016 * state.slowMotion; // fade out

        if (ind.alpha <= 0) {
          state.comboIndicators.splice(i, 1);
        }
      }

      // Decelerate screenshake
      if (state.screenShake > 0) {
        state.screenShake -= 0.6;
        if (state.screenShake < 0) state.screenShake = 0;
      }

      // Fade visual flash
      if (state.flashOpacity > 0) {
        state.flashOpacity -= 0.02;
        if (state.flashOpacity < 0) state.flashOpacity = 0;
      }

      // Check level clear / Wave completion
      // Wave is complete if all breakable bricks are gone
      const breakableBricksCount = state.bricks.filter((b) => b.type !== 'indestructible').length;
      if (breakableBricksCount === 0) {
        audio.playLevelClear();
        state.wave += 1;

        // Visual flash and victory slow motion!
        state.flashOpacity = 0.5;
        startSlowMotion(0.2, 1600);

        // Clear active projectilies/lasers for clean start
        state.powerUps = [];
        state.lasers = [];
        state.balls = [];

        // Spawn a new sticky ball
        spawnStickyBall();
        state.isFirstLaunch = true;

        // Create new bricks structure
        state.bricks = generateWaveBricks(state.wave);

        // Score bonus for completing waves
        state.score += state.wave * 500;
        addComboIndicator(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2, state.wave * 500, 0);

        syncHudState();
      }
    };

    const renderGraphics = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const state = stateRef.current;

      ctx.save();

      // Screen shake transform
      if (state.screenShake > 0) {
        const dx = (Math.random() - 0.5) * state.screenShake;
        const dy = (Math.random() - 0.5) * state.screenShake;
        ctx.translate(dx, dy);
      }

      // Background drawing (deep, rich galactic indigo/slate gradient)
      const bgGrad = ctx.createLinearGradient(0, 0, 0, LOGICAL_HEIGHT);
      bgGrad.addColorStop(0, '#090d16');
      bgGrad.addColorStop(1, '#05070c');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

      // Draw immersive active power-up edge glows / vignettes
      state.activePowerUps.forEach((ap) => {
        let color = '';
        if (ap.type === 'laser') color = 'rgba(236, 72, 153, 0.15)';
        if (ap.type === 'sticky') color = 'rgba(99, 102, 241, 0.15)';
        if (ap.type === 'wide') color = 'rgba(16, 185, 129, 0.15)';
        if (ap.type === 'fireball') color = 'rgba(239, 68, 68, 0.15)';
        if (ap.type === 'slow') color = 'rgba(56, 189, 248, 0.15)';

        if (color) {
          const glowGrad = ctx.createRadialGradient(
            LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2, LOGICAL_WIDTH / 3,
            LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2, LOGICAL_WIDTH / 1.1
          );
          glowGrad.addColorStop(0, 'rgba(0,0,0,0)');
          glowGrad.addColorStop(1, color);
          ctx.fillStyle = glowGrad;
          ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
        }
      });

      // Draw futuristic subtle laser guidelines from paddle (helper)
      if (state.isFirstLaunch && state.balls[0]?.stickyToPaddle) {
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(state.paddle.x + state.paddle.width / 2, state.paddle.y);
        ctx.lineTo(state.paddle.x + state.paddle.width / 2, 40);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw Bricks
      state.bricks.forEach((brick) => {
        // Drop shadow for a 3D overlay feel
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fillRect(brick.x + 3, brick.y + 3, brick.width, brick.height);

        // Core brick body
        ctx.fillStyle = brick.color;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);

        // Outer neon glow outline
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);

        // Render armored brick cracks
        if (brick.type === 'armored') {
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1.5;
          if (brick.hp === 2) {
            // Level 1 crack
            ctx.beginPath();
            ctx.moveTo(brick.x + 10, brick.y + 5);
            ctx.lineTo(brick.x + 25, brick.y + 15);
            ctx.lineTo(brick.x + 35, brick.y + 12);
            ctx.stroke();
          } else if (brick.hp === 1) {
            // Level 2 heavy cracks
            ctx.beginPath();
            ctx.moveTo(brick.x + 10, brick.y + 5);
            ctx.lineTo(brick.x + 25, brick.y + 15);
            ctx.lineTo(brick.x + 35, brick.y + 12);
            ctx.moveTo(brick.x + brick.width - 15, brick.y + 4);
            ctx.lineTo(brick.x + brick.width - 25, brick.y + 16);
            ctx.moveTo(brick.x + 40, brick.y + 18);
            ctx.lineTo(brick.x + 50, brick.y + 2);
            ctx.stroke();
          }
        }

        // Render explosive core pulsing light
        if (brick.type === 'explosive') {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.beginPath();
          ctx.arc(
            brick.x + brick.width / 2,
            brick.y + brick.height / 2,
            4 + Math.sin(Date.now() * 0.01) * 1.5,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }

        // Render metallic texture details on indestructible bricks
        if (brick.type === 'indestructible') {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.fillRect(brick.x + 2, brick.y + 2, brick.width - 4, 3);
          
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(brick.x + 4, brick.y + 4, brick.width - 8, brick.height - 8);
        }
      });

      // Draw Paddle (Neon Retro bar with side thruster design & physical squash-and-stretch / tilt)
      const px = state.paddle.x;
      const py = state.paddle.y;
      const pw = state.paddle.width;
      const ph = state.paddle.height;
      const r = 6; // rounding

      ctx.save();
      // Translate to the center of the paddle for rotation & scaling
      ctx.translate(px + pw / 2, py + ph / 2);
      ctx.rotate(state.paddleTilt);
      ctx.scale(state.paddleScaleX, state.paddleScaleY);

      let paddleColor = '#06b6d4'; // default cyan
      if (state.activePowerUps.some((p) => p.type === 'laser')) paddleColor = '#ec4899'; // pink
      if (state.activePowerUps.some((p) => p.type === 'sticky')) paddleColor = '#6366f1'; // indigo
      if (state.activePowerUps.some((p) => p.type === 'wide')) paddleColor = '#10b981'; // emerald

      ctx.fillStyle = paddleColor;

      ctx.beginPath();
      ctx.moveTo(-pw / 2 + r, -ph / 2);
      ctx.lineTo(pw / 2 - r, -ph / 2);
      ctx.quadraticCurveTo(pw / 2, -ph / 2, pw / 2, -ph / 2 + r);
      ctx.lineTo(pw / 2, ph / 2 - r);
      ctx.quadraticCurveTo(pw / 2, ph / 2, pw / 2 - r, ph / 2);
      ctx.lineTo(-pw / 2 + r, ph / 2);
      ctx.quadraticCurveTo(-pw / 2, ph / 2, -pw / 2, ph / 2 - r);
      ctx.lineTo(-pw / 2, -ph / 2 + r);
      ctx.quadraticCurveTo(-pw / 2, -ph / 2, -pw / 2 + r, -ph / 2);
      ctx.closePath();
      ctx.fill();

      // Top highlight strip
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(-pw / 2 + r, -ph / 2 + 2, pw - r * 2, 3);

      // White hit flash overlay!
      if (state.paddleFlash > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${state.paddleFlash})`;
        ctx.beginPath();
        ctx.moveTo(-pw / 2 + r, -ph / 2);
        ctx.lineTo(pw / 2 - r, -ph / 2);
        ctx.quadraticCurveTo(pw / 2, -ph / 2, pw / 2, -ph / 2 + r);
        ctx.lineTo(pw / 2, ph / 2 - r);
        ctx.quadraticCurveTo(pw / 2, ph / 2, pw / 2 - r, ph / 2);
        ctx.lineTo(-pw / 2 + r, ph / 2);
        ctx.quadraticCurveTo(-pw / 2, ph / 2, -pw / 2, ph / 2 - r);
        ctx.lineTo(-pw / 2, -ph / 2 + r);
        ctx.quadraticCurveTo(-pw / 2, -ph / 2, -pw / 2 + r, -ph / 2);
        ctx.closePath();
        ctx.fill();
      }

      // Render Laser blaster nodes if active
      if (state.activePowerUps.some((p) => p.type === 'laser')) {
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(-pw / 2, -ph / 2 - 4, 8, 4);
        ctx.fillRect(pw / 2 - 8, -ph / 2 - 4, 8, 4);
      }

      ctx.restore();

      // Draw Lasers
      state.lasers.forEach((laser) => {
        ctx.fillStyle = laser.color;
        ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
        
        // Inner white core for glowing light sabre effect
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(laser.x + 2, laser.y, laser.width - 4, laser.height);
      });

      // Draw Ball Trails (Ghost tails)
      state.balls.forEach((ball) => {
        if (ball.trail && ball.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(ball.trail[0].x, ball.trail[0].y);
          for (let ti = 1; ti < ball.trail.length; ti++) {
            ctx.lineTo(ball.trail[ti].x, ball.trail[ti].y);
          }
          ctx.strokeStyle = ball.isFireball 
            ? 'rgba(239, 68, 68, 0.4)' 
            : 'rgba(56, 189, 248, 0.35)';
          ctx.lineWidth = ball.radius * 1.5;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();

          // Draw fading ghost circles along the trail
          ball.trail.forEach((pos, idx) => {
            const alpha = (idx / ball.trail!.length) * 0.35;
            ctx.fillStyle = ball.isFireball 
              ? `rgba(249, 115, 22, ${alpha})` 
              : `rgba(56, 189, 248, ${alpha})`;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, ball.radius * (0.3 + (idx / ball.trail!.length) * 0.7), 0, Math.PI * 2);
            ctx.fill();
          });
        }
      });

      // Draw Balls
      state.balls.forEach((ball) => {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        
        if (ball.isFireball) {
          // Fireball design: Orange core, red aura
          const grad = ctx.createRadialGradient(ball.x, ball.y, 2, ball.x, ball.y, ball.radius + 6);
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.3, '#f97316'); // bright orange
          grad.addColorStop(1, 'rgba(239, 68, 68, 0)'); // red halo
          ctx.fillStyle = grad;
          ctx.arc(ball.x, ball.y, ball.radius + 6, 0, Math.PI * 2);
        } else {
          // Standard ball: white glowing sphere
          const grad = ctx.createRadialGradient(ball.x, ball.y, 1, ball.x, ball.y, ball.radius);
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(1, '#93c5fd'); // soft blue glow
          ctx.fillStyle = grad;
        }
        ctx.fill();
      });

      // Draw Power-ups
      state.powerUps.forEach((p) => {
        // Glowing Capsule style
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(p.x + 2, p.y + 2, p.width, p.height);

        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(p.x, p.y, p.width, p.height, 6) : ctx.rect(p.x, p.y, p.width, p.height);
        ctx.fill();

        // Inner white neon accent
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 1;
        ctx.strokeRect(p.x, p.y, p.width, p.height);

        // Power-up Symbol / Code text centered
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.type.toUpperCase(), p.x + p.width / 2, p.y + p.height / 2 + 1);
      });

      // Draw Particles
      state.particles.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        
        ctx.beginPath();
        if (p.shape === 'square') {
          ctx.fillRect(p.x, p.y, p.size, p.size);
        } else {
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // Draw Floating Combo Score Indicators
      state.comboIndicators.forEach((ind) => {
        ctx.save();
        ctx.globalAlpha = ind.alpha;
        ctx.fillStyle = ind.color;
        ctx.font = `bold ${10 * ind.scale}px "Courier New", Courier, monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(ind.text, ind.x, ind.y);
        ctx.restore();
      });

      // Draw Launch Banner / Guide if awaiting click
      if (state.isFirstLaunch && state.balls.length > 0) {
        const secs = state.staticSeconds || 0;
        let text = 'CLIQUE OU PRESSIONE [ESPAÇO] PARA LANÇAR';
        let color = 'rgba(6, 182, 212, 0.85)'; // cyan
        let font = 'bold 15px sans-serif';

        if (secs >= 4 && secs < 7) {
          text = 'EI, VOCÊ ESTÁ AÍ? LANÇA A BOLA! 💤';
          color = '#eab308'; // yellow
          font = 'bold 16px sans-serif';
        } else if (secs >= 7 && secs < 10) {
          text = '⚠️ DETECTOR DE PREGUIÇA ATIVO! PERDENDO PONTOS! ⚠️';
          color = '#f97316'; // orange
          font = 'bold 17px sans-serif';
        } else if (secs >= 10) {
          const timeLeft = Math.max(1, 12 - secs);
          text = `💥 A BOLA VAI EXPLODIR EM ${timeLeft} SEGUNDOS!!! 💥`;
          // Pulse between orange and red
          color = Date.now() % 500 < 250 ? '#ef4444' : '#f97316';
          font = 'bold 19px "Courier New", Courier, monospace';
          
          // Gently vibrate the paddle to show physical stress!
          state.paddle.x += (Math.random() - 0.5) * 4;
        }

        ctx.fillStyle = color;
        ctx.font = font;
        ctx.textAlign = 'center';
        ctx.fillText(
          text,
          LOGICAL_WIDTH / 2,
          LOGICAL_HEIGHT - 120
        );
      }

      // Restore transform (ends screen shake)
      ctx.restore();

      // Screen Flash overlay
      if (state.flashOpacity > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${state.flashOpacity})`;
        ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
      }

      // Fireball pulsing red/orange border vignette
      if (state.isFireballVignette) {
        const pulse = 0.15 + Math.sin(Date.now() * 0.007) * 0.08;
        const vigGrad = ctx.createRadialGradient(
          LOGICAL_WIDTH / 2,
          LOGICAL_HEIGHT / 2,
          LOGICAL_WIDTH / 3,
          LOGICAL_WIDTH / 2,
          LOGICAL_HEIGHT / 2,
          LOGICAL_WIDTH / 1.4
        );
        vigGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
        vigGrad.addColorStop(1, `rgba(249, 115, 22, ${pulse})`);
        ctx.fillStyle = vigGrad;
        ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
      }
    };

    if (isPlaying && !isPaused) {
      animationFrameId = requestAnimationFrame(gameLoop);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, isPaused]);

  return (
    <div className="w-full flex flex-col gap-3">
      {/* HUD Header Bar - fully responsive, non-overlapping, above the canvas! */}
      <GameHUD
        score={hudStats.score}
        wave={hudStats.wave}
        lives={hudStats.lives}
        combo={hudStats.combo}
      />

      {/* Canvas container with aspect-ratio */}
      <div className="relative w-full aspect-[4/3] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl touch-none">
        {/* HTML5 Game Canvas */}
        <canvas
          ref={canvasRef}
          width={LOGICAL_WIDTH}
          height={LOGICAL_HEIGHT}
          className="w-full h-full block cursor-crosshair select-none touch-none"
          style={{ imageRendering: 'auto' }}
        />

        {/* Active Power-up timer bars bottom rail */}
        <PowerUpTimers activePowerUps={hudStats.activePowerUps} />
      </div>
    </div>
  );
};
export default GameCanvas;
