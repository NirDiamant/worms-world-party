import { Utils } from '../core/Utils.js';
import { Config } from '../core/Config.js';
import { Worm } from '../entities/Worm.js';
import { TrajectoryCalculator } from './TrajectoryCalculator.js';

export class AIController {
    constructor(game) {
        this.game = game;
        this.trajectory = new TrajectoryCalculator(game);
        this.thinkTimer = 0;
        this.thinking = true;
        this.decided = false;
        this.plan = null;
        this.actionTimer = 0;
        this.thinkDuration = 1.0;
        this.walkTimer = 0;
        this.walkDone = false;
    }

    update(dt, worm) {
        if (!worm || !worm.alive) return;

        // Thinking phase
        if (this.thinking) {
            this.thinkTimer += dt;
            if (this.thinkTimer >= this.thinkDuration) {
                this.thinking = false;
                this.plan = this.decidePlan(worm);
                this.actionTimer = 0;
                this.walkTimer = 0;
                this.walkDone = false;
            }
            return;
        }

        // Execute plan
        if (this.plan) {
            this.executePlan(worm, dt);
        }
    }

    reset() {
        this.thinkTimer = 0;
        this.thinking = true;
        this.decided = false;
        this.plan = null;
        this.walkDone = false;
    }

    decidePlan(worm) {
        const team = worm.team;
        const difficulty = team.aiDifficulty; // 0=easy, 1=medium, 2=hard

        const enemies = this.game.entities.filter(e =>
            e instanceof Worm && e.alive && e.team !== team
        );

        if (enemies.length === 0) return { action: 'skip' };

        // Score each enemy considering multiple factors
        let bestTarget = null;
        let bestScore = -Infinity;

        for (const enemy of enemies) {
            const dist = Utils.distance(worm.x, worm.y, enemy.x, enemy.y);
            let score = 0;

            // Prefer closer targets (but not TOO close for projectile weapons)
            score += Math.max(0, 1200 - dist) * 0.5;

            // Prefer low-health targets (finish them off)
            score += (100 - enemy.health) * 3;

            // Prefer targets near water (knockback → drown)
            const waterDist = this.game.water.level - enemy.y;
            if (waterDist < 80) score += (80 - waterDist) * 5;

            // Cluster bonus: other enemies nearby this target
            const nearbyEnemies = enemies.filter(e =>
                e !== enemy && Utils.distance(e.x, e.y, enemy.x, enemy.y) < 60
            ).length;
            score += nearbyEnemies * 80;

            // Prefer targets on terrain edges (easier to knock off)
            const surfaceBelow = this.game.terrain.findSurface(Math.round(enemy.x));
            const enemyFeet = enemy.y + enemy.height / 2;
            if (Math.abs(surfaceBelow - enemyFeet) < 5) {
                // Check if terrain is thin below
                let terrainDepth = 0;
                for (let dy = 0; dy < 40; dy++) {
                    if (this.game.terrain.isSolid(Math.round(enemy.x), Math.round(enemyFeet + dy))) {
                        terrainDepth++;
                    }
                }
                if (terrainDepth < 15) score += 60; // On thin terrain
            }

            // Hard penalize targets behind terrain (no LOS)
            if (!this.trajectory.hasLineOfSight(worm, enemy)) {
                if (difficulty >= 2) score -= 500; // Hard AI strongly avoids no-LOS
                else if (difficulty >= 1) score -= 300;
                else score -= 100;
            }

            if (score > bestScore) {
                bestScore = score;
                bestTarget = enemy;
            }
        }

        if (!bestTarget) return { action: 'skip' };

        const dist = Utils.distance(worm.x, worm.y, bestTarget.x, bestTarget.y);
        const hasLOS = this.trajectory.hasLineOfSight(worm, bestTarget);

        // Select weapon based on distance, ammo, and situation
        let weaponName = this.selectWeapon(worm, bestTarget, dist, hasLOS, difficulty);

        // Calculate firing solution
        const solution = this.trajectory.solve(worm, bestTarget, weaponName);

        // Apply difficulty-based jitter
        const jitter = [0.2, 0.08, 0.02][difficulty] || 0.12;
        const powerJitter = [15, 6, 2][difficulty] || 10;
        if (solution) {
            solution.angle += Utils.randomRange(-jitter, jitter);
            solution.power = Utils.clamp(
                solution.power + Utils.randomRange(-powerJitter, powerJitter),
                10, 100
            );
        }

        // Decide if AI should walk first (medium/hard difficulty)
        let walkDirection = 0;
        let walkDuration = 0;
        if (difficulty >= 1) {
            // Walk toward target if far away and no good shot
            if (solution && solution.accuracy > 40 && dist > 200) {
                walkDirection = bestTarget.x > worm.x ? 1 : -1;
                walkDuration = Utils.randomRange(0.5, 1.5);
            }
            // Walk closer for melee weapons
            if (['Fire Punch', 'Baseball Bat', 'Prod'].includes(weaponName) && dist > 50) {
                walkDirection = bestTarget.x > worm.x ? 1 : -1;
                walkDuration = Utils.clamp((dist - 40) / Config.WORM_WALK_SPEED, 0.3, 3.0);
            }
            // Hard AI: reposition for better angle
            if (difficulty >= 2 && !hasLOS && dist < 300) {
                walkDirection = Math.random() > 0.5 ? 1 : -1;
                walkDuration = Utils.randomRange(0.5, 1.0);
            }
        }

        return {
            action: 'fire',
            weapon: weaponName,
            target: bestTarget,
            solution: solution,
            walkDirection,
            walkDuration,
        };
    }

    selectWeapon(worm, target, dist, hasLOS, difficulty) {
        const weapons = this.game.weapons;

        // Melee range
        if (dist < 35) {
            const meleeOptions = ['Fire Punch', 'Baseball Bat'].filter(
                w => weapons.getAmmo(w) > 0
            );
            if (meleeOptions.length > 0) {
                // Prefer baseball bat for knockback near water
                const waterDist = this.game.water.level - target.y;
                if (waterDist < 100 && weapons.getAmmo('Baseball Bat') > 0) {
                    return 'Baseball Bat';
                }
                return Utils.randomChoice(meleeOptions);
            }
        }

        // Close range
        if (dist < 120 && hasLOS) {
            const closeOptions = ['Shotgun', 'Grenade', 'Bazooka'].filter(
                w => weapons.getAmmo(w) > 0
            );
            if (closeOptions.length > 0) return Utils.randomChoice(closeOptions);
        }

        // Check for cluster targets (enemies grouped together)
        const enemies = this.game.entities.filter(e =>
            e instanceof Worm && e.alive && e.team !== worm.team
        );
        const nearTarget = enemies.filter(e =>
            Utils.distance(e.x, e.y, target.x, target.y) < 50
        ).length;

        // Use cluster weapons on grouped enemies
        if (nearTarget >= 2 && difficulty >= 1) {
            const clusterOptions = ['Cluster Bomb', 'Grenade', 'Mortar'].filter(
                w => weapons.getAmmo(w) > 0
            );
            if (clusterOptions.length > 0) return Utils.randomChoice(clusterOptions);
        }

        // Medium range
        if (dist < 350) {
            const medOptions = ['Bazooka', 'Grenade', 'Mortar'].filter(
                w => weapons.getAmmo(w) > 0
            );
            if (medOptions.length > 0) return Utils.randomChoice(medOptions);
        }

        // Long range
        const longOptions = ['Bazooka', 'Mortar', 'Grenade'].filter(
            w => weapons.getAmmo(w) > 0
        );
        if (longOptions.length > 0) return Utils.randomChoice(longOptions);

        // Fallback
        return 'Bazooka';
    }

    executePlan(worm, dt) {
        this.actionTimer += dt;

        if (this.plan.action === 'skip') {
            if (this.actionTimer > 0.5) {
                this.game.weapons.selectWeaponByName('Skip Turn');
                this.game.fireWeapon(0, 0);
                this.plan = null;
            }
            return;
        }

        if (this.plan.action === 'fire') {
            // Phase 0: Walking to reposition (if planned)
            if (!this.walkDone && this.plan.walkDuration > 0) {
                this.walkTimer += dt;
                if (this.walkTimer < this.plan.walkDuration) {
                    if (this.plan.walkDirection > 0) {
                        worm.moveRight(dt);
                    } else if (this.plan.walkDirection < 0) {
                        worm.moveLeft(dt);
                    }
                    // Face the target
                    if (this.plan.target) {
                        worm.facing = this.plan.target.x > worm.x ? 1 : -1;
                    }
                    return;
                } else {
                    worm.stopMoving();
                    this.walkDone = true;
                    this.actionTimer = 0; // Reset action timer for firing phases
                    // Recalculate solution from new position
                    const newSolution = this.trajectory.solve(worm, this.plan.target, this.plan.weapon);
                    if (newSolution) {
                        const difficulty = worm.team.aiDifficulty;
                        const jitter = [0.2, 0.08, 0.02][difficulty] || 0.12;
                        const powerJitter = [15, 6, 2][difficulty] || 10;
                        newSolution.angle += Utils.randomRange(-jitter, jitter);
                        newSolution.power = Utils.clamp(
                            newSolution.power + Utils.randomRange(-powerJitter, powerJitter),
                            10, 100
                        );
                        this.plan.solution = newSolution;
                    }
                }
            } else {
                this.walkDone = true;
            }

            // Phase 1: Select weapon (0-0.3s)
            if (this.actionTimer < 0.3) {
                this.game.weapons.selectWeaponByName(this.plan.weapon);
                // Face the target
                if (this.plan.target) {
                    worm.facing = this.plan.target.x > worm.x ? 1 : -1;
                }
                return;
            }

            // Phase 2: Aim (0.3-1.2s)
            if (this.actionTimer < 1.2) {
                const solution = this.plan.solution;
                // Convert world-space angle to aim-relative angle for visual display
                this.game.aim.angle = worm.facing > 0 ? solution.angle : Math.PI - solution.angle;
                return;
            }

            // Phase 3: Fire (1.2s)
            if (this.actionTimer >= 1.2 && !this.decided) {
                this.decided = true;
                const solution = this.plan.solution;

                // Verify weapon selection succeeded
                const weapon = this.game.weapons.getCurrentWeapon();
                if (!weapon || weapon.name !== this.plan.weapon) {
                    // Weapon selection failed - try Bazooka as fallback
                    this.game.weapons.selectWeaponByName('Bazooka');
                }

                // solution.angle is already in world-space — pass directly
                const angle = solution.angle;

                if (weapon && (weapon.isMelee || !weapon.requiresPower)) {
                    this.game.fireWeapon(angle, 50);
                } else {
                    this.game.fireWeapon(angle, solution.power);
                }
                this.plan = null;
            }
        }
    }
}
