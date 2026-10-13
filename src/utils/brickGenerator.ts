/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Brick, WavePattern } from '../types';
import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from './gameConstants';

/**
 * Generates an array of Bricks for the given wave number.
 */
export const generateWaveBricks = (waveNum: number): Brick[] => {
  const bricks: Brick[] = [];

  // Columns: 10, Rows: 5 or 6 (up to 8 in advanced waves)
  const cols = 10;
  const rows = Math.min(8, 4 + Math.floor(waveNum / 2));
  const brickW = 68;
  const brickH = 20;
  const gapX = 4;
  const gapY = 4;
  const startX = (LOGICAL_WIDTH - (cols * (brickW + gapX) - gapX)) / 2;
  const startY = 70; // Give space for top HUD

  // Determine Pattern
  const patternType: WavePattern = ['classic', 'chess', 'pyramid', 'fortress'][(waveNum - 1) % 4] as WavePattern;

  // Standard high-contrast retro neon color palettes
  const rowColors = ['#f43f5e', '#ec4899', '#a855f7', '#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let shouldSpawn = true;
      let type: 'normal' | 'armored' | 'explosive' | 'indestructible' = 'normal';

      // Apply Wave Pattern structures
      if (patternType === 'chess') {
        shouldSpawn = (r + c) % 2 === 0;
      } else if (patternType === 'pyramid') {
        const centerCol = (cols - 1) / 2;
        const maxDist = r;
        shouldSpawn = Math.abs(c - centerCol) <= maxDist;
      }

      if (!shouldSpawn) continue;

      // Brick distribution depending on wave
      const rand = Math.random();

      // Fortress Pattern: Outer shell is armored, core is a mix of explosive and normal
      if (patternType === 'fortress') {
        const isBorder = r === 0 || r === rows - 1 || c === 0 || c === cols - 1;
        if (isBorder) {
          type = 'armored';
        } else {
          type = rand < 0.25 ? 'explosive' : 'normal';
        }
      } else {
        // Standard pattern type selection
        if (waveNum >= 3 && rand < 0.05) {
          // Indestructible blocks appear from wave 3
          type = 'indestructible';
        } else if (rand < 0.12) {
          type = 'explosive';
        } else if (rand < 0.12 + Math.min(0.25, waveNum * 0.03)) {
          type = 'armored';
        }
      }

      let maxHp = 1;
      let color = rowColors[r % rowColors.length];
      let points = 100 + r * 20;

      if (type === 'armored') {
        maxHp = 3;
        color = '#94a3b8'; // Iron Gray initially
        points = 300;
      } else if (type === 'explosive') {
        maxHp = 1;
        color = '#f97316'; // Vivid Orange
        points = 250;
      } else if (type === 'indestructible') {
        maxHp = Infinity;
        color = '#4b5563'; // Dark Steel Gray
        points = 0;
      }

      bricks.push({
        id: `${r}-${c}-${Math.random()}`,
        x: startX + c * (brickW + gapX),
        y: startY + r * (brickH + gapY),
        width: brickW,
        height: brickH,
        type,
        color,
        points,
        maxHp,
        hp: maxHp,
        row: r,
        col: c,
      });
    }
  }

  // In the extremely rare case that zero bricks spawned, spawn a single normal brick
  if (bricks.length === 0) {
    bricks.push({
      id: 'safety-brick',
      x: LOGICAL_WIDTH / 2 - 34,
      y: LOGICAL_HEIGHT / 3,
      width: 68,
      height: 20,
      type: 'normal',
      color: '#f43f5e',
      points: 100,
      maxHp: 1,
      hp: 1,
      row: 0,
      col: 0,
    });
  }

  return bricks;
};
