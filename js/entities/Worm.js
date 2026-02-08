import { Entity } from './Entity.js';
import { Config } from '../core/Config.js';
import { Utils } from '../core/Utils.js';

export class Worm extends Entity {
    constructor(game, x, y, name, team) {
        super(game, x, y);
        this.name = name;
        this.team = team;
        this.width = Config.WORM_WIDTH;
        this.height = Config.WORM_HEIGHT;
        this.health = Config.WORM_INITIAL_HEALTH;
        this.facing = Math.random() > 0.5 ? 1 : -1;
        this.walking = false;
        this.walkFrame = 0;
        this.walkTimer = 0;
        this.isActive = false;
        this.inRetreat = false;
        this.fallStartY = null;
        this.affectedByGravity = true;
        this.mass = 1;
        this.hasParachute = false;
        this.parachuteOpen = false;
        this.damageFlash = 0;
        this.deathAnimTimer = 0;
        this.isDying = false;

        // Idle animation
        this.idleTimer = 0;
        this.blinkTimer = 0;
        this.nextBlinkTime = Utils.randomRange(3, 5);

        // Death animation
        this.deathVY = 0;
        this.deathSpin = 0;
        this.deathAngle = 0;

        // Stats tracking
        this.damageDealt = 0;
        this.kills = 0;
    }

    startTurn() {
        this.isActive = true;
        this.inRetreat = false;
    }

    endControl() {
        this.walking = false;
    }

    startRetreat() {
        this.inRetreat = true;
        this.isActive = true;
    }

    endTurn() {
        this.isActive = false;
        this.inRetreat = false;
        this.walking = false;
    }

    moveLeft(dt) {
        if (!this.grounded || this.isDying) return;
        this.facing = -1;
        this.walking = true;

        // Try to move left, climbing slopes
        const targetX = this.x - Config.WORM_WALK_SPEED * dt;
        this.tryMove(targetX);
    }

    moveRight(dt) {
        if (!this.grounded || this.isDying) return;
        this.facing = 1;
        this.walking = true;

        const targetX = this.x + Config.WORM_WALK_SPEED * dt;
        this.tryMove(targetX);
    }

    tryMove(targetX) {
        const terrain = this.game.terrain;

        // Check if we can walk there - try to find ground at new position
        const feetY = this.y + this.height / 2;

        // Look for ground at new x position (check downward from current position)
        for (let dy = -Config.WORM_MAX_CLIMB; dy <= Config.WORM_MAX_CLIMB + 4; dy++) {
            const checkY = feetY + dy;
            const headY = checkY - this.height;

            // Check if feet are on solid ground and head is clear
            if (terrain.isSolid(targetX, checkY) && !terrain.isSolid(targetX, headY)) {
                // Find exact surface
                let surfaceY = checkY;
                while (surfaceY > 0 && terrain.isSolid(targetX, surfaceY - 1)) {
                    surfaceY--;
                    if (feetY - surfaceY > Config.WORM_MAX_CLIMB) return; // Too steep
                }
                while (!terrain.isSolid(targetX, surfaceY)) {
                    surfaceY++;
                    if (surfaceY > this.game.terrain.height) return;
                }

                this.x = targetX;
                this.y = surfaceY - this.height / 2;
                this.grounded = true;
                return;
            }
        }
    }

    stopMoving() {
        this.walking = false;
    }

    jump() {
        if (!this.grounded || this.isDying) return;
        this.vx = Config.WORM_JUMP_VX * this.facing;
        this.vy = Config.WORM_JUMP_VY;
        this.grounded = false;
        this.fallStartY = this.y;
        this.game.audio.play('jump');
    }

    backflip() {
        if (!this.grounded || this.isDying) return;
        this.vx = Config.WORM_BACKFLIP_VX * this.facing;
        this.vy = Config.WORM_BACKFLIP_VY;
        this.grounded = false;
        this.fallStartY = this.y;
        this.game.audio.play('jump');
    }

    takeDamage(amount, knockbackX, knockbackY) {
        if (!this.alive) return;

        this.health = Math.max(0, this.health - Math.round(amount));
        this.damageFlash = 0.3;

        // Apply knockback
        if (knockbackX !== undefined) {
            this.vx += knockbackX;
            this.vy += knockbackY;
            this.grounded = false;
            this.fallStartY = null; // Don't take fall damage from knockback start
        }

        this.game.audio.play('hurt');

        // Emit damage number
        this.game.events.emit('damageNumber', {
            x: this.x,
            y: this.y - this.height,
            amount: Math.round(amount),
        });

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.isDying = true;
        this.deathAnimTimer = 1.0; // 1 second death animation
        this.deathVY = -120; // Pop upward
        this.deathSpin = 8; // radians/sec rotation
        this.deathAngle = 0;
        this.grounded = false;
        this.game.audio.play('death');
    }

    drown() {
        if (!this.alive) return;
        this.health = 0;
        this.alive = false;
        this.game.particles.emitSplash(this.x, this.game.water.level);
        this.game.audio.play('splash');

        this.game.events.emit('wormDied', {
            worm: this,
            cause: 'drown',
        });
    }

    onLanded(fallDistance) {
        if (fallDistance > Config.FALL_DAMAGE_THRESHOLD) {
            const damage = Math.min(
                (fallDistance - Config.FALL_DAMAGE_THRESHOLD) * Config.FALL_DAMAGE_PER_PX,
                Config.FALL_DAMAGE_MAX
            );
            if (damage > 0) {
                this.takeDamage(damage);
                this.game.audio.play('fallDamage');
            }
        }
        this.fallStartY = null;
    }

    update(dt) {
        super.update(dt);

        // Walk animation
        if (this.walking && this.grounded) {
            this.walkTimer += dt;
            if (this.walkTimer > 0.15) {
                this.walkTimer = 0;
                this.walkFrame = (this.walkFrame + 1) % 4;
            }
        } else {
            this.walkFrame = 0;
            this.walkTimer = 0;
        }

        // Damage flash
        if (this.damageFlash > 0) {
            this.damageFlash -= dt;
        }

        // Idle animation (breathing + blink)
        if (this.grounded && !this.walking && !this.isDying) {
            this.idleTimer += dt;
            // Blink timer
            if (this.idleTimer >= this.nextBlinkTime) {
                this.blinkTimer = 0.15;
                this.nextBlinkTime = this.idleTimer + Utils.randomRange(3, 5);
            }
            if (this.blinkTimer > 0) {
                this.blinkTimer -= dt;
            }
        } else {
            this.idleTimer = 0;
        }

        // Death animation
        if (this.isDying) {
            this.deathAnimTimer -= dt;
            this.deathAngle += this.deathSpin * dt;
            this.deathVY += Config.GRAVITY * dt;
            this.y += this.deathVY * dt;
            if (this.deathAnimTimer <= 0) {
                this.alive = false;
                // Spawn tombstone
                this.game.events.emit('wormDied', {
                    worm: this,
                    cause: 'killed',
                    x: this.x,
                    y: this.y,
                });
                // Bigger explosion on death
                this.game.addExplosion(this.x, this.y, 25, 0, this);
            }
        }

        // Parachute
        if (this.hasParachute && !this.grounded && this.vy > 50) {
            this.parachuteOpen = true;
            this.vy = Math.min(this.vy, 40); // Slow fall
        } else {
            this.parachuteOpen = false;
        }

        // Track fall start
        if (!this.grounded && this.fallStartY === null) {
            this.fallStartY = this.y;
        }
    }

    draw(ctx, x, y) {
        const sprite = this.game.sprites.createWormSprite(
            this.team.color,
            this.facing,
            this.walkFrame
        );

        // Idle breathing offset
        let breathOffset = 0;
        if (this.grounded && !this.walking && !this.isDying) {
            breathOffset = Math.sin(this.idleTimer * 2.5) * 0.8;
        }

        // Airborne tilt
        let tiltAngle = 0;
        if (!this.grounded && !this.isDying) {
            tiltAngle = Utils.clamp(this.vy * 0.002, -0.4, 0.4);
        }

        // Death spin angle
        if (this.isDying) {
            tiltAngle = this.deathAngle;
        }

        // Damage flash effect - faster during death
        if (this.damageFlash > 0 && Math.sin(this.damageFlash * 30) > 0) {
            ctx.globalAlpha = 0.5;
        }

        // Death animation - rapid flash between white and normal
        if (this.isDying) {
            ctx.globalAlpha = Math.sin(this.deathAnimTimer * 30) > 0 ? 1 : 0.3;
        }

        ctx.save();
        ctx.translate(x, y + breathOffset);
        ctx.rotate(tiltAngle);
        ctx.drawImage(sprite, -this.width / 2, -this.height / 2, this.width, this.height);

        // Eye blink overlay (skin-colored rect over eye area)
        if (this.blinkTimer > 0 && !this.isDying) {
            ctx.fillStyle = this.team.color.primary;
            const eyeX = this.facing > 0 ? 2 : -6;
            ctx.fillRect(eyeX, -this.height / 2 + 5, 5, 3);
        }

        ctx.restore();
        ctx.globalAlpha = 1;

        // Parachute
        if (this.parachuteOpen) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x - 10, y - this.height / 2 - 15);
            ctx.quadraticCurveTo(x, y - this.height / 2 - 25, x + 10, y - this.height / 2 - 15);
            ctx.stroke();

            // Lines
            ctx.beginPath();
            ctx.moveTo(x - 10, y - this.height / 2 - 15);
            ctx.lineTo(x, y - this.height / 2);
            ctx.moveTo(x + 10, y - this.height / 2 - 15);
            ctx.lineTo(x, y - this.height / 2);
            ctx.stroke();

            // Canopy
            ctx.fillStyle = 'rgba(255, 255, 200, 0.6)';
            ctx.beginPath();
            ctx.moveTo(x - 12, y - this.height / 2 - 14);
            ctx.quadraticCurveTo(x, y - this.height / 2 - 28, x + 12, y - this.height / 2 - 14);
            ctx.fill();
        }
    }
}
