import { Entity } from './Entity.js';
import { Utils } from '../core/Utils.js';

export class Crate extends Entity {
    constructor(game, x, y, type = 'weapon') {
        super(game, x, y);
        this.type = type; // 'weapon' or 'health'
        this.width = 16;
        this.height = 16;
        this.affectedByGravity = true;
        this.parachuteOpen = true;
        this.fallSpeed = 30; // Slow descent with parachute
        this.weaponName = null;
        this.healthAmount = 25;
    }

    update(dt) {
        super.update(dt);

        // Slow fall with parachute
        if (this.parachuteOpen && !this.grounded) {
            this.vy = Math.min(this.vy, this.fallSpeed);
        }

        if (this.grounded) {
            this.parachuteOpen = false;
        }

        // Check water
        if (this.game.water.isSubmerged(this.x, this.y)) {
            this.game.particles.emitSplash(this.x, this.game.water.level);
            this.alive = false;
        }
    }

    collect(worm) {
        if (!this.alive) return;
        this.alive = false;

        if (this.type === 'health') {
            worm.health = Math.min(worm.health + this.healthAmount, 150);
            this.game.audio.play('collect');
        } else {
            // Give random weapon
            const weapon = this.game.weapons.getRandomCrateWeapon();
            if (weapon) {
                this.game.weapons.addAmmo(weapon.name, 1);
                this.game.audio.play('collect');
            }
        }

        // Collect particles
        this.game.particles.emit({
            x: this.x, y: this.y, count: 10,
            speed: 50, life: 0.5, size: 3,
            color: this.type === 'health'
                ? { r: 255, g: 50, b: 50 }
                : { r: 255, g: 215, b: 0 },
            gravity: false, fade: true,
        });
    }

    draw(ctx, x, y) {
        // Parachute
        if (this.parachuteOpen) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;

            // Lines
            ctx.beginPath();
            ctx.moveTo(x - 12, y - 20);
            ctx.lineTo(x - 4, y - 8);
            ctx.moveTo(x + 12, y - 20);
            ctx.lineTo(x + 4, y - 8);
            ctx.stroke();

            // Canopy
            ctx.fillStyle = 'rgba(255, 255, 200, 0.6)';
            ctx.beginPath();
            ctx.moveTo(x - 15, y - 19);
            ctx.quadraticCurveTo(x, y - 34, x + 15, y - 19);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.stroke();
        }

        // Crate box
        const sprite = this.game.sprites.createCrateSprite(this.type);
        ctx.drawImage(sprite, x - 8, y - 8);
    }
}
