import { Config } from '../core/Config.js';

export class Renderer {
    constructor() {
        this.canvases = {};
        this.contexts = {};
        this.screenWidth = 0;
        this.screenHeight = 0;
    }

    init() {
        const layers = ['background', 'terrain', 'entities', 'effects', 'ui'];
        for (const layer of layers) {
            const canvas = document.getElementById(`canvas-${layer}`);
            this.canvases[layer] = canvas;
            this.contexts[layer] = canvas.getContext('2d', { alpha: layer !== 'background' });
        }

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.screenWidth = window.innerWidth;
        this.screenHeight = window.innerHeight;

        for (const name in this.canvases) {
            const canvas = this.canvases[name];
            canvas.width = this.screenWidth;
            canvas.height = this.screenHeight;
        }
    }

    clear(layer) {
        const ctx = this.contexts[layer];
        ctx.clearRect(0, 0, this.screenWidth, this.screenHeight);
    }

    clearAll() {
        for (const layer in this.contexts) {
            this.clear(layer);
        }
    }

    renderSky(camera, theme) {
        const ctx = this.contexts.background;
        const sw = this.screenWidth;
        const sh = this.screenHeight;
        ctx.save();

        // Sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, sh);
        gradient.addColorStop(0, theme.skyTop);
        gradient.addColorStop(1, theme.skyBottom);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, sw, sh);

        // Clouds (parallax)
        const view = camera.getView();
        const cloudOff1 = view.x * 0.06;
        const cloudOff2 = view.x * 0.03;

        if (theme.name !== 'Hell') {
            // Sun disk with glow
            const sunX = sw * 0.8 - cloudOff2 * 0.3;
            const sunY = sh * 0.12;
            // Outer glow
            const sunGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 120);
            sunGlow.addColorStop(0, 'rgba(255, 255, 200, 0.4)');
            sunGlow.addColorStop(0.3, 'rgba(255, 240, 150, 0.15)');
            sunGlow.addColorStop(1, 'rgba(255, 200, 100, 0)');
            ctx.fillStyle = sunGlow;
            ctx.fillRect(sunX - 120, sunY - 120, 240, 240);
            // Sun body
            const sunBody = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 25);
            sunBody.addColorStop(0, 'rgba(255, 255, 240, 0.95)');
            sunBody.addColorStop(0.7, 'rgba(255, 240, 180, 0.7)');
            sunBody.addColorStop(1, 'rgba(255, 200, 100, 0)');
            ctx.fillStyle = sunBody;
            ctx.beginPath();
            ctx.arc(sunX, sunY, 30, 0, Math.PI * 2);
            ctx.fill();

            // Atmospheric haze band (light band near horizon)
            const hazeGrad = ctx.createLinearGradient(0, sh * 0.6, 0, sh);
            hazeGrad.addColorStop(0, 'rgba(200, 220, 240, 0)');
            hazeGrad.addColorStop(0.5, 'rgba(180, 210, 240, 0.08)');
            hazeGrad.addColorStop(1, 'rgba(160, 200, 230, 0.15)');
            ctx.fillStyle = hazeGrad;
            ctx.fillRect(0, sh * 0.6, sw, sh * 0.4);

            // Far clouds
            ctx.fillStyle = 'rgba(255,255,255,0.18)';
            for (let i = 0; i < 5; i++) {
                const cx = ((i * 500 + 200) - cloudOff2) % (sw + 600) - 300;
                const cy = 25 + (i % 3) * 30;
                this.drawCloud(ctx, cx, cy, 70 + (i % 3) * 25);
            }

            // Near clouds
            ctx.fillStyle = 'rgba(255,255,255,0.32)';
            for (let i = 0; i < 6; i++) {
                const cx = ((i * 380 + 80) - cloudOff1) % (sw + 500) - 250;
                const cy = 50 + (i % 3) * 50 + Math.sin(i * 2.3) * 15;
                this.drawCloud(ctx, cx, cy, 60 + (i % 4) * 20);
            }
        } else {
            // Hell: red glow from below
            const lavaGlow = ctx.createLinearGradient(0, sh * 0.5, 0, sh);
            lavaGlow.addColorStop(0, 'rgba(100, 10, 0, 0)');
            lavaGlow.addColorStop(1, 'rgba(180, 40, 0, 0.25)');
            ctx.fillStyle = lavaGlow;
            ctx.fillRect(0, 0, sw, sh);

            // Smoke-like dark clouds
            ctx.fillStyle = 'rgba(40,10,0,0.15)';
            for (let i = 0; i < 5; i++) {
                const cx = ((i * 400 + 100) - cloudOff1) % (sw + 500) - 250;
                const cy = 60 + (i % 3) * 50;
                this.drawCloud(ctx, cx, cy, 80 + (i % 3) * 30);
            }
        }

        ctx.restore();
    }

    drawCloud(ctx, x, y, size) {
        ctx.beginPath();
        ctx.arc(x, y, size * 0.35, 0, Math.PI * 2);
        ctx.arc(x + size * 0.22, y - size * 0.12, size * 0.32, 0, Math.PI * 2);
        ctx.arc(x + size * 0.48, y - size * 0.04, size * 0.28, 0, Math.PI * 2);
        ctx.arc(x + size * 0.65, y + size * 0.02, size * 0.22, 0, Math.PI * 2);
        ctx.arc(x + size * 0.12, y + size * 0.08, size * 0.26, 0, Math.PI * 2);
        ctx.arc(x + size * 0.38, y + size * 0.1, size * 0.24, 0, Math.PI * 2);
        ctx.fill();
    }

    getContext(layer) {
        return this.contexts[layer];
    }

    getCanvas(layer) {
        return this.canvases[layer];
    }
}
