import { Utils } from '../core/Utils.js';

export class TerrainCollider {
    constructor(terrain) {
        this.terrain = terrain;
    }

    // Bresenham raycast through terrain
    raycast(x0, y0, x1, y1) {
        for (const point of Utils.bresenhamLine(x0, y0, x1, y1)) {
            if (this.terrain.isSolid(point.x, point.y)) {
                return {
                    hit: true,
                    x: point.x,
                    y: point.y,
                    normal: this.terrain.getSurfaceNormal(point.x, point.y),
                };
            }
        }
        return { hit: false };
    }

    // Raycast in a direction
    raycastDir(x, y, angle, maxDist) {
        const endX = x + Math.cos(angle) * maxDist;
        const endY = y + Math.sin(angle) * maxDist;
        return this.raycast(x, y, endX, endY);
    }

    // Check if line of sight exists between two points
    hasLineOfSight(x0, y0, x1, y1) {
        const result = this.raycast(x0, y0, x1, y1);
        if (!result.hit) return true;

        // Check if hit point is past target
        const distToHit = Utils.distance(x0, y0, result.x, result.y);
        const distToTarget = Utils.distance(x0, y0, x1, y1);
        return distToHit >= distToTarget;
    }
}
