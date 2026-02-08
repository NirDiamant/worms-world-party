import { Weapon } from './Weapon.js';
import { Missile } from '../entities/Missile.js';
import { Grenade } from '../entities/Grenade.js';
import { ClusterBomb } from '../entities/ClusterBomb.js';
import { Projectile } from '../entities/Projectile.js';

export class Bazooka extends Weapon {
    constructor() {
        super('Bazooka', { ammo: Infinity, category: 'projectile' });
    }

    fire(game, worm, angle, power) {
        const speed = 200 + power * 5;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const startX = worm.x + Math.cos(angle) * 15;
        const startY = worm.y - worm.height * 0.3 + Math.sin(angle) * 15;

        const missile = new Missile(game, startX, startY, vx, vy);
        missile.owner = worm;
        game.addProjectile(missile);
    }
}

export class GrenadeWeapon extends Weapon {
    constructor() {
        super('Grenade', { ammo: Infinity, category: 'projectile', hasFuseTimer: true });
        this.fuseTime = 3;
    }

    fire(game, worm, angle, power) {
        const speed = 150 + power * 4;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const startX = worm.x + Math.cos(angle) * 15;
        const startY = worm.y - worm.height * 0.3 + Math.sin(angle) * 15;

        const grenade = new Grenade(game, startX, startY, vx, vy, this.fuseTime);
        grenade.owner = worm;
        game.addProjectile(grenade);
    }
}

export class ClusterBombWeapon extends Weapon {
    constructor() {
        super('Cluster Bomb', { ammo: 3, category: 'projectile', hasFuseTimer: true });
        this.fuseTime = 3;
    }

    fire(game, worm, angle, power) {
        const speed = 150 + power * 4;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const startX = worm.x + Math.cos(angle) * 15;
        const startY = worm.y - worm.height * 0.3 + Math.sin(angle) * 15;

        const bomb = new ClusterBomb(game, startX, startY, vx, vy, this.fuseTime);
        bomb.owner = worm;
        game.addProjectile(bomb);
    }
}

export class BananaBombWeapon extends Weapon {
    constructor() {
        super('Banana Bomb', { ammo: 1, category: 'projectile', hasFuseTimer: true, crateOnly: true });
        this.fuseTime = 3;
    }

    fire(game, worm, angle, power) {
        const speed = 150 + power * 4;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const startX = worm.x + Math.cos(angle) * 15;
        const startY = worm.y - worm.height * 0.3 + Math.sin(angle) * 15;

        const bomb = new ClusterBomb(game, startX, startY, vx, vy, this.fuseTime);
        bomb.damage = 60;
        bomb.blastRadius = 50;
        bomb.fragmentCount = 5;
        bomb.fragmentDamage = 75;
        bomb.fragmentRadius = 45;
        bomb.owner = worm;
        game.addProjectile(bomb);
    }
}

export class HolyHandGrenadeWeapon extends Weapon {
    constructor() {
        super('Holy Hand Grenade', { ammo: 1, category: 'projectile', crateOnly: true });
    }

    fire(game, worm, angle, power) {
        const speed = 120 + power * 3;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const startX = worm.x + Math.cos(angle) * 15;
        const startY = worm.y - worm.height * 0.3 + Math.sin(angle) * 15;

        const grenade = new Grenade(game, startX, startY, vx, vy, 3);
        grenade.damage = 100;
        grenade.blastRadius = 90;
        grenade.bounceFactor = 0.2;
        grenade.owner = worm;
        game.addProjectile(grenade);
    }
}

export class MortarWeapon extends Weapon {
    constructor() {
        super('Mortar', { ammo: Infinity, category: 'projectile' });
    }

    fire(game, worm, angle, power) {
        const speed = 200 + power * 5;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        const startX = worm.x + Math.cos(angle) * 15;
        const startY = worm.y - worm.height * 0.3 + Math.sin(angle) * 15;

        const mortar = new MortarProjectile(game, startX, startY, vx, vy);
        mortar.owner = worm;
        game.addProjectile(mortar);
    }
}

class MortarProjectile extends Projectile {
    constructor(game, x, y, vx, vy) {
        super(game, x, y, vx, vy);
        this.damage = 40;
        this.blastRadius = 45;
        this.affectedByWind = true;
    }

    detonate() {
        if (!this.alive) return;
        this.alive = false;

        // Main explosion
        this.game.addExplosion(this.x, this.y, this.blastRadius, this.damage, this.owner);
        this.game.particles.emitExplosion(this.x, this.y, this.blastRadius);
        this.game.camera.shake(this.blastRadius * 0.3);
        this.game.audio.play('explosion', { size: this.blastRadius });

        // Spawn fragments going up
        for (let i = 0; i < 4; i++) {
            const angle = -Math.PI / 2 + (i - 1.5) * 0.4;
            const speed = 150 + Math.random() * 100;
            const frag = new Projectile(this.game, this.x, this.y,
                Math.cos(angle) * speed, Math.sin(angle) * speed);
            frag.damage = 25;
            frag.blastRadius = 25;
            frag.owner = this.owner;
            frag.affectedByWind = true;
            frag.width = 4;
            frag.height = 4;
            this.game.addProjectile(frag);
        }
    }
}
