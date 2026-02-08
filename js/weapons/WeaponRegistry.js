import { Bazooka, GrenadeWeapon, ClusterBombWeapon, BananaBombWeapon, HolyHandGrenadeWeapon, MortarWeapon } from './ProjectileWeapons.js';
import { Shotgun, Uzi, Minigun } from './GunWeapons.js';
import { FirePunch, BaseballBat, Prod } from './MeleeWeapons.js';
import { Dynamite, MineWeapon, SheepWeapon } from './PlacedWeapons.js';
import { AirStrike, NapalmStrike } from './StrikeWeapons.js';
import { NinjaRope, Teleport, Girder, Blowtorch, Drill } from './ToolWeapons.js';
import { ConcreteDonkey, Armageddon, Earthquake } from './SuperWeapons.js';
import { Weapon } from './Weapon.js';

// Skip Turn pseudo-weapon
class SkipTurn extends Weapon {
    constructor() {
        super('Skip Turn', {
            ammo: Infinity, category: 'utility',
            requiresAim: false, requiresPower: false,
            endsTurnOnFire: true,
        });
    }

    fire(game, worm, angle, power) {
        // Just end the turn
        game.turnPhase.setState('TURN_END');
    }
}

export class WeaponRegistry {
    constructor(game) {
        this.game = game;
        this.weapons = [];
        this.ammo = new Map();
        this.currentIndex = 0;
        this.fuseTimer = 3;

        this.registerWeapons();
    }

    registerWeapons() {
        this.weapons = [
            new Bazooka(),
            new GrenadeWeapon(),
            new ClusterBombWeapon(),
            new BananaBombWeapon(),
            new HolyHandGrenadeWeapon(),
            new MortarWeapon(),
            new Shotgun(),
            new Uzi(),
            new Minigun(),
            new FirePunch(),
            new BaseballBat(),
            new Prod(),
            new Dynamite(),
            new MineWeapon(),
            new SheepWeapon(),
            new AirStrike(),
            new NapalmStrike(),
            new NinjaRope(),
            new Teleport(),
            new Girder(),
            new Blowtorch(),
            new Drill(),
            new ConcreteDonkey(),
            new Armageddon(),
            new Earthquake(),
            new SkipTurn(),
        ];
    }

    initAmmo() {
        this.ammo.clear();
        for (const weapon of this.weapons) {
            this.ammo.set(weapon.name, weapon.ammoDefault);
        }
    }

    getCurrentWeapon() {
        return this.weapons[this.currentIndex] || null;
    }

    cycleWeapon() {
        let attempts = 0;
        do {
            this.currentIndex = (this.currentIndex + 1) % this.weapons.length;
            attempts++;
        } while (this.getAmmo(this.weapons[this.currentIndex].name) <= 0 && attempts < this.weapons.length);
    }

    selectWeapon(index) {
        if (index >= 0 && index < this.weapons.length) {
            if (this.getAmmo(this.weapons[index].name) > 0) {
                this.currentIndex = index;
            }
        }
    }

    selectWeaponByName(name) {
        const idx = this.weapons.findIndex(w => w.name === name);
        if (idx !== -1 && this.getAmmo(name) > 0) {
            this.currentIndex = idx;
        }
    }

    getAmmo(weaponName) {
        return this.ammo.get(weaponName) || 0;
    }

    useAmmo(weaponName) {
        const current = this.ammo.get(weaponName);
        if (current === Infinity) return;
        if (current > 0) {
            this.ammo.set(weaponName, current - 1);
        }
    }

    addAmmo(weaponName, amount) {
        const current = this.ammo.get(weaponName) || 0;
        if (current === Infinity) return;
        this.ammo.set(weaponName, current + amount);
    }

    setFuseTimer(seconds) {
        this.fuseTimer = seconds;
        const weapon = this.getCurrentWeapon();
        if (weapon && weapon.hasFuseTimer) {
            weapon.fuseTime = seconds;
        }
    }

    getWeaponList() {
        return this.weapons;
    }

    getRandomCrateWeapon() {
        // Weighted random - prefer rare/powerful weapons
        const crateWeapons = this.weapons.filter(w =>
            w.crateOnly || (w.ammoDefault !== Infinity && w.name !== 'Skip Turn')
        );
        if (crateWeapons.length === 0) {
            return this.weapons[0];
        }
        return crateWeapons[Math.floor(Math.random() * crateWeapons.length)];
    }
}
