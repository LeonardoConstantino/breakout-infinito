/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const LOGICAL_WIDTH = 800;
export const LOGICAL_HEIGHT = 600;

export function getComboMultiplier(comboCount: number): number {
  if (comboCount >= 15) return 3.0;
  if (comboCount >= 10) return 2.0;
  if (comboCount >= 5) return 1.5;
  return 1.0;
}
