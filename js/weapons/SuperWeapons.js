import { Weapon } from './Weapon.js';
import { Projectile } from '../entities/Projectile.js';
import { Utils } from '../core/Utils.js';
import { Config } from '../core/Config.js';
import { Worm } from '../entities/Worm.js';

export class ConcreteDonkey extends Weapon {
    constructor() {
        super('Concrete Donkey', {
            ammo: 0, category: 'super',
            requiresAim: false, requiresPower: false,
            endsTurnOnFire: true, crateOnly: true,
        });
        this.needsTarget = true;
    }

    fire(game, worm, angle, power) {
        const mouse = game.input.mouse;
        const target = game.camera.screenToWorld(mouse.x, mouse.y);

        const donkey = new DonkeyEntity(game, target.x, -50);
        donkey.owner = worm;
        game.addProjectile(donkey);
        game.audio.play('donkey');
    }
}

class DonkeyEntity extends Projectile {
    constructor(game, x, y) {
        super(game, x, y, 0, 200);
        this.damage = 60;
        this.blastRadius = 50;
        this.affectedByGravity = true;
        this.affectedByWind = false;
        this.fuseTimer = -1;
        this.explosionTimer = 0;
        this.width = 12;
        this.height = 16;
    }

    onTerrainHit(nx, ny) {
        // Don't stop - plow through!
        this.game.addExplosion(this.x, this.y, this.blastRadius, this.damage, this.owner);
        this.game.particles.emitExplosion(this.x, this.y, this.blastRadius);
        this.game.camera.shake(10);
        this.vy = 200; // Keep going down
    }

    update(dt) {
        super.update(dt);

        // Plow through terrain continuously
        this.explosionTimer += dt;
        if (this.explosionTimer > 0.1) {
            this.explosionTimer = 0;
            if (this.game.terrain.isSolid(Math.round(this.x), Math.round(this.y))) {
                this.game.terrain.carveCircle(this.x, this.y, this.blastRadius);
                this.game.camera.shake(5);
            }
        }

        // Die when hitting water
        if (this.y > Config.WATER_LEVEL) {
            this.game.addExplosion(this.x, this.y, this.blastRadius * 1.5, this.damage, this.owner);
            this.game.particles.emitSplash(this.x, this.game.water.level);
            this.alive = false;
        }
    }

    emitTrail() {
        this.game.particles.emit({
            x: this.x, y: this.y - 10, count: 2,
            speed: 30, life: 0.3, size: 3,
            colors: [
                { r: 150, g: 150, b: 150 },
                { r: 100, g: 100, b: 100 },
            ],
            gravity: false, fade: true,
        });
    }

    draw(ctx, x, y) {
        const sprite = this.game.sprites.createDonkeySprite();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(sprite, x - sprite.width / 2, y - sprite.height / 2);
    }
}

export class Armageddon extends Weapon {
    constructor() {
        super('Armageddon', {
            ammo: 0, category: 'super',
            requiresAim: false, requiresPower: false,
            endsTurnOnFire: true, crateOnly: true,
        });
    }

    fire(game, worm, angle, power) {
        // Rain meteors across the entire map
        const meteorCount = 30;

        for (let i = 0; i < meteorCount; i++) {
            setTimeout(() => {
                const x = Utils.randomRange(50, Config.WORLD_WIDTH - 50);
                const meteor = new Projectile(game, x, -50,
                    Utils.randomRange(-30, 30), 300);
                meteor.damage = 30;
                meteor.blastRadius = 35;
                meteor.owner = worm;
                meteor.affectedByWind = false;
                game.addProjectile(meteor);
            }, i * 100);
        }

        game.camera.shake(20);
        game.audio.play('armageddon');
    }
}

export class Earthquake extends Weapon {
    constructor() {
        super('Earthquake', {
            ammo: 0, category: 'super',
            requiresAim: false, requiresPower: false,
            endsTurnOnFire: true, crateOnly: true,
        });
    }

    fire(game, worm, angle, power) {
        game.camera.shake(30);

        // Shake all worms, push toward edges
        for (const entity of game.entities) {
            if (entity instanceof Worm && entity.alive && entity !== worm) {
                // Displacement toward nearest edge
                const centerX = Config.WORLD_WIDTH / 2;
                const pushDir = entity.x < centerX ? -1 : 1;

                entity.vx += pushDir * Utils.randomRange(50, 150);
                entity.vy += Utils.randomRange(-100, -200);
                entity.grounded = false;
            }
        }

        // Shake effect particles
        for (let i = 0; i < 50; i++) {
            const x = Utils.randomRange(0, Config.WORLD_WIDTH);
            const surfaceY = game.terrain.findSurface(Math.round(x));
            game.particles.emit({
                x, y: surfaceY, count: 1,
                speed: 50, angle: -Math.PI / 2, angleVariance: 0.5,
                life: 0.5, size: 3,
                colors: [
                    { r: 139, g: 90, b: 43 },
                    { r: 101, g: 67, b: 33 },
                ],
                gravity: true, fade: false,
            });
        }

        game.audio.play('earthquake');
    }
}
