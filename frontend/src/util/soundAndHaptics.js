/**
 * Sound and Haptic Feedback System for Smart Check-in (Distribution Academy).
 * 
 * Uses standard Web Audio API (zero external assets, 0ms latency, PWA/offline compatible)
 * and Web Vibration API (native mobile haptics).
 */

class SoundAndHapticsManager {
  audioCtx = null;
  soundEnabled = true;
  hapticsEnabled = true;

  constructor() {
    // Load initial preference from localStorage if in browser
    if (typeof window !== 'undefined') {
      try {
        const savedSound = localStorage.getItem('smartcheckin_sound_enabled');
        if (savedSound !== null) this.soundEnabled = savedSound === 'true';

        const savedHaptics = localStorage.getItem('smartcheckin_haptics_enabled');
        if (savedHaptics !== null) this.hapticsEnabled = savedHaptics === 'true';
      } catch (e) {
        console.debug('[Audio/Haptics] LocalStorage preference read error:', e);
      }
    }
  }

  getAudioContext() {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx?.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  setSoundEnabled(enabled) {
    this.soundEnabled = !!enabled;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('smartcheckin_sound_enabled', String(this.soundEnabled));
      } catch (e) {
        console.debug('[Audio] LocalStorage write error:', e);
      }
    }
  }

  setHapticsEnabled(enabled) {
    this.hapticsEnabled = !!enabled;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('smartcheckin_haptics_enabled', String(this.hapticsEnabled));
      } catch (e) {
        console.debug('[Haptics] LocalStorage write error:', e);
      }
    }
  }

  isSoundEnabled() {
    return this.soundEnabled;
  }

  isHapticsEnabled() {
    return this.hapticsEnabled;
  }

  // ==========================================
  // HAPTIC FEEDBACK (Vibration API)
  // ==========================================

  vibrate(pattern) {
    if (!this.hapticsEnabled || typeof window === 'undefined' || !navigator.vibrate) {
      return;
    }
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      console.debug('[Haptics] Vibration error:', e);
    }
  }

  hapticSuccess() {
    this.vibrate([35, 50, 35]);
  }

  hapticError() {
    this.vibrate([80, 50, 80]);
  }

  hapticWarning() {
    this.vibrate([50]);
  }

  hapticTap() {
    this.vibrate([15]);
  }

  // ==========================================
  // AUDIO SYNTHESIS (Web Audio API)
  // ==========================================

  playTone(freq, type, duration, startTime = 0, gainLevel = 0.15) {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime + startTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(gainLevel, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      console.debug('[Audio] PlayTone error:', e);
    }
  }

  /**
   * Success Chime: Upward melodic chord (D5 -> A5)
   */
  playSuccess() {
    this.hapticSuccess();
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // First note (D5 - 587.33Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.18);

      // Second note (A5 - 880Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.0, now + 0.10);
      gain2.gain.setValueAtTime(0.15, now + 0.10);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.10);
      osc2.stop(now + 0.35);
    } catch (e) {
      console.debug('[Audio] PlaySuccess error:', e);
    }
  }

  /**
   * Error Tone: Low double blip (Eb4 -> A3)
   */
  playError() {
    this.hapticError();
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Note 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(311.13, now);
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.12);

      // Note 2
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(220.0, now + 0.12);
      gain2.gain.setValueAtTime(0.18, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.30);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.30);
    } catch (e) {
      console.debug('[Audio] PlayError error:', e);
    }
  }

  /**
   * Warning Tone: Alert double beep
   */
  playWarning() {
    this.hapticWarning();
    if (!this.soundEnabled) return;
    this.playTone(659.25, 'sine', 0.10, 0, 0.10);
    this.playTone(659.25, 'sine', 0.12, 0.12, 0.10);
  }

  /**
   * Info / Bell Chime: Glassy notification bell
   */
  playInfo() {
    this.hapticTap();
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(783.99, now); // G5
      gain.gain.setValueAtTime(0.10, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.28);
    } catch (e) {
      console.debug('[Audio] PlayInfo error:', e);
    }
  }

  /**
   * QR Scanner Beep: Crisp high-tech scanner ping
   */
  playScanBeep() {
    this.hapticSuccess();
    if (!this.soundEnabled) return;
    this.playTone(1046.5, 'sine', 0.08, 0, 0.16); // High C6 crisp beep
  }

  /**
   * Keypad / Button Click: Subtle tactile micro-tap
   */
  playClick() {
    this.hapticTap();
    if (!this.soundEnabled) return;
    this.playTone(400, 'sine', 0.03, 0, 0.04);
  }
}

export const soundAndHaptics = new SoundAndHapticsManager();
export default soundAndHaptics;
