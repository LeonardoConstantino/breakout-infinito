/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class HapticsEngine {
  public enabled: boolean = true;

  private vibrate(pattern: number | number[]) {
    if (!this.enabled) return;
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Silently ignore if blocked or unsupported
      }
    }
  }

  public paddleBounce() {
    this.vibrate(10);
  }

  public wallBounce() {
    this.vibrate(6);
  }

  public brickBreak(type: 'normal' | 'armored' | 'explosive' | 'indestructible') {
    if (type === 'explosive') {
      this.vibrate([25, 30, 30]);
    } else if (type === 'armored') {
      this.vibrate(16);
    } else if (type === 'indestructible') {
      this.vibrate(20);
    } else {
      this.vibrate(10);
    }
  }

  public powerUp() {
    this.vibrate([12, 18, 16]);
  }

  public laserShot() {
    this.vibrate(8);
  }

  public launch() {
    this.vibrate(15);
  }

  public ballLost() {
    this.vibrate([40, 40, 70]);
  }

  public buttonTap() {
    this.vibrate(8);
  }
}

export const haptics = new HapticsEngine();
export default haptics;
