export class SoundSynth {
    constructor(audioCtx) {
        this.ctx = audioCtx;
    }

    play(sound, params = {}) {
        const vol = params.volume || 0.5;
        const now = this.ctx.currentTime;

        switch (sound) {
            case 'explosion':
                this.playExplosion(now, vol, params.size || 40);
                break;
            case 'fire':
                this.playFire(now, vol);
                break;
            case 'bounce':
                this.playBounce(now, vol);
                break;
            case 'splash':
                this.playSplash(now, vol);
                break;
            case 'hurt':
                this.playHurt(now, vol);
                break;
            case 'death':
                this.playDeath(now, vol);
                break;
            case 'jump':
                this.playJump(now, vol);
                break;
            case 'shotgun':
                this.playShotgun(now, vol);
                break;
            case 'uzi':
                this.playUzi(now, vol);
                break;
            case 'punch':
                this.playPunch(now, vol);
                break;
            case 'bat':
                this.playBat(now, vol);
                break;
            case 'prod':
                this.playProd(now, vol);
                break;
            case 'collect':
                this.playCollect(now, vol);
                break;
            case 'teleport':
                this.playTeleport(now, vol);
                break;
            case 'airstrike':
                this.playAirStrike(now, vol);
                break;
            case 'blowtorch':
            case 'drill':
                this.playDrill(now, vol);
                break;
            case 'girder':
                this.playGirder(now, vol);
                break;
            case 'click':
                this.playClick(now, vol);
                break;
            case 'fallDamage':
                this.playFallDamage(now, vol);
                break;
            case 'donkey':
            case 'armageddon':
            case 'earthquake':
                this.playBigEvent(now, vol);
                break;
            case 'walk':
                this.playWalk(now, vol);
                break;
            case 'select':
                this.playSelect(now, vol);
                break;
            case 'countdown':
                this.playCountdown(now, vol);
                break;
            case 'suddenDeath':
                this.playSuddenDeath(now, vol);
                break;
            case 'victory':
                this.playVictory(now, vol);
                break;
            case 'ropeAttach':
                this.playRopeAttach(now, vol);
                break;
        }
    }

    createGain(vol, time) {
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(vol, time);
        gain.connect(this.ctx.destination);
        return gain;
    }

    playExplosion(time, vol, size) {
        // White noise burst
        const duration = 0.3 + size * 0.005;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800 + size * 10, time);
        filter.frequency.exponentialRampToValueAtTime(100, time + duration);

        const gain = this.createGain(vol * 0.8, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        source.connect(filter);
        filter.connect(gain);
        source.start(time);

        // Low rumble
        const osc = this.ctx.createOscillator();
        osc.frequency.setValueAtTime(40 + size * 0.3, time);
        osc.frequency.exponentialRampToValueAtTime(20, time + duration * 1.5);
        const rumbleGain = this.createGain(vol * 0.4, time);
        rumbleGain.gain.exponentialRampToValueAtTime(0.001, time + duration * 1.5);
        osc.connect(rumbleGain);
        osc.start(time);
        osc.stop(time + duration * 1.5);
    }

    playFire(time, vol) {
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, time);
        osc.frequency.exponentialRampToValueAtTime(800, time + 0.1);
        osc.frequency.exponentialRampToValueAtTime(100, time + 0.2);

        const gain = this.createGain(vol * 0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
        osc.connect(gain);
        osc.start(time);
        osc.stop(time + 0.2);
    }

    playBounce(time, vol) {
        const osc = this.ctx.createOscillator();
        osc.frequency.setValueAtTime(400, time);
        osc.frequency.exponentialRampToValueAtTime(100, time + 0.05);

        const gain = this.createGain(vol * 0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
        osc.connect(gain);
        osc.start(time);
        osc.stop(time + 0.05);
    }

    playSplash(time, vol) {
        const duration = 0.4;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1000, time);
        filter.Q.setValueAtTime(2, time);

        const gain = this.createGain(vol * 0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        source.connect(filter);
        filter.connect(gain);
        source.start(time);
    }

    playHurt(time, vol) {
        const osc = this.ctx.createOscillator();
        osc.frequency.setValueAtTime(600, time);
        osc.frequency.linearRampToValueAtTime(200, time + 0.15);

        const gain = this.createGain(vol * 0.25, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
        osc.connect(gain);
        osc.start(time);
        osc.stop(time + 0.15);
    }

    playDeath(time, vol) {
        const osc = this.ctx.createOscillator();
        osc.frequency.setValueAtTime(400, time);
        osc.frequency.linearRampToValueAtTime(100, time + 0.4);

        const gain = this.createGain(vol * 0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
        osc.connect(gain);
        osc.start(time);
        osc.stop(time + 0.4);
    }

    playJump(time, vol) {
        const osc = this.ctx.createOscillator();
        osc.frequency.setValueAtTime(300, time);
        osc.frequency.exponentialRampToValueAtTime(600, time + 0.1);

        const gain = this.createGain(vol * 0.15, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
        osc.connect(gain);
        osc.start(time);
        osc.stop(time + 0.1);
    }

    playShotgun(time, vol) {
        const duration = 0.15;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.05));
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        const gain = this.createGain(vol * 0.5, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        source.connect(gain);
        source.start(time);
    }

    playUzi(time, vol) {
        const osc = this.ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(100, time);

        const gain = this.createGain(vol * 0.1, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
        osc.connect(gain);
        osc.start(time);
        osc.stop(time + 0.03);
    }

    playPunch(time, vol) {
        const osc = this.ctx.createOscillator();
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(50, time + 0.1);

        const gain = this.createGain(vol * 0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
        osc.connect(gain);
        osc.start(time);
        osc.stop(time + 0.1);
    }

    playBat(time, vol) {
        this.playPunch(time, vol * 1.2);
    }

    playProd(time, vol) {
        const osc = this.ctx.createOscillator();
        osc.frequency.setValueAtTime(800, time);
        const gain = this.createGain(vol * 0.1, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
        osc.connect(gain);
        osc.start(time);
        osc.stop(time + 0.03);
    }

    playCollect(time, vol) {
        // Ascending tones
        for (let i = 0; i < 3; i++) {
            const osc = this.ctx.createOscillator();
            osc.frequency.setValueAtTime(400 + i * 200, time + i * 0.05);
            const gain = this.createGain(vol * 0.2, time + i * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, time + i * 0.05 + 0.1);
            osc.connect(gain);
            osc.start(time + i * 0.05);
            osc.stop(time + i * 0.05 + 0.1);
        }
    }

    playTeleport(time, vol) {
        const osc = this.ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2000, time);
        osc.frequency.exponentialRampToValueAtTime(100, time + 0.3);

        const gain = this.createGain(vol * 0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
        osc.connect(gain);
        osc.start(time);
        osc.stop(time + 0.3);
    }

    playAirStrike(time, vol) {
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, time);
        osc.frequency.linearRampToValueAtTime(300, time + 1);

        const gain = this.createGain(vol * 0.15, time);
        gain.gain.linearRampToValueAtTime(vol * 0.3, time + 0.5);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 1.5);
        osc.connect(gain);
        osc.start(time);
        osc.stop(time + 1.5);
    }

    playDrill(time, vol) {
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, time);

        const lfo = this.ctx.createOscillator();
        lfo.frequency.setValueAtTime(20, time);
        const lfoGain = this.ctx.createGain();
        lfoGain.gain.setValueAtTime(50, time);
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        const gain = this.createGain(vol * 0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
        osc.connect(gain);
        osc.start(time);
        lfo.start(time);
        osc.stop(time + 0.5);
        lfo.stop(time + 0.5);
    }

    playGirder(time, vol) {
        const osc = this.ctx.createOscillator();
        osc.frequency.setValueAtTime(200, time);
        osc.frequency.setValueAtTime(300, time + 0.05);

        const gain = this.createGain(vol * 0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
        osc.connect(gain);
        osc.start(time);
        osc.stop(time + 0.1);
    }

    playClick(time, vol) {
        const osc = this.ctx.createOscillator();
        osc.frequency.setValueAtTime(1000, time);

        const gain = this.createGain(vol * 0.1, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
        osc.connect(gain);
        osc.start(time);
        osc.stop(time + 0.02);
    }

    playFallDamage(time, vol) {
        const osc = this.ctx.createOscillator();
        osc.frequency.setValueAtTime(300, time);
        osc.frequency.exponentialRampToValueAtTime(80, time + 0.2);

        const gain = this.createGain(vol * 0.3, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
        osc.connect(gain);
        osc.start(time);
        osc.stop(time + 0.2);
    }

    playBigEvent(time, vol) {
        // Deep rumble
        const osc = this.ctx.createOscillator();
        osc.frequency.setValueAtTime(30, time);
        osc.type = 'sawtooth';

        const gain = this.createGain(vol * 0.5, time);
        gain.gain.linearRampToValueAtTime(vol * 0.3, time + 1);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 2);
        osc.connect(gain);
        osc.start(time);
        osc.stop(time + 2);
    }

    playWalk(time, vol) {
        // Soft footstep thud
        const osc = this.ctx.createOscillator();
        osc.frequency.setValueAtTime(80 + Math.random() * 40, time);
        osc.frequency.exponentialRampToValueAtTime(40, time + 0.04);
        const gain = this.createGain(vol * 0.06, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
        osc.connect(gain);
        osc.start(time);
        osc.stop(time + 0.04);
    }

    playSelect(time, vol) {
        // Quick blip for weapon selection
        const osc = this.ctx.createOscillator();
        osc.frequency.setValueAtTime(600, time);
        osc.frequency.setValueAtTime(800, time + 0.03);
        const gain = this.createGain(vol * 0.12, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
        osc.connect(gain);
        osc.start(time);
        osc.stop(time + 0.06);
    }

    playCountdown(time, vol) {
        // Countdown beep (last 5 seconds)
        const osc = this.ctx.createOscillator();
        osc.frequency.setValueAtTime(880, time);
        const gain = this.createGain(vol * 0.15, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
        osc.connect(gain);
        osc.start(time);
        osc.stop(time + 0.1);
    }

    playSuddenDeath(time, vol) {
        // Ominous descending tone
        for (let i = 0; i < 4; i++) {
            const osc = this.ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(400 - i * 80, time + i * 0.15);
            const gain = this.createGain(vol * 0.25, time + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.001, time + i * 0.15 + 0.15);
            osc.connect(gain);
            osc.start(time + i * 0.15);
            osc.stop(time + i * 0.15 + 0.15);
        }
    }

    playVictory(time, vol) {
        // Ascending triumphant notes
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        for (let i = 0; i < notes.length; i++) {
            const osc = this.ctx.createOscillator();
            osc.frequency.setValueAtTime(notes[i], time + i * 0.12);
            const gain = this.createGain(vol * 0.2, time + i * 0.12);
            gain.gain.exponentialRampToValueAtTime(0.001, time + i * 0.12 + 0.2);
            osc.connect(gain);
            osc.start(time + i * 0.12);
            osc.stop(time + i * 0.12 + 0.2);
        }
    }

    playRopeAttach(time, vol) {
        // Metallic twang
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, time);
        osc.frequency.exponentialRampToValueAtTime(300, time + 0.15);
        const gain = this.createGain(vol * 0.15, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
        osc.connect(gain);
        osc.start(time);
        osc.stop(time + 0.15);
    }
}
