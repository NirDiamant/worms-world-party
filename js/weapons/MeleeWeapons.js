import { Weapon } from './Weapon.js';
import { Utils } from '../core/Utils.js';

export class FirePunch extends Weapon {
    constructor() {
        super('Fire Punch', { ammo: Infinity, category: 'melee', isMelee: true, requiresPower: false, requiresAim: false });
        this.damage = 30;
        this.range = 25;
        this.launchForce = 300;
    }

    fire(game, worm, angle, power) {
        const hitX = worm.x + worm.facing * this.range;
        const hitY = worm.y;

        // Check for nearby enemies
        for (const entity of game.entities) {
            if (!entity.alive || !entity.team || entity === worm) continue;
            const dist = Utils.distance(hitX, hitY, entity.x, entity.y);
            if (dist < this.range) {
                // Launch upward
                entity.takeDamage(this.damage, worm.facing * 50, -this.launchForce);
            }
        }

        // Fire effect
        game.particles.emit({
            x: hitX, y: hitY, count: 15,
            speed: 100,
            angle: -Math.PI / 2, angleVariance: 0.5,
            life: 0.4, size: 4,
            colors: [
                { r: 255, g: 200, b: 50 },
                { r: 255, g: 100, b: 0 },
            ],
            gravity: false, fade: true,
        });

        game.audio.play('punch');
    }
}

export class BaseballBat extends Weapon {
    constructor() {
        super('Baseball Bat', { ammo: Infinity, category: 'melee', isMelee: true, requiresPower: false, requiresAim: false });
        this.damage = 30;
        this.range = 25;
        this.launchForce = 350;
    }

    fire(game, worm, angle, power) {
        const hitX = worm.x + worm.facing * this.range;
        const hitY = worm.y;

        for (const entity of game.entities) {
            if (!entity.alive || !entity.team || entity === worm) continue;
            const dist = Utils.distance(hitX, hitY, entity.x, entity.y);
            if (dist < this.range) {
                // Launch horizontally
                entity.takeDamage(this.damage, worm.facing * this.launchForce, -100);
            }
        }

        // Swing effect
        game.particles.emit({
            x: hitX, y: hitY, count: 8,
            speed: 80,
            angle: worm.facing > 0 ? 0 : Math.PI,
            angleVariance: 0.8,
            life: 0.3, size: 3,
            color: { r: 255, g: 255, b: 255 },
            gravity: false, fade: true,
        });

        game.audio.play('bat');
    }
}

export class Prod extends Weapon {
    constructor() {
        super('Prod', { ammo: Infinity, category: 'melee', isMelee: true, requiresPower: false, requiresAim: false });
        this.damage = 0;
        this.range = 20;
        this.pushForce = 30;
    }

    fire(game, worm, angle, power) {
        const hitX = worm.x + worm.facing * this.range;
        const hitY = worm.y;

        for (const entity of game.entities) {
            if (!entity.alive || !entity.team || entity === worm) continue;
            const dist = Utils.distance(hitX, hitY, entity.x, entity.y);
            if (dist < this.range) {
                entity.takeDamage(0, worm.facing * this.pushForce, -5);
            }
        }

        game.audio.play('prod');
    }
}
