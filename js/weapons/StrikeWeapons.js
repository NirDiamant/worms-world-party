import { Weapon } from './Weapon.js';
import { Missile } from '../entities/Missile.js';
import { Projectile } from '../entities/Projectile.js';
import { Utils } from '../core/Utils.js';

export class AirStrike extends Weapon {
    constructor() {
        super('Air Strike', {
            ammo: 1, category: 'strike',
            requiresAim: false, requiresPower: false,
            endsTurnOnFire: true,
        });
        this.needsTarget = true;
    }

    fire(game, worm, angle, power) {
        // Get target from mouse position
        const mouse = game.input.mouse;
        const target = game.camera.screenToWorld(mouse.x, mouse.y);

        const missileCount = 5;
        const spacing = 25;
        const startX = target.x - (missileCount - 1) * spacing / 2;
        const startY = -50;

        for (let i = 0; i < missileCount; i++) {
            setTimeout(() => {
                const mx = startX + i * spacing;
                const missile = new Missile(game, mx, startY, 0, 300);
                missile.damage = 30;
                missile.blastRadius = 35;
                missile.owner = worm;
                missile.affectedByWind = false;
                game.addProjectile(missile);
            }, i * 100);
        }

        game.audio.play('airstrike');
    }
}

export class NapalmStrike extends Weapon {
    constructor() {
        super('Napalm Strike', {
            ammo: 1, category: 'strike',
            requiresAim: false, requiresPower: false,
            endsTurnOnFire: true, crateOnly: true,
        });
        this.needsTarget = true;
    }

    fire(game, worm, angle, power) {
        const mouse = game.input.mouse;
        const target = game.camera.screenToWorld(mouse.x, mouse.y);

        const count = 10;
        const spacing = 15;
        const startX = target.x - (count - 1) * spacing / 2;

        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const mx = startX + i * spacing + Utils.randomRange(-5, 5);
                const fireball = new NapalmDrop(game, mx, -30);
                fireball.owner = worm;
                game.addProjectile(fireball);
            }, i * 80);
        }

        game.audio.play('airstrike');
    }
}

class NapalmDrop extends Projectile {
    constructor(game, x, y) {
        super(game, x, y, 0, 250);
        this.damage = 20;
        this.blastRadius = 22;
        this.affectedByWind = false;
        this.burnTime = 3;
    }

    detonate() {
        if (!this.alive) return;
        this.alive = false;

        this.game.addExplosion(this.x, this.y, this.blastRadius, this.damage, this.owner);

        // Fire particles
        for (let i = 0; i < 8; i++) {
            const fx = this.x + Utils.randomRange(-10, 10);
            const fy = this.y + Utils.randomRange(-5, 5);
            this.game.particles.emitFire(fx, fy);
        }
    }

    emitTrail() {
        this.game.particles.emitFire(this.x, this.y);
    }

    draw(ctx, x, y) {
        const sprite = this.game.sprites.createNapalmSprite();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(sprite, x - sprite.width / 2, y - sprite.height / 2);
    }
}
