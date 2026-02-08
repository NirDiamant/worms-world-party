import { Config } from '../core/Config.js';

export class WormPhysics {
    // Utility class for worm-specific physics calculations
    static calculateFallDamage(fallDistance) {
        if (fallDistance <= Config.FALL_DAMAGE_THRESHOLD) return 0;
        return Math.min(
            (fallDistance - Config.FALL_DAMAGE_THRESHOLD) * Config.FALL_DAMAGE_PER_PX,
            Config.FALL_DAMAGE_MAX
        );
    }

    static canClimbSlope(terrain, x, y, height, maxClimb) {
        const feetY = y + height / 2;

        // Check if we can find solid ground within climb range
        for (let dy = 0; dy <= maxClimb; dy++) {
            if (terrain.isSolid(Math.round(x), Math.round(feetY - dy)) &&
                !terrain.isSolid(Math.round(x), Math.round(feetY - dy - height))) {
                return { canClimb: true, newY: feetY - dy - height / 2 };
            }
        }

        return { canClimb: false };
    }
}
