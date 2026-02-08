import { Config } from '../core/Config.js';
import { Utils } from '../core/Utils.js';

export class TrajectoryCalculator {
    constructor(game) {
        this.game = game;

        // Per-weapon speed formulas matching actual weapon code
        this.speedFormulas = {
            'Bazooka':            (p) => 200 + p * 5,
            'Mortar':             (p) => 200 + p * 5,
            'Grenade':            (p) => 150 + p * 4,
            'Cluster Bomb':       (p) => 150 + p * 4,
            'Banana Bomb':        (p) => 150 + p * 4,
            'Holy Hand Grenade':  (p) => 120 + p * 3,
        };
    }

    getSpeedForWeapon(weaponName, power) {
        const formula = this.speedFormulas[weaponName];
        return formula ? formula(power) : 200 + power * 5;
    }

    solve(shooter, target, weaponName) {
        const dx = target.x - shooter.x;
        const dy = (target.y - target.height * 0.3) - (shooter.y - shooter.height * 0.3);
        const dist = Math.sqrt(dx * dx + dy * dy);
        const directAngle = Math.atan2(dy, dx);

        // Melee weapons - just face the target
        if (['Fire Punch', 'Baseball Bat', 'Prod'].includes(weaponName)) {
            return { angle: directAngle, power: 50, accuracy: 0 };
        }

        // Hitscan weapons - aim directly at target
        if (['Shotgun', 'Uzi', 'Minigun'].includes(weaponName)) {
            return { angle: directAngle, power: 50, accuracy: 0 };
        }

        // Projectile weapons - calculate ballistic trajectory
        const gravity = Config.GRAVITY;
        const wind = this.game.wind;
        const isWindAffected = !['Grenade', 'Cluster Bomb', 'Banana Bomb', 'Holy Hand Grenade'].includes(weaponName);

        let bestAngle = directAngle;
        let bestPower = 60;
        let bestDist = Infinity;

        const sx = shooter.x;
        const sy = shooter.y - shooter.height * 0.3;
        const tx = target.x;
        const ty = target.y - target.height * 0.3;

        // Phase 1: Coarse search (60 angles x 25 powers = 1500 combos)
        const angleSteps = 60;
        const powerSteps = 25;
        const angleMin = -Math.PI * 0.95;
        const angleMax = Math.PI * 0.15;
        const angleRange = angleMax - angleMin;

        for (let a = 0; a < angleSteps; a++) {
            const angle = angleMin + a * (angleRange / angleSteps);

            for (let p = 0; p < powerSteps; p++) {
                const power = 10 + p * (90 / powerSteps);
                const speed = this.getSpeedForWeapon(weaponName, power);

                const landing = this.simulateTrajectory(
                    sx, sy,
                    Math.cos(angle) * speed, Math.sin(angle) * speed,
                    gravity, wind, isWindAffected
                );

                if (landing) {
                    const hitDist = Utils.distance(landing.x, landing.y, tx, ty);
                    if (hitDist < bestDist) {
                        bestDist = hitDist;
                        bestAngle = angle;
                        bestPower = power;
                    }
                }
            }
        }

        // Phase 2: Refinement pass - narrow search around best solution
        if (bestDist < 200) {
            const refAngleRange = angleRange / angleSteps * 2;
            const refPowerRange = 90 / powerSteps * 2;
            const refSteps = 15;

            for (let a = 0; a < refSteps; a++) {
                const angle = bestAngle - refAngleRange + a * (2 * refAngleRange / refSteps);
                for (let p = 0; p < refSteps; p++) {
                    const power = Utils.clamp(
                        bestPower - refPowerRange + p * (2 * refPowerRange / refSteps),
                        10, 100
                    );
                    const speed = this.getSpeedForWeapon(weaponName, power);

                    const landing = this.simulateTrajectory(
                        sx, sy,
                        Math.cos(angle) * speed, Math.sin(angle) * speed,
                        gravity, wind, isWindAffected
                    );

                    if (landing) {
                        const hitDist = Utils.distance(landing.x, landing.y, tx, ty);
                        if (hitDist < bestDist) {
                            bestDist = hitDist;
                            bestAngle = angle;
                            bestPower = power;
                        }
                    }
                }
            }

            // Phase 3: Fine refinement (if close enough, polish further)
            if (bestDist < 80) {
                const fineAngleRange = refAngleRange / 3;
                const finePowerRange = refPowerRange / 3;
                const fineSteps = 10;

                for (let a = 0; a < fineSteps; a++) {
                    const angle = bestAngle - fineAngleRange + a * (2 * fineAngleRange / fineSteps);
                    for (let p = 0; p < fineSteps; p++) {
                        const power = Utils.clamp(
                            bestPower - finePowerRange + p * (2 * finePowerRange / fineSteps),
                            10, 100
                        );
                        const speed = this.getSpeedForWeapon(weaponName, power);

                        const landing = this.simulateTrajectory(
                            sx, sy,
                            Math.cos(angle) * speed, Math.sin(angle) * speed,
                            gravity, wind, isWindAffected
                        );

                        if (landing) {
                            const hitDist = Utils.distance(landing.x, landing.y, tx, ty);
                            if (hitDist < bestDist) {
                                bestDist = hitDist;
                                bestAngle = angle;
                                bestPower = power;
                            }
                        }
                    }
                }
            }
        }

        // Return solution with accuracy metric
        if (bestDist < 100) {
            return { angle: bestAngle, power: bestPower, accuracy: bestDist };
        }

        // Fallback: analytical ballistic estimate
        return this.analyticalFallback(sx, sy, tx, ty, gravity, wind, weaponName, isWindAffected);
    }

    analyticalFallback(sx, sy, tx, ty, gravity, wind, weaponName, isWindAffected) {
        // Use simplified ballistic formula: y = x*tan(θ) - g*x²/(2*v²*cos²(θ))
        const dx = tx - sx;
        const dy = ty - sy;
        const absDx = Math.abs(dx);

        // Try multiple power/angle combos analytically
        let bestAngle = Math.atan2(dy, dx) - 0.3;
        let bestPower = 60;
        let bestDist = Infinity;

        for (let power = 20; power <= 100; power += 5) {
            const speed = this.getSpeedForWeapon(weaponName, power);

            // Solve for angle using ballistic formula
            // For flat terrain: θ = 0.5 * asin(g*R/v²) where R is range
            const v2 = speed * speed;
            const gR = gravity * absDx;

            if (gR / v2 <= 1) {
                // Two solutions exist
                const baseAngle = 0.5 * Math.asin(gR / v2);

                // Low trajectory
                let angle = dx > 0 ? -baseAngle : -(Math.PI - baseAngle);
                // Account for height difference
                angle -= dy / (absDx + 50) * 0.3;

                const landing = this.simulateTrajectory(
                    sx, sy,
                    Math.cos(angle) * speed, Math.sin(angle) * speed,
                    gravity, isWindAffected ? wind : 0, isWindAffected
                );

                if (landing) {
                    const hitDist = Utils.distance(landing.x, landing.y, tx, ty);
                    if (hitDist < bestDist) {
                        bestDist = hitDist;
                        bestAngle = angle;
                        bestPower = power;
                    }
                }

                // High trajectory
                angle = dx > 0 ? -(Math.PI / 2 - baseAngle) : -(Math.PI / 2 + baseAngle);
                angle -= dy / (absDx + 50) * 0.2;

                const landing2 = this.simulateTrajectory(
                    sx, sy,
                    Math.cos(angle) * speed, Math.sin(angle) * speed,
                    gravity, isWindAffected ? wind : 0, isWindAffected
                );

                if (landing2) {
                    const hitDist = Utils.distance(landing2.x, landing2.y, tx, ty);
                    if (hitDist < bestDist) {
                        bestDist = hitDist;
                        bestAngle = angle;
                        bestPower = power;
                    }
                }
            }
        }

        return { angle: bestAngle, power: bestPower, accuracy: bestDist };
    }

    hasLineOfSight(shooter, target) {
        const terrain = this.game.terrain;
        const sx = shooter.x;
        const sy = shooter.y - shooter.height * 0.3;
        const tx = target.x;
        const ty = target.y - target.height * 0.3;

        const steps = Math.ceil(Utils.distance(sx, sy, tx, ty) / 6);
        for (let i = 1; i < steps - 1; i++) {
            const t = i / steps;
            const x = sx + (tx - sx) * t;
            const y = sy + (ty - sy) * t;
            if (terrain.isSolid(Math.round(x), Math.round(y))) {
                return false;
            }
        }
        return true;
    }

    simulateTrajectory(x, y, vx, vy, gravity, wind, isWindAffected) {
        const dt = 1 / 60;
        const maxSteps = 500;

        for (let i = 0; i < maxSteps; i++) {
            vy += gravity * dt;
            if (isWindAffected) {
                vx += wind * dt;
            }

            x += vx * dt;
            y += vy * dt;

            // Hit terrain
            if (this.game.terrain.isSolid(Math.round(x), Math.round(y))) {
                return { x, y };
            }

            // Hit water
            if (y > this.game.water.level) {
                return { x, y: this.game.water.level };
            }

            // Out of bounds
            if (x < 0 || x > Config.WORLD_WIDTH || y > Config.WORLD_HEIGHT) {
                return null;
            }
        }

        return null;
    }
}
