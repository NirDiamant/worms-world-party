import { Projectile } from './Projectile.js';
import { Utils } from '../core/Utils.js';

export class ClusterBomb extends Projectile {
    constructor(game, x, y, vx, vy, fuseTime = 3) {
        super(game, x, y, vx, vy);
        this.damage = 40;
        this.blastRadius = 40;
        this.fuseTimer = fuseTime;
        this.bounceFactor = 0.4;
        this.maxBounces = -1;
        this.affectedByWind = false;
        this.fragmentCount = 5;
        this.fragmentDamage = 30;
        this.fragmentRadius = 30;
    }

    detonate() {
        if (!this.alive) return;
        this.alive = false;

        // Initial explosion
        this.game.addExplosion(this.x, this.y, this.blastRadius, this.damage, this.owner);
        this.game.particles.emitExplosion(this.x, this.y, this.blastRadius);
        this.game.camera.shake(this.blastRadius * 0.3);
        this.game.audio.play('explosion', { size: this.blastRadius });

        // Spawn fragments
        for (let i = 0; i < this.fragmentCount; i++) {
            const angle = -Math.PI / 2 + Utils.randomRange(-Math.PI * 0.6, Math.PI * 0.6);
            const speed = Utils.randomRange(100, 250);
            const frag = new ClusterFragment(
                this.game,
                this.x, this.y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );
            frag.damage = this.fragmentDamage;
            frag.blastRadius = this.fragmentRadius;
            frag.owner = this.owner;
            this.game.addProjectile(frag);
        }
    }

    draw(ctx, x, y) {
        // Danger glow
        if (this.fuseTimer < 1 && this.fuseTimer > 0) {
            const pulse = Math.sin(this.fuseTimer * 20);
            if (pulse > 0) {
                ctx.globalAlpha = 0.35 * pulse;
                ctx.fillStyle = '#FF3200';
                ctx.fillRect(x - 6, y - 6, 12, 12);
                ctx.globalAlpha = 1;
            }
        }

        const sprite = this.game.sprites.createProjectileSprite('cluster');
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(sprite, x - sprite.width / 2, y - sprite.height / 2);

        // Fuse timer
        if (this.fuseTimer > 0) {
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2.5;
            ctx.strokeText(Math.ceil(this.fuseTimer).toString(), x, y - 9);
            ctx.fillText(Math.ceil(this.fuseTimer).toString(), x, y - 9);
        }
    }
}

export class ClusterFragment extends Projectile {
    constructor(game, x, y, vx, vy) {
        super(game, x, y, vx, vy);
        this.fuseTimer = Utils.randomRange(0.5, 1.5);
        this.bounceFactor = 0.3;
        this.maxBounces = 3;
        this.width = 4;
        this.height = 4;
    }

    emitTrail() {
        // Small trail
        if (Math.random() > 0.5) return;
        this.game.particles.emit({
            x: this.x, y: this.y, count: 1,
            speed: 15, life: 0.15, size: 2,
            color: { r: 255, g: 100, b: 50 },
            gravity: false, fade: true,
        });
    }

    draw(ctx, x, y) {
        const sprite = this.game.sprites.createClusterFragmentSprite();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(sprite, x - sprite.width / 2, y - sprite.height / 2);
    }
}
