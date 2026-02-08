import { Weapon } from './Weapon.js';
import { Projectile } from '../entities/Projectile.js';
import { Mine } from '../entities/Mine.js';
import { Config } from '../core/Config.js';

export class Dynamite extends Weapon {
    constructor() {
        super('Dynamite', { ammo: 1, category: 'placed', requiresAim: false, requiresPower: false, retreatOnUse: true });
    }

    fire(game, worm, angle, power) {
        const dynamite = new DynamiteEntity(game, worm.x, worm.y);
        dynamite.owner = worm;
        game.addProjectile(dynamite);
    }
}

class DynamiteEntity extends Projectile {
    constructor(game, x, y) {
        super(game, x, y, 0, 0);
        this.fuseTimer = 5;
        this.damage = 75;
        this.blastRadius = 75;
        this.affectedByGravity = true;
        this.affectedByWind = false;
        this.bounceFactor = 0;
    }

    emitTrail() {
        // Fuse spark
        this.game.particles.emit({
            x: this.x + 2, y: this.y - 6, count: 1,
            speed: 20, life: 0.1, size: 2,
            colors: [
                { r: 255, g: 200, b: 50 },
                { r: 255, g: 100, b: 0 },
            ],
            gravity: false, fade: true,
        });
    }

    draw(ctx, x, y) {
        const sprite = this.game.sprites.createProjectileSprite('dynamite');
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(sprite, x - sprite.width / 2, y - sprite.height / 2);

        // Animated spark at fuse end
        const sparkPhase = Math.sin(performance.now() * 0.03);
        if (sparkPhase > -0.3) {
            ctx.fillStyle = '#FFCC00';
            ctx.fillRect(x + 3, y - 12, 2, 2);
        }

        // Timer
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2.5;
        ctx.strokeText(Math.ceil(this.fuseTimer).toString(), x, y - 16);
        ctx.fillText(Math.ceil(this.fuseTimer).toString(), x, y - 16);
    }
}

export class MineWeapon extends Weapon {
    constructor() {
        super('Mine', { ammo: 2, category: 'placed', requiresAim: false, requiresPower: false });
    }

    fire(game, worm, angle, power) {
        const mine = new Mine(game, worm.x + worm.facing * 10, worm.y);
        mine.owner = worm;
        game.addEntity(mine);
    }
}

export class SheepWeapon extends Weapon {
    constructor() {
        super('Sheep', { ammo: 1, category: 'placed', requiresAim: false, requiresPower: false, endsTurnOnFire: true });
    }

    fire(game, worm, angle, power) {
        const sheep = new SheepEntity(game, worm.x + worm.facing * 15, worm.y, worm.facing);
        sheep.owner = worm;
        game.addProjectile(sheep);

        // Register space to detonate
        const handler = () => {
            if (sheep.alive) {
                sheep.detonate();
            }
        };

        // Check for space press each frame
        sheep._detonateCheck = () => {
            if (game.input.justPressed('Space') && sheep.alive) {
                sheep.detonate();
                return true;
            }
            return false;
        };
    }
}

class SheepEntity extends Projectile {
    constructor(game, x, y, direction) {
        super(game, x, y, 0, 0);
        this.direction = direction;
        this.walkSpeed = 50;
        this.damage = 75;
        this.blastRadius = 65;
        this.affectedByGravity = true;
        this.affectedByWind = false;
        this.bounceFactor = 0;
        this.fuseTimer = -1; // Manual detonation or 10 second timeout
        this.timeout = 10;
        this.width = 10;
        this.height = 8;
    }

    update(dt) {
        super.update(dt);

        // Walk along terrain
        if (this.grounded) {
            this.vx = this.direction * this.walkSpeed;

            // Follow terrain surface - try to move and find ground
            const nextX = this.x + this.direction * 8;
            const feetY = this.y + this.height / 2;
            const terrain = this.game.terrain;

            // Check for wall ahead (solid at body height)
            const wallAhead = terrain.isSolid(Math.round(nextX), Math.round(feetY - this.height * 0.5));

            // Check for cliff ahead (no ground within reasonable drop)
            let hasGround = false;
            for (let dy = 0; dy < 20; dy++) {
                if (terrain.isSolid(Math.round(nextX), Math.round(feetY + dy))) {
                    hasGround = true;
                    break;
                }
            }

            if (wallAhead || !hasGround) {
                this.direction *= -1;
            }
        }

        // Timeout
        this.timeout -= dt;
        if (this.timeout <= 0) {
            this.detonate();
        }

        // Check detonation input
        if (this._detonateCheck && this._detonateCheck()) return;
    }

    emitTrail() {
        // Occasional "baa" particle
    }

    draw(ctx, x, y) {
        const sprite = this.game.sprites.createSheepSprite(this.direction);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(sprite, x - sprite.width / 2, y - sprite.height / 2);
    }
}
