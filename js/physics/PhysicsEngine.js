import { Config } from '../core/Config.js';
import { Utils } from '../core/Utils.js';
import { Worm } from '../entities/Worm.js';
import { Crate } from '../entities/Crate.js';

export class PhysicsEngine {
    constructor(game) {
        this.game = game;
    }

    update(dt) {
        // Update entities
        for (const entity of this.game.entities) {
            if (!entity.alive) continue;
            this.integrateEntity(entity, dt);
        }

        // Update projectiles
        for (const proj of this.game.projectiles) {
            if (!proj.alive) continue;
            this.integrateProjectile(proj, dt);
        }
    }

    integrateEntity(entity, dt) {
        if (entity instanceof Worm && entity.grounded && !entity.isDying) {
            // Grounded worms don't get physics applied (they use movement system)
            // But check if still grounded
            const feetX = entity.x;
            const feetY = entity.y + entity.height / 2;

            if (!this.game.terrain.isSolid(feetX, feetY + 1) &&
                !this.game.terrain.isSolid(feetX - 3, feetY + 1) &&
                !this.game.terrain.isSolid(feetX + 3, feetY + 1)) {
                entity.grounded = false;
                entity.fallStartY = entity.y;
            }
            return;
        }

        if (!entity.affectedByGravity && entity.vx === 0 && entity.vy === 0) return;

        // Apply gravity
        if (entity.affectedByGravity) {
            entity.vy += Config.GRAVITY * dt;
        }

        // Apply wind (for entities affected by it)
        if (entity.affectedByWind) {
            entity.vx += this.game.wind * dt;
        }

        // Terminal velocity
        entity.vy = Utils.clamp(entity.vy, -Config.TERMINAL_VELOCITY, Config.TERMINAL_VELOCITY);
        entity.vx = Utils.clamp(entity.vx, -Config.TERMINAL_VELOCITY, Config.TERMINAL_VELOCITY);

        // Integrate position
        const newX = entity.x + entity.vx * dt;
        const newY = entity.y + entity.vy * dt;

        // Terrain collision
        const collision = this.checkTerrainCollision(entity, newX, newY);

        if (collision.hit) {
            entity.x = collision.x;
            entity.y = collision.y;

            if (entity instanceof Worm) {
                // Calculate fall distance
                if (entity.fallStartY !== null) {
                    const fallDist = entity.y - entity.fallStartY;
                    if (fallDist > 0) {
                        entity.onLanded(fallDist);
                    }
                }
                entity.grounded = true;
                entity.vx *= 0.3; // Friction
                entity.vy = 0;

                // Snap to surface
                this.snapToSurface(entity);
            } else if (entity.bounceFactor > 0) {
                // Bounce
                const normal = this.game.terrain.getSurfaceNormal(
                    Math.round(collision.x), Math.round(collision.y + entity.height / 2)
                );
                const dot = entity.vx * normal.x + entity.vy * normal.y;
                entity.vx = (entity.vx - 2 * dot * normal.x) * entity.bounceFactor;
                entity.vy = (entity.vy - 2 * dot * normal.y) * entity.bounceFactor;

                // Dampen
                if (Math.abs(entity.vx) < 5 && Math.abs(entity.vy) < 5) {
                    entity.vx = 0;
                    entity.vy = 0;
                    entity.grounded = true;
                }
            } else {
                entity.vx = 0;
                entity.vy = 0;
                entity.grounded = true;
            }
        } else {
            entity.x = newX;
            entity.y = newY;
            entity.grounded = false;
        }

        // Unstick entity if embedded in terrain
        this.unstickEntity(entity);

        // Check crate collection for worms
        if (entity instanceof Worm) {
            for (const other of this.game.entities) {
                if (other instanceof Crate && other.alive) {
                    if (Utils.distance(entity.x, entity.y, other.x, other.y) < 20) {
                        other.collect(entity);
                    }
                }
            }
        }
    }

    integrateProjectile(proj, dt) {
        // Apply gravity
        if (proj.affectedByGravity) {
            proj.vy += Config.GRAVITY * dt;
        }

        // Apply wind
        if (proj.affectedByWind) {
            proj.vx += this.game.wind * dt;
        }

        // Terminal velocity
        proj.vy = Utils.clamp(proj.vy, -Config.TERMINAL_VELOCITY, Config.TERMINAL_VELOCITY);

        const newX = proj.x + proj.vx * dt;
        const newY = proj.y + proj.vy * dt;

        // Check terrain collision along path (raycast for fast projectiles)
        const steps = Math.max(1, Math.ceil(Utils.distance(proj.x, proj.y, newX, newY) / 2));
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const cx = Utils.lerp(proj.x, newX, t);
            const cy = Utils.lerp(proj.y, newY, t);

            if (this.game.terrain.isSolid(Math.round(cx), Math.round(cy))) {
                // Hit terrain
                const normal = this.game.terrain.getSurfaceNormal(Math.round(cx), Math.round(cy));
                proj.x = cx - normal.x * 2;
                proj.y = cy - normal.y * 2;
                proj.onTerrainHit(normal.x, normal.y);
                return;
            }

            // Check entity collision
            for (const entity of this.game.entities) {
                if (!entity.alive || entity === proj.owner) continue;
                if (!(entity instanceof Worm)) continue;

                const dist = Utils.distance(cx, cy, entity.x, entity.y);
                if (dist < (entity.width / 2 + proj.width / 2)) {
                    proj.x = cx;
                    proj.y = cy;
                    proj.onEntityHit(entity);
                    return;
                }
            }
        }

        proj.x = newX;
        proj.y = newY;

        // Out of world bounds
        if (proj.x < -100 || proj.x > Config.WORLD_WIDTH + 100 ||
            proj.y > Config.WORLD_HEIGHT + 100) {
            proj.alive = false;
        }
    }

    _collidesAt(terrain, x, y, hw, hh) {
        return terrain.isSolid(Math.round(x), Math.round(y + hh)) ||
            terrain.isSolid(Math.round(x - hw), Math.round(y + hh)) ||
            terrain.isSolid(Math.round(x + hw), Math.round(y + hh)) ||
            terrain.isSolid(Math.round(x - hw), Math.round(y)) ||
            terrain.isSolid(Math.round(x + hw), Math.round(y)) ||
            terrain.isSolid(Math.round(x), Math.round(y - hh));
    }

    checkTerrainCollision(entity, newX, newY) {
        const terrain = this.game.terrain;
        const hw = entity.width / 2;
        const hh = entity.height / 2;

        if (!this._collidesAt(terrain, newX, newY, hw, hh)) {
            return { hit: false };
        }

        // Binary search between old and new position to find last safe spot
        let lo = 0, hi = 1;
        for (let i = 0; i < 8; i++) {
            const mid = (lo + hi) / 2;
            const testX = entity.x + (newX - entity.x) * mid;
            const testY = entity.y + (newY - entity.y) * mid;
            if (this._collidesAt(terrain, testX, testY, hw, hh)) {
                hi = mid;
            } else {
                lo = mid;
            }
        }

        const safeX = entity.x + (newX - entity.x) * lo;
        const safeY = entity.y + (newY - entity.y) * lo;

        return {
            hit: true,
            x: safeX,
            y: safeY,
            normal: terrain.getSurfaceNormal(Math.round(newX), Math.round(newY + hh)),
        };
    }

    snapToSurface(worm) {
        const feetY = worm.y + worm.height / 2;
        const terrain = this.game.terrain;
        const hw = worm.width / 2;

        // Check 3 x-positions: center, left edge, right edge
        const xPositions = [Math.round(worm.x), Math.round(worm.x - hw), Math.round(worm.x + hw)];
        let bestSurfY = Infinity;

        for (const px of xPositions) {
            for (let dy = 0; dy < 40; dy++) {
                const testY = Math.round(feetY - dy);
                if (!terrain.isSolid(px, testY) && terrain.isSolid(px, testY + 1)) {
                    const surfY = testY - worm.height / 2;
                    if (surfY < bestSurfY) {
                        bestSurfY = surfY;
                    }
                    break;
                }
            }
        }

        if (bestSurfY < Infinity) {
            worm.y = bestSurfY;
        }
    }

    unstickEntity(entity) {
        const terrain = this.game.terrain;
        const hw = entity.width / 2;
        const hh = entity.height / 2;

        // Check if any sample point is inside terrain
        if (!this._collidesAt(terrain, entity.x, entity.y, hw, hh)) return;

        // Try pushing up pixel by pixel
        for (let dy = 1; dy <= 50; dy++) {
            if (!this._collidesAt(terrain, entity.x, entity.y - dy, hw, hh)) {
                entity.y -= dy;
                return;
            }
        }

        // If still stuck, try left/right offsets
        for (let dx = 1; dx <= 30; dx++) {
            for (const dir of [-1, 1]) {
                for (let dy = 0; dy <= 50; dy++) {
                    if (!this._collidesAt(terrain, entity.x + dx * dir, entity.y - dy, hw, hh)) {
                        entity.x += dx * dir;
                        entity.y -= dy;
                        return;
                    }
                }
            }
        }
    }

    // Raycast from point in direction, returns first solid hit
    raycast(x0, y0, angle, maxDist) {
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);

        for (let d = 0; d < maxDist; d += 1) {
            const px = Math.round(x0 + dx * d);
            const py = Math.round(y0 + dy * d);

            if (this.game.terrain.isSolid(px, py)) {
                return { hit: true, x: px, y: py, distance: d };
            }
        }

        return { hit: false, distance: maxDist };
    }
}
