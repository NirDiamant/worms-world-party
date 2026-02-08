import { Config } from '../core/Config.js';
import { GamePhase } from '../core/GameState.js';

export class SetupScreen {
    constructor(game) {
        this.game = game;
        this.element = document.getElementById('setup-screen');
    }

    show() {
        this.element.classList.remove('hidden');
        this.element.style.background = 'linear-gradient(180deg, #1a3a5c 0%, #2d1b4e 50%, #1a0a2e 100%)';

        this.element.innerHTML = `
            <div class="setup-container">
                <div class="setup-title">Game Setup</div>

                <div class="setup-row">
                    <span class="setup-label">Teams:</span>
                    <select class="setup-select" id="setup-num-teams">
                        <option value="2" selected>2 Teams</option>
                        <option value="3">3 Teams</option>
                        <option value="4">4 Teams</option>
                    </select>
                </div>

                <div class="setup-row">
                    <span class="setup-label">Worms per Team:</span>
                    <select class="setup-select" id="setup-worms-per-team">
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4" selected>4</option>
                        <option value="6">6</option>
                        <option value="8">8</option>
                    </select>
                </div>

                <div class="setup-row">
                    <span class="setup-label">Terrain:</span>
                    <select class="setup-select" id="setup-terrain">
                        <option value="Grassland" selected>Grassland</option>
                        <option value="Desert">Desert</option>
                        <option value="Arctic">Arctic</option>
                        <option value="Hell">Hell</option>
                    </select>
                </div>

                <div class="setup-row">
                    <span class="setup-label">Turn Time:</span>
                    <select class="setup-select" id="setup-turn-time">
                        <option value="15">15 seconds</option>
                        <option value="30">30 seconds</option>
                        <option value="45" selected>45 seconds</option>
                        <option value="60">60 seconds</option>
                        <option value="90">90 seconds</option>
                    </select>
                </div>

                <div class="setup-row">
                    <span class="setup-label">Scheme:</span>
                    <select class="setup-select" id="setup-scheme">
                        <option value="normal" selected>Normal</option>
                        <option value="pro">Pro</option>
                        <option value="artillery">Artillery</option>
                        <option value="full">Full Wormage</option>
                    </select>
                </div>

                <div id="team-configs"></div>

                <div style="display: flex; gap: 12px; justify-content: center; margin-top: 20px;">
                    <button class="menu-btn" id="btn-start-game">Start Game</button>
                    <button class="menu-btn" id="btn-back" style="background: linear-gradient(180deg, #666 0%, #444 100%); border-color: #888;">Back</button>
                </div>
            </div>
        `;

        this.updateTeamConfigs();

        document.getElementById('setup-num-teams').addEventListener('change', () => {
            this.updateTeamConfigs();
        });

        document.getElementById('setup-worms-per-team').addEventListener('change', () => {
            this.updateTeamConfigs();
        });

        document.getElementById('btn-start-game').addEventListener('click', () => {
            this.game.audio.play('click');
            this.startGame();
        });

        document.getElementById('btn-back').addEventListener('click', () => {
            this.game.audio.play('click');
            this.game.phase.setState(GamePhase.MENU);
        });
    }

    updateTeamConfigs() {
        const numTeams = parseInt(document.getElementById('setup-num-teams').value);
        const container = document.getElementById('team-configs');

        let html = '';
        for (let i = 0; i < numTeams; i++) {
            const color = Config.TEAM_COLORS[i];
            const defaultName = Config.TEAM_COLORS[i].name + ' Team';
            const wormsPerTeam = parseInt(document.getElementById('setup-worms-per-team').value);
            const defaultNames = Config.WORM_NAMES[i] || [];
            let wormNameInputs = '';
            for (let w = 0; w < wormsPerTeam; w++) {
                const wName = defaultNames[w % defaultNames.length] || `Worm ${w + 1}`;
                wormNameInputs += `<input class="setup-input worm-name" type="text" value="${wName}" data-team="${i}" data-worm="${w}" style="width: 90px; margin: 2px;">`;
            }

            html += `
                <div class="team-config" style="border-color: ${color.primary};">
                    <div class="team-config-header" style="color: ${color.light};">
                        Team ${i + 1}
                    </div>
                    <div class="setup-row">
                        <span class="setup-label">Name:</span>
                        <input class="setup-input team-name" type="text" value="${defaultName}" data-team="${i}">
                    </div>
                    <div class="setup-row">
                        <span class="setup-label">Controller:</span>
                        <select class="setup-select team-controller" data-team="${i}">
                            <option value="human" ${i === 0 ? 'selected' : ''}>Human</option>
                            <option value="ai" ${i > 0 ? 'selected' : ''}>AI</option>
                        </select>
                    </div>
                    <div class="setup-row team-ai-row" data-team="${i}" ${i === 0 ? 'style="display:none"' : ''}>
                        <span class="setup-label">AI Difficulty:</span>
                        <select class="setup-select team-difficulty" data-team="${i}">
                            <option value="0">Easy</option>
                            <option value="1" selected>Medium</option>
                            <option value="2">Hard</option>
                        </select>
                    </div>
                    <div class="setup-row" style="flex-wrap: wrap;">
                        <span class="setup-label">Worms:</span>
                        ${wormNameInputs}
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;

        // Add controller change listeners
        document.querySelectorAll('.team-controller').forEach(select => {
            select.addEventListener('change', (e) => {
                const teamIdx = e.target.dataset.team;
                const aiRow = document.querySelector(`.team-ai-row[data-team="${teamIdx}"]`);
                aiRow.style.display = e.target.value === 'ai' ? 'flex' : 'none';
            });
        });
    }

    startGame() {
        const numTeams = parseInt(document.getElementById('setup-num-teams').value);
        const wormsPerTeam = parseInt(document.getElementById('setup-worms-per-team').value);
        const terrainTheme = document.getElementById('setup-terrain').value;
        const turnTime = parseInt(document.getElementById('setup-turn-time').value);

        const teamNames = [];
        const teamAI = [];
        const aiDifficulty = [];
        const wormNames = [];

        for (let i = 0; i < numTeams; i++) {
            const nameEl = document.querySelector(`.team-name[data-team="${i}"]`);
            const controllerEl = document.querySelector(`.team-controller[data-team="${i}"]`);
            const difficultyEl = document.querySelector(`.team-difficulty[data-team="${i}"]`);

            teamNames.push(nameEl ? nameEl.value : `Team ${i + 1}`);
            teamAI.push(controllerEl ? controllerEl.value === 'ai' : i > 0);
            aiDifficulty.push(difficultyEl ? parseInt(difficultyEl.value) : 1);

            const names = [];
            for (let w = 0; w < wormsPerTeam; w++) {
                const wormEl = document.querySelector(`.worm-name[data-team="${i}"][data-worm="${w}"]`);
                names.push(wormEl ? wormEl.value : `Worm ${w + 1}`);
            }
            wormNames.push(names);
        }

        this.game.startWithSettings({
            numTeams,
            wormsPerTeam,
            teamNames,
            teamAI,
            aiDifficulty,
            terrainTheme,
            turnTime,
            wormNames,
        });
    }

    hide() {
        this.element.classList.add('hidden');
        this.element.innerHTML = '';
    }
}
