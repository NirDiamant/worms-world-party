import { Entity } from './Entity.js';
import { Utils } from '../core/Utils.js';

export class Projectile extends Entity {
    constructor(game, x, y, vx, vy) {
        super(game, x, y);
        this.vx = vx;
        this.vy = vy;
        this.affectedByGravity = true;
        this.affectedByWind = true;
        this.bounceFactor = 0;
        this.bounceCount = 0;
        this.maxBounces = 0;
        this.fuseTimer = -1; // -1 = no fuse (contact detonation)
        this.damage = 50;
        this.blastRadius = 55;
        this.owner = null;
        this.width = 6;
        this.height = 6;
        this.rotation = 0;
        this.trailTimer = 0;
    }

    update(dt) {
        super.update(dt);

        // Fuse countdown
        if (this.fuseTimer > 0) {
            this.fuseTimer -= dt;
            if (this.fuseTimer <= 0) {
                this.detonate();
                return;
            }
        }

        // Rotation to face velocity
        if (this.vx !== 0 || this.vy !== 0) {
            this.rotation = Math.atan2(this.vy, this.vx);
        }

        // Smoke trail
        this.trailTimer += dt;
        if (this.trailTimer > 0.05) {
            this.trailTimer = 0;
            this.emitTrail();
        }

        // Check water
        if (this.game.water.isSubmerged(this.x, this.y)) {
            this.game.particles.emitSplash(this.x, this.game.water.level);
            this.game.audio.play('splash');
            this.alive = false;
        }
    }

    emitTrail() {
        this.game.particles.emitSmoke(this.x, this.y);
    }

    onTerrainHit(nx, ny) {
        if (this.bounceFactor > 0 && (this.maxBounces < 0 || this.bounceCount < this.maxBounces)) {
            // Bounce
            const dot = this.vx * nx + this.vy * ny;
            this.vx -= 2 * dot * nx;
            this.vy -= 2 * dot * ny;
            this.vx *= this.bounceFactor;
            this.vy *= this.bounceFactor;
            this.bounceCount++;
            this.game.audio.play('bounce');

            // Move out of terrain
            this.x += nx * 2;
            this.y += ny * 2;
        } else if (this.fuseTimer <= 0) {
            // Contact detonation
            this.detonate();
        } else {
            // Stop but wait for fuse
            this.vx *= 0.3;
            this.vy *= 0.3;
        }
    }

    onEntityHit(entity) {
        if (this.fuseTimer <= 0) {
            this.detonate();
        }
    }

    detonate() {
        if (!this.alive) return;
        this.alive = false;
        this.game.addExplosion(this.x, this.y, this.blastRadius, this.damage, this.owner);
        this.game.particles.emitExplosion(this.x, this.y, this.blastRadius);
        this.game.camera.shake(this.blastRadius * 0.3);
        this.game.audio.play('explosion', { size: this.blastRadius });
    }

    draw(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.rotation);

        // Default: small circle
        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
