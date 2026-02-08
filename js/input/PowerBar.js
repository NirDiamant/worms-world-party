import { TurnPhase } from '../core/GameState.js';

export class PowerBar {
    constructor(game) {
        this.game = game;
        this.power = 0;
        this.charging = false;
        this.chargeSpeed = 100; // % per second
    }

    update(dt) {
        const input = this.game.input;
        const weapon = this.game.weapons.getCurrentWeapon();

        if (!weapon || !this.game.activeWorm || this.game.hasFired) return;

        if (weapon.requiresPower) {
            // Space to charge
            if (input.isDown('Space') && !this.charging && !this.game.hasFired) {
                this.charging = true;
                this.power = 0;
            }

            if (this.charging) {
                this.power += this.chargeSpeed * dt;

                if (this.power >= 100) {
                    this.power = 100;
                    // Auto-fire at max power
                    this.release();
                }

                // Release
                if (input.justReleased('Space')) {
                    this.release();
                }
            }
        } else {
            // No power needed - fire on space press
            if (input.justPressed('Space') && !this.game.hasFired) {
                const angle = this.game.aim.getWorldAngle();
                this.game.fireWeapon(angle, 50); // Default power
            }
        }
    }

    release() {
        if (!this.charging) return;
        this.charging = false;
        const angle = this.game.aim.getWorldAngle();
        this.game.fireWeapon(angle, this.power);
        this.power = 0;
    }

    reset() {
        this.power = 0;
        this.charging = false;
    }
}
