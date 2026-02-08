import { Config } from './Config.js';

export class GameLoop {
    constructor(updateFn, renderFn) {
        this.updateFn = updateFn;
        this.renderFn = renderFn;
        this.running = false;
        this.accumulator = 0;
        this.lastTime = 0;
        this.frameId = null;
        this.alpha = 0; // interpolation factor
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        this.accumulator = 0;
        this.frameId = requestAnimationFrame((t) => this.tick(t));
    }

    stop() {
        this.running = false;
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }
    }

    tick(currentTime) {
        if (!this.running) return;

        let frameTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Clamp large frame gaps (e.g. tab switch)
        if (frameTime > Config.FIXED_DT * Config.MAX_FRAME_SKIP) {
            frameTime = Config.FIXED_DT * Config.MAX_FRAME_SKIP;
        }

        this.accumulator += frameTime;

        let steps = 0;
        while (this.accumulator >= Config.FIXED_DT && steps < Config.MAX_FRAME_SKIP) {
            this.updateFn(Config.FIXED_DT);
            this.accumulator -= Config.FIXED_DT;
            steps++;
        }

        // Interpolation factor for smooth rendering
        this.alpha = this.accumulator / Config.FIXED_DT;

        this.renderFn(this.alpha);

        this.frameId = requestAnimationFrame((t) => this.tick(t));
    }
}
