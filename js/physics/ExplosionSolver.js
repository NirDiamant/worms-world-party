import { Utils } from '../core/Utils.js';
import { Worm } from '../entities/Worm.js';
import { Mine } from '../entities/Mine.js';
import { Crate } from '../entities/Crate.js';
import { Barrel } from '../entities/Barrel.js';

export class ExplosionSolver {
    constructor(game) {
        this.game = game;
    }

    resolve(x, y, radius, damage, owner) {
        // Carve terrain
        this.game.terrain.carveCircle(x, y, radius);

        // Apply damage and knockback to entities
        // Extended damage zone: damage applies within 2× radius with gentle falloff
        const entities = [...this.game.entities, ...this.game.projectiles];
        const damageRadius = radius * 2.0;

        for (const entity of entities) {
            if (!entity.alive) continue;
            if (entity === owner && damage === 0) continue; // Skip owner for cosmetic explosions

            const dist = Utils.distance(x, y, entity.x, entity.y);
            if (dist > damageRadius * 1.1) continue;

            if (entity instanceof Worm) {
                // Gentle falloff: power curve for satisfying splash damage
                // Full damage at center, generous damage at mid-range, zero at edge
                const normalizedDist = Math.min(dist / damageRadius, 1);
                const falloff = Math.max(0, Math.pow(1 - normalizedDist, 0.7));
                const actualDamage = damage * falloff;

                if (actualDamage > 1) {
                    // Knockback direction and force
                    const angle = Utils.angle(x, y, entity.x, entity.y);
                    const knockbackForce = falloff * radius * 6;
                    const kbx = Math.cos(angle) * knockbackForce;
                    const kby = Math.sin(angle) * knockbackForce - falloff * radius * 3; // Upward bias

                    const prevHealth = entity.health;
                    entity.takeDamage(actualDamage, kbx, kby);

                    // Track stats for the owner
                    if (owner && owner.team && owner !== entity) {
                        owner.damageDealt = (owner.damageDealt || 0) + Math.round(actualDamage);
                        if (entity.health <= 0 && prevHealth > 0) {
                            owner.kills = (owner.kills || 0) + 1;
                        }
                    }
                }
            } else if (entity instanceof Mine) {
                // Chain reaction: trigger mines
                if (dist < radius * 1.5) {
                    entity.fuseTimer = 0.1;
                    entity.armed = true;
                }
            } else if (entity instanceof Barrel) {
                if (dist < damageRadius) {
                    const normalizedDist = Math.min(dist / damageRadius, 1);
                    const falloff = Math.max(0, Math.pow(1 - normalizedDist, 0.7));
                    entity.takeDamage(damage * falloff);
                }
            } else if (entity instanceof Crate) {
                if (dist < radius * 1.3) {
                    entity.alive = false;
                    this.game.particles.emit({
                        x: entity.x, y: entity.y, count: 8,
                        speed: 80, life: 0.5, size: 3,
                        color: { r: 139, g: 69, b: 19 },
                        gravity: true, fade: true,
                    });
                }
            }
        }

        // Terrain-colored debris particles
        const theme = this.game.terrain.theme;
        if (theme && theme.terrainColors) {
            const debrisColors = theme.terrainColors.slice(0, 3).map(tc => ({
                r: tc.color.r, g: tc.color.g, b: tc.color.b
            }));
            this.game.particles.emit({
                x, y, count: Math.floor(radius * 0.6),
                speed: radius * 3.5, speedVariance: 0.6,
                angle: -Math.PI / 2, angleVariance: Math.PI * 0.7,
                life: 1.2, size: 4,
                colors: debrisColors,
                gravity: true, shrink: false, fade: false,
            });
        }

        // Particles and effects
        this.game.particles.emitExplosion(x, y, radius);

        // Camera shake
        this.game.camera.shake(radius * 0.4);

        // Sound
        this.game.audio.play('explosion', { size: radius });
    }
}
