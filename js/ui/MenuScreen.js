import { GamePhase } from '../core/GameState.js';

export class MenuScreen {
    constructor(game) {
        this.game = game;
        this.element = document.getElementById('menu-screen');
    }

    show() {
        this.element.classList.remove('hidden');
        this.element.innerHTML = `
            <div class="menu-title">WORMS</div>
            <div class="menu-subtitle">World Party</div>
            <button class="menu-btn" id="btn-quick-play">Quick Play</button>
            <button class="menu-btn" id="btn-new-game">New Game</button>
        `;

        // Create animated background
        this.element.style.background = 'linear-gradient(180deg, #1a3a5c 0%, #2d1b4e 50%, #1a0a2e 100%)';

        document.getElementById('btn-quick-play').addEventListener('click', () => {
            this.game.audio.play('click');
            this.game.quickPlay();
        });

        document.getElementById('btn-new-game').addEventListener('click', () => {
            this.game.audio.play('click');
            this.game.phase.setState(GamePhase.SETUP);
        });
    }

    hide() {
        this.element.classList.add('hidden');
        this.element.innerHTML = '';
    }
}
