import { Utils } from '../core/Utils.js';

export class Entity {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.prevX = x;
        this.prevY = y;
        this.vx = 0;
        this.vy = 0;
        this.width = 8;
        this.height = 8;
        this.alive = true;
        this.grounded = false;
        this.affectedByGravity = true;
        this.affectedByWind = false;
        this.bounceFactor = 0;
        this.mass = 1;
    }

    update(dt) {
        this.prevX = this.x;
        this.prevY = this.y;
    }

    render(ctx, alpha) {
        // Interpolated position for smooth rendering
        const rx = Utils.lerp(this.prevX, this.x, alpha);
        const ry = Utils.lerp(this.prevY, this.y, alpha);

        this.draw(ctx, rx, ry);
    }

    draw(ctx, x, y) {
        // Override in subclasses
        ctx.fillStyle = '#fff';
        ctx.fillRect(x - this.width / 2, y - this.height / 2, this.width, this.height);
    }

    getCenterX() {
        return this.x;
    }

    getCenterY() {
        return this.y - this.height / 2;
    }

    distanceTo(other) {
        return Utils.distance(this.x, this.y, other.x, other.y);
    }

    kill() {
        this.alive = false;
    }
}
