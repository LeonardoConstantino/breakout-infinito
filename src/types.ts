/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BrickType = 'normal' | 'armored' | 'explosive' | 'indestructible';

export interface Brick {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: BrickType;
  color: string;
  points: number;
  maxHp: number;
  hp: number;
  row: number;
  col: number;
}

export interface Ball {
  id: string;
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  speed: number;
  isFireball: boolean;
  stickyToPaddle: boolean; // Is it stuck to the paddle waiting to launch?
  stickyOffset: number;    // X offset from paddle center when stuck
  trail?: { x: number; y: number }[];
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

export type PowerUpType = 'wide' | 'narrow' | 'multiball' | 'fireball' | 'slow' | 'sticky' | 'laser';

export interface PowerUp {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  vy: number;
  type: PowerUpType;
  color: string;
  label: string;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  gravity: number;
  shape: 'square' | 'circle';
}

export interface Laser {
  id: string;
  x: number;
  y: number;
  vy: number;
  width: number;
  height: number;
  color: string;
}

export interface ComboIndicator {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  scale: number;
}

export type WavePattern = 'classic' | 'chess' | 'pyramid' | 'fortress';

export interface ActivePowerUp {
  type: PowerUpType;
  timeLeft: number; // In seconds
  maxDuration: number; // Total duration in seconds
}

export interface GameStats {
  score: number;
  wave: number;
  maxCombo: number;
  bricksDestroyed: number;
  timeSurvived: number; // in seconds
  normalDestroyed: number;
  armoredDestroyed: number;
  explosiveDestroyed: number;
  powerUpsCollected: number;
  ballsLost: number;
}

export interface HighScore {
  name: string;
  score: number;
  wave: number;
  maxCombo: number;
  date: string;
  grade: string;
}
