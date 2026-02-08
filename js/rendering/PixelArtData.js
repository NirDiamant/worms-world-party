// Pixel art sprite definitions as string grids
// Each character maps to a color in the sprite's palette
// '.' = transparent pixel

// ============================================================
// WORM SPRITES (13×17, rendered at 2x scale = 26×34)
// ============================================================

// Right-facing worm, standing
export const WORM_STAND_R = [
    '.............',
    '.....PPPP....',
    '.QQ.PPLPP....',
    '....sssss....',
    '...sSSSSSs...',
    '..SSSSWWWWS..',
    '..SSSWBBWWS..',
    '..SSSSWWWWS..',
    '..SSSSSSSSS..',
    '...SSMMMSS...',
    '.gSSSWWSSSS..',
    '.WSSSSSSSSSg.',
    '..DSSSSSSD...',
    '...SSSSSSS...',
    '....DSSSD....',
    '.....SSS.....',
    '.............',
];

// Right-facing worm, walking frame
export const WORM_WALK_R = [
    '.............',
    '......PPPP...',
    '..QQ.PPLPP...',
    '.....sssss...',
    '....sSSSSSs..',
    '...SSSSWWWWS.',
    '...SSSWBBWWS.',
    '...SSSSWWWWS.',
    '...SSSSSSSSS.',
    '....SSMMMSS..',
    '..WSSSWWSSSg.',
    '...SSSSSSSSS.',
    '...DSSSSSSD..',
    '....SSSSSSS..',
    '....DSSSD....',
    '.....SSS.....',
    '.............',
];

export function makeWormPalette(teamColor) {
    return {
        'S': '#E08860',   // skin base
        's': '#FFDCC8',   // skin highlight
        'D': '#A85838',   // skin shadow
        'W': '#FFFFFF',   // white (eye, teeth, glove)
        'B': '#111111',   // black (pupil)
        'g': '#C0B0A0',   // glove shadow
        'M': '#4A1515',   // mouth interior
        'P': teamColor.primary,
        'Q': teamColor.secondary,
        'L': teamColor.light || teamColor.primary,
    };
}

// ============================================================
// MISSILE (10×5, rendered at 2x scale = 20×10)
// ============================================================

export const MISSILE = [
    '..GGmmmmNN',
    '.MMMMMMMnN',
    'FFMwMMMMMN',
    '.MMMMMMMnN',
    '..GGmmmmNN',
];

export const MISSILE_PALETTE = {
    'M': '#AAAAAA',   // metal body
    'm': '#777777',   // metal dark
    'w': '#DDDDDD',   // metal highlight
    'N': '#CC2200',   // nose red
    'n': '#881100',   // nose dark
    'F': '#FFAA00',   // flame
    'G': '#666666',   // fin
};

// ============================================================
// GRENADE (10×10)
// ============================================================

export const GRENADE = [
    '..........',
    '....cc.r..',
    '....cc....',
    '...hGGG...',
    '..hGGGGG..',
    '..GGgGGG..',
    '..GGGGgG..',
    '..GGGGGd..',
    '...GGGd...',
    '..........',
];

export const GRENADE_PALETTE = {
    'G': '#2EAA55',   // green body
    'h': '#5DDD77',   // highlight
    'g': '#1A7733',   // grid lines
    'd': '#0D4422',   // shadow
    'c': '#555555',   // cap
    'r': '#999999',   // pin ring
};

// ============================================================
// CLUSTER BOMB (10×10)
// ============================================================

export const CLUSTER_BOMB = [
    '..........',
    '...RRRR...',
    '..RRhRRR..',
    '..RoRRoR..',
    '..RRRRRR..',
    '..RoRRoR..',
    '..RRhRRR..',
    '...RRRR...',
    '..........',
    '..........',
];

export const CLUSTER_BOMB_PALETTE = {
    'R': '#CC3322',   // red body
    'h': '#EE6655',   // highlight
    'o': '#AA4433',   // sub-bomb circles
};

// ============================================================
// CLUSTER FRAGMENT (6×6)
// ============================================================

export const CLUSTER_FRAGMENT = [
    '......',
    '..hh..',
    '.hFFh.',
    '.hFFh.',
    '..hh..',
    '......',
];

export const CLUSTER_FRAGMENT_PALETTE = {
    'F': '#FFAA44',   // hot orange center
    'h': '#FF6622',   // outer glow
};

// ============================================================
// MINE (11×11)
// ============================================================

export const MINE = [
    '.....s.....',
    '..s.DDD.s..',
    '...DDDDD...',
    '.s.DDDDD.s.',
    '..DDyDyDD..',
    'sDDDDrDDDDs',
    '..DDyDyDD..',
    '.s.DDDDD.s.',
    '...DDDDD...',
    '..s.DDD.s..',
    '.....s.....',
];

export const MINE_PALETTE = {
    'D': '#333333',   // dark body
    's': '#888888',   // spike tip
    'y': '#CC8800',   // warning stripe
    'r': '#FF3333',   // red LED
};

// ============================================================
// DYNAMITE (7×13)
// ============================================================

export const DYNAMITE = [
    '......F',
    '.....f.',
    '....f..',
    '...c...',
    '..RRR..',
    '..Rrr..',
    '..RRR..',
    '..www..',
    '..RRR..',
    '..Rrr..',
    '..RRR..',
    '..RRR..',
    '.......',
];

export const DYNAMITE_PALETTE = {
    'R': '#DD2222',   // red body
    'r': '#991111',   // dark red
    'w': '#DDDDCC',   // label
    'c': '#AAAAAA',   // cap/fuse base
    'f': '#AAAAAA',   // fuse wire
    'F': '#FFCC00',   // spark
};

// ============================================================
// SHEEP (12×9, right-facing = head on right)
// ============================================================

export const SHEEP_R = [
    '............',
    '....WWWW.HH.',
    '...WWWWWHEHH',
    '...WWWWWW.H.',
    '..WWWWWWWW..',
    '..WWWWWWWW..',
    '..l.l..l.l..',
    '..l.l..l.l..',
    '............',
];

export const SHEEP_PALETTE = {
    'W': '#F0EDE8',   // wool white
    'H': '#2A2A2A',   // head dark
    'E': '#FFFFFF',   // eye white
    'l': '#2A2A2A',   // legs
};

// ============================================================
// CONCRETE DONKEY (12×16)
// ============================================================

export const DONKEY = [
    '............',
    '...ee..ee...',
    '...eeeeee...',
    '...GGGGGG...',
    '...GGRrGG...',
    '...GGggGG...',
    '....GGGG....',
    '...GGGGGG...',
    '..GGGGGGGG..',
    '..GGdGGdGG..',
    '..GGGGGGGG..',
    '..GGdGGdGG..',
    '..GGGGGGGG..',
    '..GGGGGGGG..',
    '...GG..GG...',
    '............',
];

export const DONKEY_PALETTE = {
    'G': '#999999',   // concrete gray
    'e': '#777777',   // ear darker gray
    'd': '#666666',   // speckle
    'R': '#FF2200',   // angry eye red
    'r': '#CC0000',   // dark eye
    'g': '#555555',   // nostril
};

// ============================================================
// TOMBSTONE (10×13, rendered at 2x scale = 20×26)
// ============================================================

export const TOMBSTONE = [
    '..........',
    '...sGGs...',
    '..sGGGGs..',
    '..GGGGGG..',
    '..GGGGGG..',
    '..GdddGG..',
    '..GdGdGG..',
    '..GdddGG..',
    '..GGGGGG..',
    '..GGGGGG..',
    '..gGGGGg..',
    '..ggGGgg..',
    '..........',
];

export const TOMBSTONE_PALETTE = {
    'G': '#AAAAAA',   // stone gray
    's': '#CCCCCC',   // stone highlight
    'g': '#777777',   // stone shadow
    'd': '#555555',   // RIP text
};

// ============================================================
// WEAPON CRATE (11×11, rendered at 2x scale = 22×22)
// ============================================================

export const WEAPON_CRATE = [
    '...........',
    '.KKKKKKKKK.',
    '.KBBBBBBbK.',
    '.KBBBBBBbK.',
    '.KBbBBBbBK.',
    '.KBBwBwBBK.',
    '.KBBBwBBBK.',
    '.KBBwBwBBK.',
    '.KBbBBBbBK.',
    '.KBBBBBBbK.',
    '.KKKKKKKKK.',
];

export const WEAPON_CRATE_PALETTE = {
    'K': '#3A2810',   // dark outline
    'B': '#8A6838',   // brown wood
    'b': '#6B4820',   // dark brown plank
    'w': '#FFD700',   // gold "W" letter
};

// ============================================================
// HEALTH CRATE (11×11, rendered at 2x scale = 22×22)
// ============================================================

export const HEALTH_CRATE = [
    '...........',
    '.KKKKKKKKK.',
    '.KRRRRRRrK.',
    '.KRRRWRRrK.',
    '.KRRRWRRrK.',
    '.KRWWWWWrK.',
    '.KRRRWRRrK.',
    '.KRRRWRRrK.',
    '.KRrRRRrRK.',
    '.KRRRRRRrK.',
    '.KKKKKKKKK.',
];

export const HEALTH_CRATE_PALETTE = {
    'K': '#3A1010',   // dark outline
    'R': '#DD2222',   // red body
    'r': '#AA1111',   // dark red
    'W': '#FFFFFF',   // white cross
};

// ============================================================
// BANANA BOMB (8×10)
// ============================================================

export const BANANA = [
    '........',
    '....yy..',
    '...yy...',
    '..YY....',
    '.YYY....',
    '.YYYY...',
    '..YYY...',
    '...YY...',
    '....y...',
    '........',
];

export const BANANA_PALETTE = {
    'Y': '#FFE135',   // yellow body
    'y': '#C8A000',   // dark yellow
};

// ============================================================
// HOLY HAND GRENADE (10×10)
// ============================================================

export const HOLY_GRENADE = [
    '..........',
    '....cC....',
    '...cccC...',
    '...hGGG...',
    '..hGGGGG..',
    '..GGxGGG..',
    '..GxxxxG..',
    '..GGxGGG..',
    '...GGGG...',
    '..........',
];

export const HOLY_GRENADE_PALETTE = {
    'G': '#E8C840',   // gold body
    'h': '#FFFCE0',   // gold highlight
    'x': '#8B0000',   // cross dark red
    'c': '#FFD700',   // top decoration
    'C': '#CC9900',   // top shadow
};

// ============================================================
// NAPALM DROP (8×8)
// ============================================================

export const NAPALM = [
    '........',
    '...FF...',
    '..FFFF..',
    '.fFFFFf.',
    '.fFFFFf.',
    '..ffff..',
    '...ff...',
    '........',
];

export const NAPALM_PALETTE = {
    'F': '#FF6600',   // fire orange
    'f': '#CC3300',   // fire dark
};

// ============================================================
// CROSSHAIR (kept as procedural - too geometric for pixel grids)
// ============================================================

// ============================================================
// Utility: flip a grid horizontally (for left-facing sprites)
// ============================================================
export function flipGrid(grid) {
    return grid.map(row => row.split('').reverse().join(''));
}

// Utility: render a pixel art grid to a canvas
export function renderPixelArt(grid, palette, scale = 1) {
    const rows = grid.length;
    const cols = grid[0].length;
    const canvas = document.createElement('canvas');
    canvas.width = cols * scale;
    canvas.height = rows * scale;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    for (let r = 0; r < rows; r++) {
        const row = grid[r];
        for (let c = 0; c < cols; c++) {
            const ch = row[c];
            if (ch === '.') continue;
            const color = palette[ch];
            if (!color) continue;
            ctx.fillStyle = color;
            ctx.fillRect(c * scale, r * scale, scale, scale);
        }
    }

    return canvas;
}
