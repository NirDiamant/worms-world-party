import { Game } from './core/Game.js';

// Boot the game
const game = new Game();

// Initialize on DOM ready (async for sprite loading)
async function start() {
    await game.init();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => start());
} else {
    start();
}

// Initialize audio on first user interaction
const initAudio = () => {
    game.audio.ensureInit();
    document.removeEventListener('click', initAudio);
    document.removeEventListener('keydown', initAudio);
};
document.addEventListener('click', initAudio);
document.addEventListener('keydown', initAudio);

// Expose game for debugging
window.game = game;
