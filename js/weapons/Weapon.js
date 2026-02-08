export class Weapon {
    constructor(name, config = {}) {
        this.name = name;
        this.category = config.category || 'projectile';
        this.ammoDefault = config.ammo !== undefined ? config.ammo : Infinity;
        this.requiresAim = config.requiresAim !== undefined ? config.requiresAim : true;
        this.requiresPower = config.requiresPower !== undefined ? config.requiresPower : true;
        this.endsTurnOnFire = config.endsTurnOnFire !== undefined ? config.endsTurnOnFire : true;
        this.isMelee = config.isMelee || false;
        this.isHitscan = config.isHitscan || false;
        this.hasFuseTimer = config.hasFuseTimer || false;
        this.crateOnly = config.crateOnly || false;
        this.retreatOnUse = config.retreatOnUse || false;
    }

    fire(game, worm, angle, power) {
        // Override in subclasses
    }
}
