import { Weapon } from './Weapon.js';
import { Projectile } from '../entities/Projectile.js';
import { Config } from '../core/Config.js';
import { Utils } from '../core/Utils.js';

export class NinjaRope extends Weapon {
    constructor() {
        super('Ninja Rope', {
            ammo: 3, category: 'tool',
            requiresAim: true, requiresPower: false,
            endsTurnOnFire: false,
        });
        this.active = false;
        this.anchorX = 0;
        this.anchorY = 0;
        this.ropeLength = 0;
        this.targetLength = 150;
        this.attached = false;
    }

    fire(game, worm, angle, power) {
        // Fire grapple in aim direction
        const speed = 500;
        const grapple = new GrappleHook(game, worm, this,
            worm.x + Math.cos(angle) * 10,
            worm.y - worm.height * 0.3 + Math.sin(angle) * 10,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );
        game.addProjectile(grapple);
    }

    update(dt, game, worm) {
        if (!this.active || !this.attached || !worm || !worm.alive) return;

        // Pendulum swing physics
        const dx = worm.x - this.anchorX;
        const dy = worm.y - this.anchorY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Apply gravity to worm velocity
        worm.vy += Config.GRAVITY * dt;

        // Swing input: left/right keys add tangential force
        if (game.input.isDown('ArrowLeft')) {
            worm.vx -= 200 * dt;
        }
        if (game.input.isDown('ArrowRight')) {
            worm.vx += 200 * dt;
        }

        // Shorten/lengthen rope with up/down
        if (game.input.isDown('ArrowUp')) {
            this.ropeLength = Math.max(30, this.ropeLength - 100 * dt);
        }
        if (game.input.isDown('ArrowDown')) {
            this.ropeLength = Math.min(250, this.ropeLength + 100 * dt);
        }

        // Apply velocity
        worm.x += worm.vx * dt;
        worm.y += worm.vy * dt;

        // Constrain to rope length (project onto circle)
        const dx2 = worm.x - this.anchorX;
        const dy2 = worm.y - this.anchorY;
        const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

        if (dist2 > this.ropeLength) {
            // Snap back to rope length
            const nx = dx2 / dist2;
            const ny = dy2 / dist2;
            worm.x = this.anchorX + nx * this.ropeLength;
            worm.y = this.anchorY + ny * this.ropeLength;

            // Remove radial velocity component (keep tangential)
            const radialVel = worm.vx * nx + worm.vy * ny;
            if (radialVel > 0) {
                worm.vx -= radialVel * nx;
                worm.vy -= radialVel * ny;
            }
        }

        // Release on Space or Enter
        if (game.input.justPressed('Space') || game.input.justPressed('Enter')) {
            this.detach(game, worm);
        }
    }

    detach(game, worm) {
        this.active = false;
        this.attached = false;
        worm.affectedByGravity = true;
        // Worm keeps current velocity (launch!)
    }
}

class GrappleHook extends Projectile {
    constructor(game, worm, rope, x, y, vx, vy) {
        super(game, x, y, vx, vy);
        this.worm = worm;
        this.rope = rope;
        this.affectedByGravity = true;
        this.affectedByWind = false;
        this.damage = 0;
        this.blastRadius = 0;
        this.width = 4;
        this.height = 4;
    }

    onTerrainHit(nx, ny) {
        // Attach!
        this.rope.anchorX = this.x;
        this.rope.anchorY = this.y;
        this.rope.active = true;
        this.rope.attached = true;
        this.rope.ropeLength = Utils.distance(this.x, this.y, this.worm.x, this.worm.y);
        this.alive = false;

        // Start swinging physics
        this.worm.affectedByGravity = false;
        this.game.audio.play('ropeAttach');
    }

    onEntityHit() {
        // Miss - just disappear
        this.alive = false;
    }

    detonate() {
        // Don't explode
        this.alive = false;
    }

    draw(ctx, x, y) {
        // Draw rope line from worm to hook
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.worm.x, this.worm.y);
        ctx.lineTo(x, y);
        ctx.stroke();

        // Hook
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

export class Teleport extends Weapon {
    constructor() {
        super('Teleport', {
            ammo: 2, category: 'tool',
            requiresAim: false, requiresPower: false,
            endsTurnOnFire: true,
        });
        this.needsTarget = true;
    }

    fire(game, worm, angle, power) {
        const mouse = game.input.mouse;
        const target = game.camera.screenToWorld(mouse.x, mouse.y);

        // Teleport effect at origin
        game.particles.emit({
            x: worm.x, y: worm.y, count: 15,
            speed: 80, life: 0.5, size: 3,
            color: { r: 100, g: 100, b: 255 },
            gravity: false, fade: true,
        });

        // Move worm
        worm.x = target.x;
        worm.y = target.y;
        worm.vx = 0;
        worm.vy = 0;
        worm.grounded = false;

        // Teleport effect at destination
        game.particles.emit({
            x: target.x, y: target.y, count: 15,
            speed: 80, life: 0.5, size: 3,
            color: { r: 100, g: 100, b: 255 },
            gravity: false, fade: true,
        });

        game.audio.play('teleport');
    }
}

export class Girder extends Weapon {
    constructor() {
        super('Girder', {
            ammo: 2, category: 'tool',
            requiresAim: false, requiresPower: false,
            endsTurnOnFire: true,
        });
        this.needsTarget = true;
    }

    fire(game, worm, angle, power) {
        const mouse = game.input.mouse;
        const target = game.camera.screenToWorld(mouse.x, mouse.y);

        // Place horizontal girder
        const girderW = 60;
        const girderH = 8;
        game.terrain.addRect(
            target.x - girderW / 2,
            target.y - girderH / 2,
            girderW, girderH,
            { r: 150, g: 120, b: 80 }
        );

        game.audio.play('girder');
    }
}

export class Blowtorch extends Weapon {
    constructor() {
        super('Blowtorch', {
            ammo: 2, category: 'tool',
            requiresAim: false, requiresPower: false,
            endsTurnOnFire: false,
        });
        this.tunnelLength = 80;
        this.tunnelRadius = 8;
    }

    fire(game, worm, angle, power) {
        // Dig horizontal tunnel in facing direction
        const startX = worm.x;
        const startY = worm.y;
        const dir = worm.facing;

        for (let d = 0; d < this.tunnelLength; d += 2) {
            const x = startX + dir * d;
            const y = startY + Math.sin(d * 0.05) * 2; // Slight wave
            game.terrain.carveCircle(x, y, this.tunnelRadius);
        }

        // Move worm forward
        worm.x += dir * (this.tunnelLength - 10);

        game.particles.emit({
            x: worm.x, y: worm.y, count: 20,
            speed: 50, life: 0.5, size: 3,
            colors: [
                { r: 255, g: 200, b: 50 },
                { r: 255, g: 100, b: 0 },
            ],
            gravity: false, fade: true,
        });

        game.audio.play('blowtorch');
        game.turnPhase.setState('AFTERMATH');
    }
}

export class Drill extends Weapon {
    constructor() {
        super('Drill', {
            ammo: 2, category: 'tool',
            requiresAim: false, requiresPower: false,
            endsTurnOnFire: false,
        });
        this.tunnelDepth = 80;
        this.tunnelRadius = 8;
    }

    fire(game, worm, angle, power) {
        // Dig vertical tunnel downward
        for (let d = 0; d < this.tunnelDepth; d += 2) {
            game.terrain.carveCircle(worm.x, worm.y + d, this.tunnelRadius);
        }

        // Move worm down
        worm.y += this.tunnelDepth - 10;
        worm.grounded = false;

        game.particles.emit({
            x: worm.x, y: worm.y, count: 15,
            speed: 50, angle: -Math.PI / 2, angleVariance: 0.5,
            life: 0.5, size: 3,
            colors: [
                { r: 139, g: 90, b: 43 },
                { r: 101, g: 67, b: 33 },
            ],
            gravity: true, fade: true,
        });

        game.audio.play('drill');
        game.turnPhase.setState('AFTERMATH');
    }
}
