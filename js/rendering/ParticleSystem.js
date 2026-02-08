import { Config } from '../core/Config.js';
import { Utils } from '../core/Utils.js';

class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.alive = false;
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.life = 0;
        this.maxLife = 0;
        this.size = 2;
        this.baseSize = 2;
        this.color = { r: 255, g: 255, b: 255 };
        this.alpha = 1;
        this.gravity = true;
        this.shrink = true;
        this.fade = true;
        this.grow = false;
        this.type = 'default';
    }
}

export class ParticleSystem {
    constructor() {
        this.pool = [];
        this.poolSize = Config.PARTICLE_POOL_SIZE;
        for (let i = 0; i < this.poolSize; i++) {
            this.pool.push(new Particle());
        }
    }

    getParticle() {
        for (const p of this.pool) {
            if (!p.alive) return p;
        }
        return null; // Pool exhausted
    }

    emit(config) {
        const count = config.count || 1;
        for (let i = 0; i < count; i++) {
            const p = this.getParticle();
            if (!p) return;

            p.alive = true;
            p.x = config.x + (config.spreadX ? Utils.randomRange(-config.spreadX, config.spreadX) : 0);
            p.y = config.y + (config.spreadY ? Utils.randomRange(-config.spreadY, config.spreadY) : 0);

            const speed = config.speed || 100;
            const speedVar = config.speedVariance || 0.5;
            const actualSpeed = speed * Utils.randomRange(1 - speedVar, 1 + speedVar);

            if (config.angle !== undefined) {
                const angleVar = config.angleVariance || 0;
                const angle = config.angle + Utils.randomRange(-angleVar, angleVar);
                p.vx = Math.cos(angle) * actualSpeed;
                p.vy = Math.sin(angle) * actualSpeed;
            } else {
                // Random direction
                const angle = Utils.randomRange(0, Math.PI * 2);
                p.vx = Math.cos(angle) * actualSpeed;
                p.vy = Math.sin(angle) * actualSpeed;
            }

            p.life = config.life || 1;
            p.maxLife = p.life;
            p.size = config.size || 3;

            if (config.color) {
                p.color = { ...config.color };
            } else if (config.colors) {
                p.color = { ...Utils.randomChoice(config.colors) };
            }

            p.alpha = config.alpha || 1;
            p.gravity = config.gravity !== undefined ? config.gravity : true;
            p.shrink = config.shrink !== undefined ? config.shrink : true;
            p.fade = config.fade !== undefined ? config.fade : true;
            p.grow = config.grow || false;
            p.type = config.type || 'default';
            p.baseSize = p.size;
        }
    }

    // Preset emitters
    emitExplosion(x, y, radius) {
        // Fire/orange particles (bigger, with glow type)
        this.emit({
            x, y, count: Math.floor(radius * 1.5),
            speed: radius * 4, speedVariance: 0.6,
            life: 0.5, size: 7,
            colors: [
                { r: 255, g: 200, b: 50 },
                { r: 255, g: 150, b: 30 },
                { r: 255, g: 100, b: 10 },
                { r: 255, g: 80, b: 0 },
            ],
            gravity: true, shrink: true, fade: true,
            type: 'fire',
        });

        // Smoke (bigger, grows over time)
        this.emit({
            x, y, count: Math.floor(radius * 0.8),
            speed: radius * 1.5, speedVariance: 0.8,
            life: 1.5, size: 14,
            colors: [
                { r: 80, g: 80, b: 80 },
                { r: 60, g: 60, b: 60 },
                { r: 100, g: 100, b: 100 },
            ],
            gravity: false, shrink: false, fade: true, grow: true,
            spreadX: radius * 0.3, spreadY: radius * 0.3,
            type: 'smoke',
        });

        // Dirt/debris (bigger)
        this.emit({
            x, y, count: Math.floor(radius * 0.8),
            speed: radius * 3, speedVariance: 0.5,
            angle: -Math.PI / 2, angleVariance: Math.PI * 0.8,
            life: 1.0, size: 5,
            colors: [
                { r: 139, g: 90, b: 43 },
                { r: 101, g: 67, b: 33 },
                { r: 120, g: 80, b: 40 },
            ],
            gravity: true, shrink: false, fade: false,
        });

        // Lingering dust
        this.emitDust(x, y, radius);
    }

    emitDust(x, y, radius) {
        this.emit({
            x, y, count: Math.floor(radius * 0.4),
            speed: radius * 0.8, speedVariance: 0.8,
            life: 2.5, size: 10,
            colors: [
                { r: 160, g: 150, b: 130 },
                { r: 140, g: 135, b: 120 },
                { r: 130, g: 125, b: 110 },
            ],
            alpha: 0.4,
            gravity: false, shrink: false, fade: true, grow: true,
            spreadX: radius * 0.5, spreadY: radius * 0.3,
            type: 'smoke',
        });
    }

    emitSplash(x, y) {
        this.emit({
            x, y, count: 25,
            speed: 120, speedVariance: 0.5,
            angle: -Math.PI / 2, angleVariance: Math.PI * 0.3,
            life: 0.8, size: 5,
            colors: [
                { r: 100, g: 180, b: 255 },
                { r: 150, g: 210, b: 255 },
                { r: 80, g: 150, b: 230 },
            ],
            gravity: true, shrink: true, fade: true,
        });
    }

    emitSmoke(x, y) {
        this.emit({
            x, y, count: 3,
            speed: 20, speedVariance: 0.5,
            angle: -Math.PI / 2, angleVariance: 0.3,
            life: 1.0, size: 4,
            colors: [
                { r: 150, g: 150, b: 150 },
                { r: 120, g: 120, b: 120 },
            ],
            gravity: false, shrink: false, fade: true,
        });
    }

    emitFire(x, y) {
        this.emit({
            x, y, count: 2,
            speed: 30, speedVariance: 0.5,
            angle: -Math.PI / 2, angleVariance: 0.4,
            life: 0.4, size: 3,
            colors: [
                { r: 255, g: 200, b: 50 },
                { r: 255, g: 100, b: 0 },
                { r: 255, g: 50, b: 0 },
            ],
            gravity: false, shrink: true, fade: true,
        });
    }

    update(dt) {
        for (const p of this.pool) {
            if (!p.alive) continue;

            p.life -= dt;
            if (p.life <= 0) {
                p.alive = false;
                continue;
            }

            if (p.gravity) {
                p.vy += 350 * dt; // Gravity
            }

            p.x += p.vx * dt;
            p.y += p.vy * dt;

            // Friction
            p.vx *= 0.99;
            if (!p.gravity) p.vy *= 0.99;

            const lifeRatio = p.life / p.maxLife;
            if (p.fade) p.alpha = lifeRatio;
            if (p.grow) {
                // Smoke/dust grows over time
                p.size = p.baseSize * (2 - lifeRatio);
            } else if (p.shrink) {
                p.size = Math.max(0.5, p.size * (0.95 + 0.05 * lifeRatio));
            }
        }
    }

    render(ctx) {
        for (const p of this.pool) {
            if (!p.alive) continue;

            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = `rgb(${p.color.r},${p.color.g},${p.color.b})`;

            if (p.type === 'fire') {
                // Soft radial gradient fire particle (2010-era quality)
                const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                grad.addColorStop(0, `rgba(${Math.min(255, p.color.r + 40)}, ${Math.min(255, p.color.g + 60)}, ${Math.min(255, p.color.b + 40)}, ${p.alpha})`);
                grad.addColorStop(0.4, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.alpha * 0.7})`);
                grad.addColorStop(1, `rgba(${p.color.r}, ${Math.max(0, p.color.g - 30)}, 0, 0)`);
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'smoke' || p.size > 4) {
                // Round particles for smoke/large effects
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Small particles stay square (faster)
                ctx.fillRect(
                    p.x - p.size / 2,
                    p.y - p.size / 2,
                    p.size,
                    p.size
                );
            }
        }
        ctx.globalAlpha = 1;
    }

    clear() {
        for (const p of this.pool) {
            p.alive = false;
        }
    }

    get activeCount() {
        return this.pool.filter(p => p.alive).length;
    }
}
