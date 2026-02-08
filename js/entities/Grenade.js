import { Projectile } from './Projectile.js';

export class Grenade extends Projectile {
    constructor(game, x, y, vx, vy, fuseTime = 3) {
        super(game, x, y, vx, vy);
        this.damage = 50;
        this.blastRadius = 55;
        this.fuseTimer = fuseTime;
        this.bounceFactor = 0.5;
        this.maxBounces = -1; // Unlimited bounces
        this.affectedByWind = false;
        this.width = 6;
        this.height = 6;
    }

    emitTrail() {
        // No smoke trail for grenade, just a faint one near detonation
        if (this.fuseTimer < 1) {
            this.game.particles.emit({
                x: this.x, y: this.y - 4, count: 1,
                speed: 10, life: 0.2, size: 2,
                color: { r: 255, g: 200, b: 0 },
                gravity: false, fade: true,
            });
        }
    }

    draw(ctx, x, y) {
        // Danger glow when close to detonation
        if (this.fuseTimer < 1 && this.fuseTimer > 0) {
            const pulse = Math.sin(this.fuseTimer * 20);
            if (pulse > 0) {
                ctx.globalAlpha = 0.4 * pulse;
                ctx.fillStyle = '#FF3200';
                ctx.fillRect(x - 6, y - 6, 12, 12);
                ctx.globalAlpha = 1;
            }
        }

        const sprite = this.game.sprites.createProjectileSprite('grenade');
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(sprite, x - sprite.width / 2, y - sprite.height / 2);

        // Fuse timer display
        if (this.fuseTimer > 0) {
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2.5;
            const timeStr = Math.ceil(this.fuseTimer).toString();
            ctx.strokeText(timeStr, x, y - 10);
            ctx.fillText(timeStr, x, y - 10);
        }
    }
}
