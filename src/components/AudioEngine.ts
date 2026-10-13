/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  constructor() {
    // Lazy initialisation to prevent autoplay block in browsers
  }

  private init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    } catch (e) {
      console.warn("Web Audio API is not supported in this browser:", e);
    }
  }

  private resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play a simple synthesized tone
  private playTone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainStart: number = 0.1,
    gainEnd: number = 0.01
  ) {
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, this.ctx.currentTime);
    if (freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(freqEnd, this.ctx.currentTime + duration);
    }

    gainNode.gain.setValueAtTime(gainStart, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(gainEnd, this.ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  // Sound: Ball bounce on paddle
  public playPaddleBounce() {
    this.playTone(300, 450, 0.08, 'triangle', 0.15, 0.01);
  }

  // Sound: Ball bounce on wall
  public playWallBounce() {
    this.playTone(200, 240, 0.06, 'sine', 0.1, 0.01);
  }

  // Sound: Laser shot from paddle
  public playLaserShot() {
    this.playTone(800, 150, 0.15, 'sawtooth', 0.08, 0.01);
  }

  // Sound: Brick hit or broken
  public playBrickHit(type: 'normal' | 'armored' | 'explosive' | 'indestructible', broken: boolean) {
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    if (type === 'indestructible') {
      // Solid metallic clack
      this.playTone(180, 120, 0.1, 'triangle', 0.12, 0.01);
      return;
    }

    if (type === 'armored' && !broken) {
      // Heavy clink
      this.playTone(280, 200, 0.08, 'sawtooth', 0.1, 0.01);
      return;
    }

    if (type === 'explosive') {
      // Noise-based explosion
      try {
        const bufferSize = this.ctx.sampleRate * 0.3; // 0.3s
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, now);
        filter.frequency.exponentialRampToValueAtTime(50, now + 0.3);

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0.25, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        noise.start();
        return;
      } catch (e) {
        // Fallback tone explosion
        this.playTone(150, 40, 0.35, 'sawtooth', 0.25, 0.01);
        return;
      }
    }

    // Normal brick breaks or armored broken
    const baseFreq = type === 'armored' ? 320 : 440;
    this.playTone(baseFreq, baseFreq * 1.5, 0.12, 'sine', 0.15, 0.01);
  }

  // Sound: Collect powerup
  public playPowerUp(isGood: boolean) {
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    if (isGood) {
      // Arpeggio up
      const freqs = [330, 415, 494, 660]; // E major chord
      freqs.forEach((f, idx) => {
        const osc = this.ctx!.createOscillator();
        const gainNode = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + idx * 0.06);

        gainNode.gain.setValueAtTime(0.12, now + idx * 0.06);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.06 + 0.15);

        osc.connect(gainNode);
        gainNode.connect(this.ctx!.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.18);
      });
    } else {
      // Descending sad tone
      const freqs = [220, 196, 175, 147];
      freqs.forEach((f, idx) => {
        const osc = this.ctx!.createOscillator();
        const gainNode = this.ctx!.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, now + idx * 0.08);

        gainNode.gain.setValueAtTime(0.1, now + idx * 0.08);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.12);

        osc.connect(gainNode);
        gainNode.connect(this.ctx!.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.15);
      });
    }
  }

  // Sound: Combo reward chime, scales up with multiplier
  public playComboChime(multiplier: number) {
    // Scale tone based on multiplier
    const step = Math.min(8, Math.floor(multiplier * 2));
    const base = 523.25; // C5
    // Pentatonic scale multipliers
    const scale = [1, 1.125, 1.25, 1.5, 1.667, 2, 2.25, 2.5, 3];
    const freq = base * (scale[step % scale.length] || 1);
    this.playTone(freq, freq * 1.05, 0.15, 'sine', 0.15, 0.01);
  }

  // Sound: Level completed fanfare
  public playLevelClear() {
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 392.00, 523.25, 659.25]; // C4-E4-G4-C5-G4-C5-E5
    const durations = [0.1, 0.1, 0.1, 0.15, 0.1, 0.1, 0.3];
    let time = now;

    notes.forEach((f, idx) => {
      const osc = this.ctx!.createOscillator();
      const gainNode = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, time);

      gainNode.gain.setValueAtTime(0.15, time);
      gainNode.gain.exponentialRampToValueAtTime(0.01, time + durations[idx]);

      osc.connect(gainNode);
      gainNode.connect(this.ctx!.destination);

      osc.start(time);
      osc.stop(time + durations[idx]);

      time += durations[idx] - 0.02;
    });
  }

  // Sound: Game Over tune
  public playGameOver() {
    if (!this.enabled) return;
    this.resume();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [392.00, 349.23, 311.13, 261.63, 233.08, 196.00]; // G4-F4-Eb4-C4-Bb3-G3
    const durations = [0.15, 0.15, 0.15, 0.2, 0.2, 0.4];
    let time = now;

    notes.forEach((f, idx) => {
      const osc = this.ctx!.createOscillator();
      const gainNode = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, time);

      gainNode.gain.setValueAtTime(0.15, time);
      gainNode.gain.exponentialRampToValueAtTime(0.01, time + durations[idx]);

      osc.connect(gainNode);
      gainNode.connect(this.ctx!.destination);

      osc.start(time);
      osc.stop(time + durations[idx]);

      time += durations[idx] - 0.03;
    });
  }

  // Sound: Ball launch
  public playLaunch() {
    this.playTone(250, 600, 0.15, 'sine', 0.12, 0.01);
  }
}

export const audio = new AudioEngine();
export default audio;
