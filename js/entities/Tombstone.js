import { Entity } from './Entity.js';

export class Tombstone extends Entity {
    constructor(game, x, y) {
        super(game, x, y);
        this.width = 12;
        this.height = 16;
        this.affectedByGravity = true;
    }

    update(dt) {
        super.update(dt);

        // Check water
        if (this.game.water.isSubmerged(this.x, this.y)) {
            this.alive = false;
        }
    }

    draw(ctx, x, y) {
        const sprite = this.game.sprites.createTombstone();
        ctx.drawImage(sprite, x - 6, y - 16);
    }
}
