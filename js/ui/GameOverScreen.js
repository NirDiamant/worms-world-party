import { GamePhase } from '../core/GameState.js';

export class GameOverScreen {
    constructor(game) {
        this.game = game;
        this.element = document.getElementById('gameover-screen');
        this.confettiInterval = null;
    }

    show(winnerTeam) {
        this.element.classList.remove('hidden');
        this.element.style.background = 'linear-gradient(180deg, #1a3a5c 0%, #2d1b4e 50%, #1a0a2e 100%)';

        const winnerText = winnerTeam ? `${winnerTeam.name} Wins!` : 'Draw!';
        const winnerColor = winnerTeam ? winnerTeam.color.light : '#fff';

        // Calculate stats
        let stats = '';
        for (const team of this.game.teams) {
            const alive = team.worms.filter(w => w.alive).length;
            const total = team.worms.length;
            const totalHP = team.worms.reduce((sum, w) => sum + (w.alive ? w.health : 0), 0);
            const totalDamage = team.worms.reduce((sum, w) => sum + (w.damageDealt || 0), 0);
            const kills = team.worms.reduce((sum, w) => sum + (w.kills || 0), 0);
            stats += `<div style="color: ${team.color.light}; margin-bottom: 4px;">
                ${team.name}: ${alive}/${total} surviving (${totalHP} HP)
                ${kills > 0 ? ` | ${kills} kill${kills > 1 ? 's' : ''}` : ''}
                ${totalDamage > 0 ? ` | ${totalDamage} dmg` : ''}
            </div>`;
        }

        this.element.innerHTML = `
            <canvas id="confetti-canvas" style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;"></canvas>
            <div class="gameover-title" style="color: ${winnerColor}; animation: bounceIn 0.6s ease-out;">${winnerText}</div>
            <div class="gameover-stats">${stats}</div>
            <div class="gameover-stats">Round: ${this.game.roundNumber}</div>
            <button class="menu-btn" id="btn-play-again">Play Again</button>
            <button class="menu-btn" id="btn-main-menu" style="background: linear-gradient(180deg, #666 0%, #444 100%); border-color: #888;">Main Menu</button>
        `;

        // Confetti animation for winner
        if (winnerTeam) {
            this.startConfetti(winnerTeam.color);
        }

        // Victory sound
        this.game.audio.play('collect');

        document.getElementById('btn-play-again').addEventListener('click', () => {
            this.game.audio.play('click');
            this.game.phase.setState(GamePhase.PLAYING);
        });

        document.getElementById('btn-main-menu').addEventListener('click', () => {
            this.game.audio.play('click');
            this.game.returnToMenu();
        });
    }

    startConfetti(teamColor) {
        const canvas = document.getElementById('confetti-canvas');
        if (!canvas) return;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        const ctx = canvas.getContext('2d');

        const confetti = [];
        const colors = [teamColor.primary, teamColor.light, '#FFD700', '#fff', teamColor.secondary];
        for (let i = 0; i < 80; i++) {
            confetti.push({
                x: Math.random() * canvas.width,
                y: Math.random() * -canvas.height,
                w: Math.random() * 8 + 4,
                h: Math.random() * 4 + 2,
                vx: (Math.random() - 0.5) * 3,
                vy: Math.random() * 3 + 2,
                rot: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.2,
                color: colors[Math.floor(Math.random() * colors.length)],
            });
        }

        this.confettiInterval = setInterval(() => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (const c of confetti) {
                c.x += c.vx;
                c.y += c.vy;
                c.rot += c.rotSpeed;
                c.vy += 0.05; // Gravity
                c.vx *= 0.99;

                if (c.y > canvas.height + 20) {
                    c.y = -10;
                    c.x = Math.random() * canvas.width;
                    c.vy = Math.random() * 3 + 2;
                }

                ctx.save();
                ctx.translate(c.x, c.y);
                ctx.rotate(c.rot);
                ctx.fillStyle = c.color;
                ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
                ctx.restore();
            }
        }, 1000 / 30);
    }

    hide() {
        if (this.confettiInterval) {
            clearInterval(this.confettiInterval);
            this.confettiInterval = null;
        }
        this.element.classList.add('hidden');
        this.element.innerHTML = '';
    }
}
