// Turn sub-states
export const TurnPhase = {
    TURN_START: 'TURN_START',
    PLAYER_CONTROL: 'PLAYER_CONTROL',
    FIRING: 'FIRING',
    PROJECTILE_FLIGHT: 'PROJECTILE_FLIGHT',
    EXPLOSION_RESOLVE: 'EXPLOSION_RESOLVE',
    AFTERMATH: 'AFTERMATH',
    RETREAT_TIMER: 'RETREAT_TIMER',
    TURN_END: 'TURN_END',
};

// Top-level game states
export const GamePhase = {
    MENU: 'MENU',
    SETUP: 'SETUP',
    PLAYING: 'PLAYING',
    GAME_OVER: 'GAME_OVER',
};
