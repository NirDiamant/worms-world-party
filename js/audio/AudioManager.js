import { SoundSynth } from './SoundSynth.js';

export class AudioManager {
    constructor() {
        this.ctx = null;
        this.synth = null;
        this.masterVolume = 0.5;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.synth = new SoundSynth(this.ctx);
            this.initialized = true;
        } catch (e) {
            console.warn('Audio not available:', e);
        }
    }

    ensureInit() {
        if (!this.initialized) {
            this.init();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    play(sound, params = {}) {
        this.ensureInit();
        if (!this.synth) return;

        try {
            this.synth.play(sound, { ...params, volume: this.masterVolume });
        } catch (e) {
            // Silently fail for audio errors
        }
    }

    setVolume(vol) {
        this.masterVolume = Math.max(0, Math.min(1, vol));
    }
}
