import { Config } from '../core/Config.js';
import {
    renderPixelArt, flipGrid, makeWormPalette,
    WORM_STAND_R, WORM_WALK_R,
    MISSILE, MISSILE_PALETTE,
    GRENADE, GRENADE_PALETTE,
    CLUSTER_BOMB, CLUSTER_BOMB_PALETTE,
    CLUSTER_FRAGMENT, CLUSTER_FRAGMENT_PALETTE,
    MINE, MINE_PALETTE,
    DYNAMITE, DYNAMITE_PALETTE,
    BANANA, BANANA_PALETTE,
    HOLY_GRENADE, HOLY_GRENADE_PALETTE,
    NAPALM, NAPALM_PALETTE,
    TOMBSTONE, TOMBSTONE_PALETTE,
    WEAPON_CRATE, WEAPON_CRATE_PALETTE,
    HEALTH_CRATE, HEALTH_CRATE_PALETTE,
    SHEEP_R, SHEEP_PALETTE,
    DONKEY, DONKEY_PALETTE,
} from './PixelArtData.js';

export class SpriteFactory {
    constructor() {
        this.cache = new Map();
        this.images = {};
        this.loaded = false;
    }

    async init() {
        const base = 'sprites';
        const manifest = {
            // Worm standing poses
            worm_east: `${base}/worm/rotations/east.png`,
            worm_west: `${base}/worm/rotations/west.png`,
            // Worm walk animation frames
            worm_walk_east_0: `${base}/worm/animations/walking-4-frames/east/frame_000.png`,
            worm_walk_east_1: `${base}/worm/animations/walking-4-frames/east/frame_001.png`,
            worm_walk_east_2: `${base}/worm/animations/walking-4-frames/east/frame_002.png`,
            worm_walk_east_3: `${base}/worm/animations/walking-4-frames/east/frame_003.png`,
            worm_walk_west_0: `${base}/worm/animations/walking-4-frames/west/frame_000.png`,
            worm_walk_west_1: `${base}/worm/animations/walking-4-frames/west/frame_001.png`,
            worm_walk_west_2: `${base}/worm/animations/walking-4-frames/west/frame_002.png`,
            worm_walk_west_3: `${base}/worm/animations/walking-4-frames/west/frame_003.png`,
            // Map objects
            sheep: `${base}/sheep.png`,
            dynamite: `${base}/dynamite.png`,
            health_crate: `${base}/health_crate.png`,
            weapon_crate: `${base}/weapon_crate.png`,
            tombstone: `${base}/tombstone.png`,
            concrete_donkey: `${base}/concrete_donkey.png`,
            mine: `${base}/mine.png`,
        };

        const promises = Object.entries(manifest).map(([key, src]) =>
            new Promise(resolve => {
                const img = new Image();
                img.onload = () => { this.images[key] = img; resolve(); };
                img.onerror = () => resolve();
                img.src = src;
            })
        );

        await Promise.all(promises);
        this.loaded = true;
    }

    // Scale an image to target dimensions, returning a canvas
    scaleImage(img, w, h) {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, w, h);
        return canvas;
    }

    // Tint a canvas/image with a team color overlay
    tintSprite(source, color, intensity = 0.45) {
        const w = source.width;
        const h = source.height;
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(source, 0, 0);
        ctx.globalCompositeOperation = 'source-atop';
        ctx.globalAlpha = intensity;
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
        return canvas;
    }

    // Crop transparent padding from a sprite
    cropSprite(img) {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = data.data;
        let top = canvas.height, bottom = 0, left = canvas.width, right = 0;
        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                if (pixels[(y * canvas.width + x) * 4 + 3] > 10) {
                    if (y < top) top = y;
                    if (y > bottom) bottom = y;
                    if (x < left) left = x;
                    if (x > right) right = x;
                }
            }
        }
        if (top > bottom) return canvas; // fully transparent
        const w = right - left + 1;
        const h = bottom - top + 1;
        const cropped = document.createElement('canvas');
        cropped.width = w;
        cropped.height = h;
        const cctx = cropped.getContext('2d');
        cctx.drawImage(canvas, left, top, w, h, 0, 0, w, h);
        return cropped;
    }

    // Flip a canvas horizontally
    flipCanvas(source) {
        const canvas = document.createElement('canvas');
        canvas.width = source.width;
        canvas.height = source.height;
        const ctx = canvas.getContext('2d');
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(source, 0, 0);
        return canvas;
    }

    getSprite(key, generator) {
        if (this.cache.has(key)) return this.cache.get(key);
        const sprite = generator();
        this.cache.set(key, sprite);
        return sprite;
    }

    createWormSprite(teamColor, facing, frame = 0) {
        const key = `worm_${teamColor.name}_${facing}_${frame}`;
        return this.getSprite(key, () => {
            const dir = facing >= 0 ? 'east' : 'west';

            // Try walk frame when walking (frame > 0), else standing pose
            let img = null;
            if (frame > 0) {
                img = this.images[`worm_walk_${dir}_${frame}`] || this.images[`worm_walk_${dir}_0`];
            }
            if (!img) {
                img = this.images[`worm_${dir}`];
            }

            if (img) {
                // Crop transparent padding so character fills the canvas
                const cropped = this.cropSprite(img);
                return this.tintSprite(cropped, teamColor.primary);
            }

            // Fallback to pixel art grids
            const isWalk = frame % 2 === 1;
            const baseGrid = isWalk ? WORM_WALK_R : WORM_STAND_R;
            const grid = facing < 0 ? flipGrid(baseGrid) : baseGrid;
            const palette = makeWormPalette(teamColor);
            return renderPixelArt(grid, palette, 2);
        });
    }

    createCrosshair() {
        const key = 'crosshair';
        return this.getSprite(key, () => {
            const size = 24;
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            const cx = size / 2;
            const cy = size / 2;

            ctx.fillStyle = '#ff0000';
            for (let i = 3; i <= 9; i++) {
                ctx.fillRect(cx - i, cy, 1, 1);
                ctx.fillRect(cx + i, cy, 1, 1);
                ctx.fillRect(cx - i, cy - 1, 1, 1);
                ctx.fillRect(cx + i, cy - 1, 1, 1);
            }
            for (let i = 3; i <= 9; i++) {
                ctx.fillRect(cx, cy - i, 1, 1);
                ctx.fillRect(cx, cy + i, 1, 1);
                ctx.fillRect(cx - 1, cy - i, 1, 1);
                ctx.fillRect(cx - 1, cy + i, 1, 1);
            }
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(cx - 1, cy - 1, 2, 2);

            return canvas;
        });
    }

    createProjectileSprite(type) {
        const key = `projectile_${type}`;
        return this.getSprite(key, () => {
            // Check for PixelLab sprites first (crop + scale to game proportions)
            if (type === 'dynamite' && this.images.dynamite) {
                return this.scaleImage(this.cropSprite(this.images.dynamite), 14, 22);
            }
            if (type === 'mine' && this.images.mine) {
                return this.scaleImage(this.cropSprite(this.images.mine), 18, 18);
            }

            // Pixel art fallbacks
            const spriteMap = {
                'missile':      { grid: MISSILE, palette: MISSILE_PALETTE, scale: 2 },
                'grenade':      { grid: GRENADE, palette: GRENADE_PALETTE, scale: 1 },
                'cluster':      { grid: CLUSTER_BOMB, palette: CLUSTER_BOMB_PALETTE, scale: 1 },
                'banana':       { grid: BANANA, palette: BANANA_PALETTE, scale: 1 },
                'holyGrenade':  { grid: HOLY_GRENADE, palette: HOLY_GRENADE_PALETTE, scale: 1 },
                'dynamite':     { grid: DYNAMITE, palette: DYNAMITE_PALETTE, scale: 1 },
                'mine':         { grid: MINE, palette: MINE_PALETTE, scale: 1 },
            };

            const info = spriteMap[type];
            if (info) {
                return renderPixelArt(info.grid, info.palette, info.scale);
            }

            const size = 20;
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = false;
            ctx.fillStyle = '#AAAAAA';
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, 4, 0, Math.PI * 2);
            ctx.fill();
            return canvas;
        });
    }

    createWeaponIcon(weaponName) {
        const key = `weapon_icon_${weaponName}`;
        return this.getSprite(key, () => {
            const size = 32;
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            const cx = size / 2;
            const cy = size / 2;

            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const icons = {
                'Bazooka': '\u{1F680}',
                'Grenade': '\u{1F4A3}',
                'Cluster Bomb': '\u{1F534}',
                'Banana Bomb': '\u{1F34C}',
                'Holy Hand Grenade': '\u2720',
                'Mortar': '\u{1F3AF}',
                'Shotgun': '\u{1F52B}',
                'Uzi': '\u{1F52B}',
                'Minigun': '\u{1F52B}',
                'Fire Punch': '\u{1F44A}',
                'Baseball Bat': '\u{1F3CF}',
                'Prod': '\u{1F449}',
                'Dynamite': '\u{1F9E8}',
                'Mine': '\u{1F4A5}',
                'Sheep': '\u{1F411}',
                'Air Strike': '\u2708',
                'Napalm Strike': '\u{1F525}',
                'Ninja Rope': '\u{1FAA2}',
                'Teleport': '\u26A1',
                'Girder': '\u{1F527}',
                'Blowtorch': '\u{1F525}',
                'Drill': '\u2B07',
                'Concrete Donkey': '\u{1FACF}',
                'Armageddon': '\u2604',
                'Earthquake': '\u{1F30A}',
                'Skip Turn': '\u23ED',
                'Parachute': '\u{1FA82}',
                'Select Worm': '\u{1F504}',
            };

            ctx.fillText(icons[weaponName] || '?', cx, cy);
            return canvas;
        });
    }

    createTombstone() {
        const key = 'tombstone';
        return this.getSprite(key, () => {
            if (this.images.tombstone) {
                return this.scaleImage(this.cropSprite(this.images.tombstone), 20, 26);
            }
            return renderPixelArt(TOMBSTONE, TOMBSTONE_PALETTE, 2);
        });
    }

    createCrateSprite(type) {
        const key = `crate_${type}`;
        return this.getSprite(key, () => {
            if (type === 'health' && this.images.health_crate) {
                return this.scaleImage(this.cropSprite(this.images.health_crate), 22, 22);
            }
            if (type !== 'health' && this.images.weapon_crate) {
                return this.scaleImage(this.cropSprite(this.images.weapon_crate), 22, 22);
            }
            if (type === 'health') {
                return renderPixelArt(HEALTH_CRATE, HEALTH_CRATE_PALETTE, 2);
            }
            return renderPixelArt(WEAPON_CRATE, WEAPON_CRATE_PALETTE, 2);
        });
    }

    createSheepSprite(direction) {
        const key = `sheep_${direction}`;
        return this.getSprite(key, () => {
            if (this.images.sheep) {
                const cropped = this.cropSprite(this.images.sheep);
                const scaled = this.scaleImage(cropped, 24, 18);
                return direction < 0 ? this.flipCanvas(scaled) : scaled;
            }
            const grid = direction < 0 ? flipGrid(SHEEP_R) : SHEEP_R;
            return renderPixelArt(grid, SHEEP_PALETTE, 2);
        });
    }

    createDonkeySprite() {
        const key = 'donkey';
        return this.getSprite(key, () => {
            if (this.images.concrete_donkey) {
                return this.scaleImage(this.cropSprite(this.images.concrete_donkey), 24, 32);
            }
            return renderPixelArt(DONKEY, DONKEY_PALETTE, 2);
        });
    }

    createNapalmSprite() {
        const key = 'napalm';
        return this.getSprite(key, () => {
            return renderPixelArt(NAPALM, NAPALM_PALETTE, 2);
        });
    }

    createClusterFragmentSprite() {
        const key = 'cluster_fragment';
        return this.getSprite(key, () => {
            return renderPixelArt(CLUSTER_FRAGMENT, CLUSTER_FRAGMENT_PALETTE, 2);
        });
    }
}
