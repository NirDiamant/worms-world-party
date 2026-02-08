import { Entity } from './Entity.js';
import { Utils } from '../core/Utils.js';

export class Mine extends Entity {
    constructor(game, x, y) {
        super(game, x, y);
        this.width = 8;
        this.height = 8;
        this.damage = 55;
        this.blastRadius = 55;
        this.proximityRadius = 40;
        this.armed = false;
        this.armTimer = 2.0; // Arm after 2 seconds
        this.fuseTimer = -1;
        this.fuseTime = 0.5; // Beep then explode
        this.affectedByGravity = true;
        this.bounceFactor = 0.2;
        this.owner = null;
        this.blinkTimer = 0;
    }

    update(dt) {
        super.update(dt);

        if (!this.armed) {
            this.armTimer -= dt;
            if (this.armTimer <= 0) {
                this.armed = true;
            }
        }

        // Proximity check when armed
        if (this.armed && this.fuseTimer < 0) {
            for (const entity of this.game.entities) {
                if (entity === this || !entity.alive || !entity.team) continue;
                const dist = Utils.distance(this.x, this.y, entity.x, entity.y);
                if (dist < this.proximityRadius) {
                    this.fuseTimer = this.fuseTime;
                    break;
                }
            }
        }

        // Fuse countdown
        if (this.fuseTimer > 0) {
            this.fuseTimer -= dt;
            if (this.fuseTimer <= 0) {
                this.detonate();
            }
        }

        // Blink
        this.blinkTimer += dt;
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
        const sprite = this.game.sprites.createProjectileSprite('mine');
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(sprite, x - sprite.width / 2, y - sprite.height / 2);

        // Blinking light overlay when armed
        if (this.armed) {
            const blink = Math.sin(this.blinkTimer * (this.fuseTimer > 0 ? 15 : 3)) > 0;
            if (blink) {
                ctx.fillStyle = '#ff3333';
                ctx.fillRect(x - 1, y - 3, 2, 2);
            }
        }
    }
}
