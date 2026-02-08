import { Weapon } from './Weapon.js';
import { Utils } from '../core/Utils.js';

export class Shotgun extends Weapon {
    constructor() {
        super('Shotgun', { ammo: Infinity, category: 'gun', isHitscan: true });
        this.shotsPerTurn = 2;
        this.shotsFired = 0;
        this.damage = 25;
        this.craterRadius = 12;
        this.range = 300;
    }

    fire(game, worm, angle, power) {
        this.shotsFired++;

        const startX = worm.x + Math.cos(angle) * 15;
        const startY = worm.y - worm.height * 0.3 + Math.sin(angle) * 15;

        // Hitscan - trace ray
        const hit = this.traceShot(game, startX, startY, angle, this.range);

        if (hit.entity) {
            hit.entity.takeDamage(this.damage,
                Math.cos(angle) * 100,
                Math.sin(angle) * 100 - 50
            );
        }

        if (hit.x !== undefined) {
            game.addExplosion(hit.x, hit.y, this.craterRadius, 0);
            game.particles.emitExplosion(hit.x, hit.y, this.craterRadius * 0.5);
        }

        // Muzzle flash
        game.particles.emit({
            x: startX, y: startY, count: 5,
            speed: 100, angle, angleVariance: 0.2,
            life: 0.15, size: 3,
            color: { r: 255, g: 255, b: 100 },
            gravity: false, fade: true,
        });

        game.audio.play('shotgun');

        // Recoil pushback
        worm.vx -= Math.cos(angle) * 30;
        worm.vy -= Math.sin(angle) * 30;

        // Can fire again if shots remain
        if (this.shotsFired < this.shotsPerTurn) {
            game.hasFired = false;
            return;
        }

        this.shotsFired = 0;
    }

    traceShot(game, x, y, angle, maxDist) {
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);

        for (let d = 0; d < maxDist; d += 1) {
            const px = x + dx * d;
            const py = y + dy * d;

            // Check entities
            for (const entity of game.entities) {
                if (!entity.alive || !entity.team || entity === game.activeWorm) continue;
                const dist = Utils.distance(px, py, entity.x, entity.y);
                if (dist < entity.width) {
                    return { entity, x: px, y: py };
                }
            }

            // Check terrain
            if (game.terrain.isSolid(Math.round(px), Math.round(py))) {
                return { x: px, y: py };
            }
        }

        return { x: x + dx * maxDist, y: y + dy * maxDist };
    }
}

export class Uzi extends Weapon {
    constructor() {
        super('Uzi', { ammo: Infinity, category: 'gun', isHitscan: true, endsTurnOnFire: false });
        this.damage = 3;
        this.craterRadius = 5;
        this.range = 400;
        this.burstCount = 20;
        this.burstInterval = 0.05; // 50ms between shots
        this.burstTimer = 0;
        this.burstIndex = 0;
        this.firing = false;
        this.angle = 0;
        this._game = null;
        this._worm = null;
    }

    fire(game, worm, angle, power) {
        this.firing = true;
        this.burstIndex = 0;
        this.burstTimer = 0;
        this.angle = angle;
        this._game = game;
        this._worm = worm;
        // Fire first shot immediately
        this.fireSingleShot();
    }

    update(dt) {
        if (!this.firing || !this._game || !this._worm) return;

        this.burstTimer -= dt;
        if (this.burstTimer <= 0) {
            this.burstTimer += this.burstInterval;
            this.fireSingleShot();
        }
    }

    fireSingleShot() {
        const game = this._game;
        const worm = this._worm;

        if (this.burstIndex >= this.burstCount || !worm.alive) {
            this.firing = false;
            this._game = null;
            this._worm = null;
            game.turnPhase.setState('AFTERMATH');
            return;
        }

        // Spread
        const spread = Utils.randomRange(-0.08, 0.08);
        const angle = this.angle + spread;

        const startX = worm.x + Math.cos(angle) * 15;
        const startY = worm.y - worm.height * 0.3 + Math.sin(angle) * 15;

        // Hitscan
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);

        for (let d = 0; d < this.range; d += 2) {
            const px = startX + dx * d;
            const py = startY + dy * d;

            for (const entity of game.entities) {
                if (!entity.alive || !entity.team || entity === worm) continue;
                if (Utils.distance(px, py, entity.x, entity.y) < entity.width) {
                    entity.takeDamage(this.damage, dx * 15, dy * 15 - 5);
                    game.terrain.carveCircle(px, py, this.craterRadius);
                    game.terrain.dirty = true;
                    this.burstIndex++;
                    return;
                }
            }

            if (game.terrain.isSolid(Math.round(px), Math.round(py))) {
                game.terrain.carveCircle(px, py, this.craterRadius);
                game.terrain.dirty = true;
                break;
            }
        }

        // Recoil
        worm.vx -= Math.cos(this.angle) * 3;
        worm.vy -= Math.sin(this.angle) * 3;

        // Muzzle flash
        game.particles.emit({
            x: startX, y: startY, count: 2,
            speed: 80, angle, angleVariance: 0.1,
            life: 0.05, size: 2,
            color: { r: 255, g: 255, b: 100 },
            gravity: false, fade: true,
        });

        game.audio.play('uzi');
        this.burstIndex++;
        this.burstTimer = this.burstInterval;
    }
}

export class Minigun extends Uzi {
    constructor() {
        super();
        this.name = 'Minigun';
        this.ammoDefault = 3;
        this.burstCount = 40;
        this.damage = 3;
    }
}
