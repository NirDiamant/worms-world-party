import { Utils } from '../core/Utils.js';

export class AimController {
    constructor(game) {
        this.game = game;
        this.angle = -Math.PI / 4; // Default: 45 degrees up
        this.aimSpeed = 2; // radians per second
        this.crosshairDist = 40;
    }

    update(dt) {
        const input = this.game.input;
        const worm = this.game.activeWorm;
        if (!worm) return;

        // Aim with up/down keys
        if (input.isDown('ArrowUp')) {
            this.angle -= this.aimSpeed * dt;
        }
        if (input.isDown('ArrowDown')) {
            this.angle += this.aimSpeed * dt;
        }

        // Clamp angle
        this.angle = Utils.clamp(this.angle, -Math.PI + 0.1, -0.1);

        // Flip angle if facing left
        if (worm.facing < 0) {
            // Angle is relative to facing direction
        }
    }

    getWorldAngle() {
        const worm = this.game.activeWorm;
        if (!worm) return this.angle;

        if (worm.facing < 0) {
            return Math.PI - this.angle;
        }
        return this.angle;
    }

    render(ctx) {
        const worm = this.game.activeWorm;
        if (!worm || !worm.alive) return;

        const weapon = this.game.weapons.getCurrentWeapon();
        if (!weapon || !weapon.requiresAim) return;

        const angle = this.getWorldAngle();
        const cx = worm.x + Math.cos(angle) * this.crosshairDist;
        const cy = worm.y - worm.height * 0.3 + Math.sin(angle) * this.crosshairDist;

        // Crosshair
        ctx.strokeStyle = '#ff0';
        ctx.lineWidth = 1.5;
        const size = 6;

        ctx.beginPath();
        ctx.moveTo(cx - size, cy);
        ctx.lineTo(cx - 2, cy);
        ctx.moveTo(cx + 2, cy);
        ctx.lineTo(cx + size, cy);
        ctx.moveTo(cx, cy - size);
        ctx.lineTo(cx, cy - 2);
        ctx.moveTo(cx, cy + 2);
        ctx.lineTo(cx, cy + size);
        ctx.stroke();

        // Aim line
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(worm.x, worm.y - worm.height * 0.3);
        ctx.lineTo(cx, cy);
        ctx.stroke();
        ctx.setLineDash([]);
    }
}
