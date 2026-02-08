import { Projectile } from './Projectile.js';

export class Missile extends Projectile {
    constructor(game, x, y, vx, vy) {
        super(game, x, y, vx, vy);
        this.damage = 50;
        this.blastRadius = 55;
        this.affectedByWind = true;
        this.bounceFactor = 0; // Contact detonation
    }

    emitTrail() {
        this.game.particles.emit({
            x: this.x, y: this.y, count: 2,
            speed: 30, speedVariance: 0.5,
            angle: this.rotation + Math.PI, angleVariance: 0.3,
            life: 0.3, size: 3,
            colors: [
                { r: 255, g: 200, b: 50 },
                { r: 200, g: 100, b: 0 },
                { r: 150, g: 150, b: 150 },
            ],
            gravity: false, shrink: true, fade: true,
        });
    }

    draw(ctx, x, y) {
        const sprite = this.game.sprites.createProjectileSprite('missile');
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.rotation);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
        ctx.restore();
    }
}
