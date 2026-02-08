import { Config } from '../core/Config.js';

export class Water {
    constructor() {
        this.level = Config.WATER_LEVEL;
        this.time = 0;
        this.baseLevel = Config.WATER_LEVEL;
    }

    update(dt) {
        this.time += dt;
    }

    rise(amount) {
        this.level -= amount;
        this.baseLevel = this.level;
    }

    getWaveY(x) {
        return this.level +
            Math.sin(x * 0.02 + this.time * Config.WATER_WAVE_SPEED) * Config.WATER_WAVE_AMPLITUDE +
            Math.sin(x * 0.035 + this.time * Config.WATER_WAVE_SPEED * 1.3) * Config.WATER_WAVE_AMPLITUDE * 0.5 +
            Math.sin(x * 0.008 + this.time * Config.WATER_WAVE_SPEED * 0.5) * Config.WATER_WAVE_AMPLITUDE * 1.2 +
            Math.sin(x * 0.06 + this.time * Config.WATER_WAVE_SPEED * 2.5) * Config.WATER_WAVE_AMPLITUDE * 0.25;
    }

    isSubmerged(x, y) {
        return y >= this.getWaveY(x);
    }

    render(ctx, camera) {
        const { x: camX, y: camY, viewWidth, viewHeight, zoom } = camera.getView();

        const screenWidth = ctx.canvas.width;
        const screenHeight = ctx.canvas.height;

        // Only draw if water is visible
        const waterScreenY = (this.level - camY) * zoom;
        if (waterScreenY > screenHeight + 20) return;

        ctx.save();

        const waterBottom = screenHeight;
        const startX = Math.floor(camX);
        const endX = Math.ceil(camX + viewWidth);
        const step = Math.max(2, Math.floor(3 / zoom));

        // --- Main water body with single smooth sine wave edge ---
        ctx.beginPath();
        const firstWaveY = (this.getWaveY(startX) - camY) * zoom;
        ctx.moveTo((startX - camX) * zoom, firstWaveY);

        for (let wx = startX; wx <= endX; wx += step) {
            const wy = this.getWaveY(wx);
            const sx = (wx - camX) * zoom;
            const sy = (wy - camY) * zoom;
            ctx.lineTo(sx, sy);
        }

        ctx.lineTo((endX - camX) * zoom, waterBottom);
        ctx.lineTo((startX - camX) * zoom, waterBottom);
        ctx.closePath();

        // Solid blue water fill (more opaque, classic look)
        const gradY1 = (this.level - camY) * zoom;
        const gradY2 = waterBottom;
        if (!isFinite(gradY1) || !isFinite(gradY2) || gradY1 === gradY2) {
            ctx.fillStyle = 'rgba(20, 70, 160, 0.80)';
            ctx.fill();
            ctx.restore();
            return;
        }
        const gradient = ctx.createLinearGradient(0, gradY1, 0, gradY2);
        gradient.addColorStop(0, 'rgba(30, 100, 200, 0.70)');
        gradient.addColorStop(0.3, 'rgba(20, 70, 160, 0.80)');
        gradient.addColorStop(1, 'rgba(5, 20, 60, 0.92)');
        ctx.fillStyle = gradient;
        ctx.fill();

        // --- Depth shimmer (slow-moving brighter bands underwater) ---
        ctx.save();
        ctx.globalAlpha = 0.06;
        ctx.fillStyle = 'rgba(120, 200, 255, 1)';
        for (let i = 0; i < 4; i++) {
            const bandY = (this.level + 20 + i * 35 - camY) * zoom;
            const bandOffset = Math.sin(this.time * 0.3 + i * 1.5) * 40 * zoom;
            ctx.fillRect(bandOffset, bandY, screenWidth, 8 * zoom);
        }
        ctx.restore();

        // --- Surface highlight line ---
        ctx.beginPath();
        ctx.moveTo((startX - camX) * zoom, firstWaveY);
        for (let wx = startX; wx <= endX; wx += step) {
            const wy = this.getWaveY(wx);
            const sx = (wx - camX) * zoom;
            const sy = (wy - camY) * zoom;
            ctx.lineTo(sx, sy);
        }
        ctx.strokeStyle = 'rgba(180, 220, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // --- Secondary highlight line (slightly below, more transparent) ---
        ctx.beginPath();
        for (let wx = startX; wx <= endX; wx += step) {
            const wy = this.getWaveY(wx) + 3;
            const sx = (wx - camX) * zoom;
            const sy = (wy - camY) * zoom;
            if (wx === startX) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
        }
        ctx.strokeStyle = 'rgba(140, 190, 255, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // --- Foam dots at wave peaks ---
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        for (let wx = startX; wx <= endX; wx += step * 2) {
            const waveVal = Math.sin(wx * 0.02 + this.time * Config.WATER_WAVE_SPEED);
            if (waveVal > 0.7) {
                const wy = this.getWaveY(wx);
                const sx = (wx - camX) * zoom;
                const sy = (wy - camY) * zoom;
                const foamSize = (waveVal - 0.7) * 8 * zoom;
                ctx.globalAlpha = (waveVal - 0.7) * 2;
                ctx.beginPath();
                ctx.arc(sx, sy - 1 * zoom, foamSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;

        ctx.restore();
    }
}
