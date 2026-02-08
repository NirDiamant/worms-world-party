export const Config = {
    // World dimensions
    WORLD_WIDTH: 2400,
    WORLD_HEIGHT: 1200,

    // Physics
    GRAVITY: 350,           // px/s^2
    TERMINAL_VELOCITY: 600, // px/s
    WIND_MIN: -80,
    WIND_MAX: 80,

    // Water
    WATER_LEVEL: 1100,
    WATER_WAVE_AMPLITUDE: 4,
    WATER_WAVE_SPEED: 2,
    WATER_RISE_PER_TURN: 5, // Sudden death

    // Worm
    WORM_WIDTH: 26,
    WORM_HEIGHT: 34,
    WORM_WALK_SPEED: 60,      // px/s
    WORM_JUMP_VX: 80,
    WORM_JUMP_VY: -200,
    WORM_BACKFLIP_VX: -30,
    WORM_BACKFLIP_VY: -300,
    WORM_MAX_CLIMB: 12,       // pixels of slope per step
    WORM_INITIAL_HEALTH: 100,
    FALL_DAMAGE_THRESHOLD: 40, // pixels of freefall
    FALL_DAMAGE_PER_PX: 0.5,
    FALL_DAMAGE_MAX: 50,

    // Turn
    TURN_TIME: 45,           // seconds
    RETREAT_TIME: 5,         // seconds
    HOT_SEAT_DELAY: 2,      // seconds between turns

    // Camera
    CAMERA_PAN_SPEED: 400,   // px/s
    CAMERA_ZOOM_MIN: 0.3,
    CAMERA_ZOOM_MAX: 2.0,
    CAMERA_ZOOM_SPEED: 0.1,
    CAMERA_FOLLOW_SPEED: 3,  // lerp factor
    CAMERA_SHAKE_DECAY: 5,

    // Rendering
    TARGET_FPS: 60,
    FIXED_DT: 1 / 60,
    MAX_FRAME_SKIP: 5,

    // Particles
    PARTICLE_POOL_SIZE: 800,

    // Terrain
    TERRAIN_BORDER_TOP: 50,

    // Teams
    TEAM_COLORS: [
        { name: 'Red', primary: '#e74c3c', secondary: '#c0392b', light: '#ff6b6b' },
        { name: 'Blue', primary: '#3498db', secondary: '#2980b9', light: '#74b9ff' },
        { name: 'Green', primary: '#2ecc71', secondary: '#27ae60', light: '#55efc4' },
        { name: 'Yellow', primary: '#f1c40f', secondary: '#f39c12', light: '#ffeaa7' },
    ],

    // Default worm names per team
    WORM_NAMES: [
        ['Boggy', 'Spadge', 'Clagnut', 'Boing'],
        ['Giblet', 'Wibble', 'Ploppy', 'Snoopy'],
        ['Noodle', 'Dimwit', 'Muggins', 'Bloggs'],
        ['Zapper', 'Fuzzy', 'Bonkers', 'Doodle'],
    ],

    // Sudden Death
    SUDDEN_DEATH_ROUNDS: 10,
    SUDDEN_DEATH_HEALTH: 1,
};
