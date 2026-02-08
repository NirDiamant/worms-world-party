import { Entity } from './Entity.js';
import { Utils } from '../core/Utils.js';

export class Barrel extends Entity {
    constructor(game, x, y) {
        super(game, x, y);
        this.width = 14;
        this.height = 18;
        this.health = 30;
        this.damage = 50;
        this.blastRadius = 50;
        this.affectedByGravity = true;
        this.bounceFactor = 0.1;
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.detonate();
        }
    }

    detonate() {
        if (!this.alive) return;
        this.alive = false;
        this.game.addExplosion(this.x, this.y, this.blastRadius, this.damage, null);
    }

    draw(ctx, x, y) {
        // Barrel body
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x - 6, y - 8, 12, 16);

        // Metal bands
        ctx.fillStyle = '#666';
        ctx.fillRect(x - 7, y - 7, 14, 2);
        ctx.fillRect(x - 7, y + 3, 14, 2);

        // Warning symbol
        ctx.fillStyle = '#FF4400';
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('!', x, y + 1);

        // Top rim
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(x - 5, y - 9, 10, 2);
    }
}
