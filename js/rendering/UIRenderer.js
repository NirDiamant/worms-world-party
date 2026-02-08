import { Config } from '../core/Config.js';
import { TurnPhase } from '../core/GameState.js';
import { Worm } from '../entities/Worm.js';

export class UIRenderer {
    constructor(game) {
        this.game = game;
    }

    render(ctx) {
        this.renderWindIndicator(ctx);
        this.renderTurnTimer(ctx);
        this.renderTeamHealthBars(ctx);
        this.renderWormLabels(ctx);
        this.renderActiveWormIndicator(ctx);
        this.renderWeaponInfo(ctx);
        this.renderPowerBar(ctx);
        this.renderMinimap(ctx);

        if (this.game.suddenDeath) {
            this.renderSuddenDeathWarning(ctx);
        }

        if (this.game.weaponPanelOpen) {
            this.renderWeaponPanel(ctx);
        }
    }

    renderWindIndicator(ctx) {
        const w = ctx.canvas.width;
        const wind = this.game.wind;
        const maxWind = Config.WIND_MAX;

        ctx.save();
        const halfBar = 50;
        const barHeight = 10;
        const centerX = w / 2;
        const y = 6;
        const gap = 3;
        const panelW = halfBar * 2 + gap * 2 + 20;
        const panelH = 36;
        const panelX = centerX - panelW / 2;

        // Background panel
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        this.roundRect(ctx, panelX, y, panelW, panelH, 5);
        ctx.fill();

        // Label
        ctx.fillStyle = '#ccc';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.strokeText('WIND', centerX, y + 10);
        ctx.fillText('WIND', centerX, y + 10);

        const barY = y + 15;
        const absRatio = Math.abs(wind / maxWind);

        // Color: green mild, yellow medium, red strong
        let fillColor;
        if (absRatio < 0.33) fillColor = '#44CC44';
        else if (absRatio < 0.66) fillColor = '#CCCC22';
        else fillColor = '#DD3333';

        // Left bar background
        ctx.fillStyle = 'rgba(20,20,20,0.8)';
        this.roundRect(ctx, centerX - gap - halfBar, barY, halfBar, barHeight, 3);
        ctx.fill();
        // Right bar background
        this.roundRect(ctx, centerX + gap, barY, halfBar, barHeight, 3);
        ctx.fill();

        // Fill the appropriate side
        if (wind < 0) {
            const fillW = absRatio * halfBar;
            ctx.fillStyle = fillColor;
            ctx.save();
            this.roundRect(ctx, centerX - gap - halfBar, barY, halfBar, barHeight, 3);
            ctx.clip();
            ctx.fillRect(centerX - gap - fillW, barY, fillW, barHeight);
            ctx.restore();
        } else if (wind > 0) {
            const fillW = absRatio * halfBar;
            ctx.fillStyle = fillColor;
            ctx.save();
            this.roundRect(ctx, centerX + gap, barY, halfBar, barHeight, 3);
            ctx.clip();
            ctx.fillRect(centerX + gap, barY, fillW, barHeight);
            ctx.restore();
        }

        // Bar outlines
        ctx.strokeStyle = 'rgba(80,80,80,0.5)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, centerX - gap - halfBar, barY, halfBar, barHeight, 3);
        ctx.stroke();
        this.roundRect(ctx, centerX + gap, barY, halfBar, barHeight, 3);
        ctx.stroke();

        ctx.restore();
    }

    renderTurnTimer(ctx) {
        if (!this.game.turnPhase.is(TurnPhase.PLAYER_CONTROL) &&
            !this.game.turnPhase.is(TurnPhase.RETREAT_TIMER)) return;

        ctx.save();
        const timer = this.game.turnPhase.is(TurnPhase.RETREAT_TIMER)
            ? this.game.retreatTimer
            : this.game.turnTimer;

        const timeStr = Math.ceil(Math.max(0, timer)).toString();
        const isLow = timer <= 5;

        let scale = 1;
        if (isLow) {
            scale = 1 + Math.sin(timer * Math.PI) * 0.15;
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 10 + (5 - timer) * 3;
        }

        const fontSize = Math.round(30 * scale);
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillStyle = isLow ? '#FF3333' : '#FFFFFF';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.strokeText(timeStr, ctx.canvas.width / 2, 58);
        ctx.fillText(timeStr, ctx.canvas.width / 2, 58);

        if (isLow) {
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
        }

        if (this.game.turnPhase.is(TurnPhase.RETREAT_TIMER)) {
            ctx.font = 'bold 12px Arial';
            ctx.fillStyle = '#FFE040';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.strokeText('RETREAT!', ctx.canvas.width / 2, 74);
            ctx.fillText('RETREAT!', ctx.canvas.width / 2, 74);
        }
        ctx.restore();
    }

    renderTeamHealthBars(ctx) {
        ctx.save();
        const barWidth = 170;
        const barHeight = 20;
        const x = 10;
        const radius = 4;

        this.game.teams.forEach((team, i) => {
            const y = 10 + i * (barHeight + 8);
            const totalHealth = team.worms.reduce((s, w) => s + (w.alive ? w.health : 0), 0);
            const maxHealth = team.worms.length * Config.WORM_INITIAL_HEALTH;
            const ratio = totalHealth / maxHealth;
            const isActive = team === this.game.activeWorm?.team;

            // Background with rounded corners
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.roundRect(ctx, x - 2, y - 2, barWidth + 4, barHeight + 4, radius + 1);
            ctx.fill();

            // Inner background
            ctx.fillStyle = 'rgba(30,30,30,0.9)';
            this.roundRect(ctx, x, y, barWidth, barHeight, radius);
            ctx.fill();

            // Health bar fill with gradient
            if (ratio > 0) {
                const fillWidth = barWidth * ratio;
                const barGrad = ctx.createLinearGradient(x, y, x, y + barHeight);
                barGrad.addColorStop(0, team.color.light || team.color.primary);
                barGrad.addColorStop(0.5, team.color.primary);
                barGrad.addColorStop(1, team.color.secondary);
                ctx.fillStyle = barGrad;
                ctx.save();
                ctx.beginPath();
                this.roundRect(ctx, x, y, fillWidth, barHeight, radius);
                ctx.clip();
                ctx.fillRect(x, y, fillWidth, barHeight);
                ctx.restore();

                // Glossy highlight on top half
                ctx.fillStyle = 'rgba(255,255,255,0.15)';
                ctx.fillRect(x, y, fillWidth, barHeight / 2);
            }

            // Border
            ctx.strokeStyle = isActive ? '#FFFFFF' : 'rgba(100,100,100,0.6)';
            ctx.lineWidth = isActive ? 2 : 1;
            this.roundRect(ctx, x, y, barWidth, barHeight, radius);
            ctx.stroke();

            // Active glow
            if (isActive) {
                ctx.shadowColor = team.color.primary;
                ctx.shadowBlur = 8;
                this.roundRect(ctx, x, y, barWidth, barHeight, radius);
                ctx.stroke();
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
            }

            // Team name + HP
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'left';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeText(`${team.name} (${totalHealth})`, x + 6, y + 14);
            ctx.fillText(`${team.name} (${totalHealth})`, x + 6, y + 14);
        });
        ctx.restore();
    }

    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    renderWormLabels(ctx) {
        ctx.save();
        const camera = this.game.camera;

        for (const entity of this.game.entities) {
            if (!entity.alive || !entity.team) continue;

            const screen = camera.worldToScreen(entity.x, entity.y - entity.height / 2 - 4);

            // Classic Worms style: simple floating text with black stroke, no box
            const name = entity.name;
            const hp = entity.health;
            const nameY = screen.y - 18;
            const hpY = nameY + 12;

            // Worm name: team-colored text with black stroke
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2.5;
            ctx.strokeText(name, screen.x, nameY);
            ctx.fillStyle = entity.team.color.primary;
            ctx.fillText(name, screen.x, nameY);

            // Health number: colored by health ratio
            const hpRatio = entity.health / Config.WORM_INITIAL_HEALTH;
            let hpColor;
            if (hpRatio > 0.6) hpColor = '#44ff44';
            else if (hpRatio > 0.3) hpColor = '#ffcc00';
            else hpColor = '#ff4444';

            ctx.font = 'bold 10px Arial';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2.5;
            ctx.strokeText(hp, screen.x, hpY);
            ctx.fillStyle = hpColor;
            ctx.fillText(hp, screen.x, hpY);
        }
        ctx.restore();
    }

    renderActiveWormIndicator(ctx) {
        if (!this.game.activeWorm || !this.game.activeWorm.alive) return;

        ctx.save();
        const worm = this.game.activeWorm;
        const screen = this.game.camera.worldToScreen(worm.x, worm.y - worm.height / 2 - 22);

        // Bouncing arrow (like original game's white down-arrow)
        const bounce = Math.sin(performance.now() * 0.005) * 4;
        const arrowY = screen.y + bounce;

        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;

        // Down-pointing arrow
        ctx.beginPath();
        ctx.moveTo(screen.x, arrowY + 8);
        ctx.lineTo(screen.x - 6, arrowY);
        ctx.lineTo(screen.x - 2, arrowY);
        ctx.lineTo(screen.x - 2, arrowY - 6);
        ctx.lineTo(screen.x + 2, arrowY - 6);
        ctx.lineTo(screen.x + 2, arrowY);
        ctx.lineTo(screen.x + 6, arrowY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    renderWeaponInfo(ctx) {
        if (!this.game.activeWorm) return;

        ctx.save();
        const weapon = this.game.weapons.getCurrentWeapon();
        if (!weapon) { ctx.restore(); return; }

        const w = ctx.canvas.width;
        const h = ctx.canvas.height;

        // Weapon panel at bottom right
        const panelW = 150;
        const panelH = 42;
        const panelX = w - panelW - 8;
        const panelY = h - panelH - 8;
        const radius = 6;

        // Background with rounded corners
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        this.roundRect(ctx, panelX, panelY, panelW, panelH, radius);
        ctx.fill();

        // Subtle gradient overlay
        const panelGrad = ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelH);
        panelGrad.addColorStop(0, 'rgba(255,255,255,0.08)');
        panelGrad.addColorStop(0.5, 'rgba(255,255,255,0)');
        panelGrad.addColorStop(1, 'rgba(0,0,0,0.1)');
        ctx.fillStyle = panelGrad;
        this.roundRect(ctx, panelX, panelY, panelW, panelH, radius);
        ctx.fill();

        // Border
        ctx.strokeStyle = 'rgba(120,120,120,0.5)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, panelX, panelY, panelW, panelH, radius);
        ctx.stroke();

        // Weapon name
        ctx.font = 'bold 13px Arial';
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeText(weapon.name, w - 16, h - 28);
        ctx.fillText(weapon.name, w - 16, h - 28);

        // Ammo
        const ammo = this.game.weapons.getAmmo(weapon.name);
        const ammoStr = ammo === Infinity ? '\u221E' : `x${ammo}`;
        ctx.font = 'bold 11px Arial';
        ctx.fillStyle = ammo === 0 ? '#FF4444' : '#FFDD00';
        ctx.strokeText(ammoStr, w - 16, h - 14);
        ctx.fillText(ammoStr, w - 16, h - 14);

        ctx.restore();
    }

    renderPowerBar(ctx) {
        if (!this.game.power.charging) return;

        ctx.save();
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;
        const barWidth = 220;
        const barHeight = 16;
        const x = w / 2 - barWidth / 2;
        const y = h - 42;
        const power = this.game.power.power;
        const radius = 4;

        // Background panel
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        this.roundRect(ctx, x - 6, y - 20, barWidth + 12, barHeight + 26, 6);
        ctx.fill();

        // Label
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeText(`POWER: ${Math.round(power)}%`, w / 2, y - 5);
        ctx.fillText(`POWER: ${Math.round(power)}%`, w / 2, y - 5);

        // Bar track
        ctx.fillStyle = '#1a1a1a';
        this.roundRect(ctx, x, y, barWidth, barHeight, radius);
        ctx.fill();

        // Power fill with gradient
        if (power > 0) {
            const fillW = barWidth * (power / 100);
            const gradient = ctx.createLinearGradient(x, y, x + barWidth, y);
            gradient.addColorStop(0, '#22DD22');
            gradient.addColorStop(0.5, '#EECC00');
            gradient.addColorStop(1, '#EE2222');
            ctx.fillStyle = gradient;
            ctx.save();
            this.roundRect(ctx, x, y, fillW, barHeight, radius);
            ctx.clip();
            ctx.fillRect(x, y, fillW, barHeight);
            ctx.restore();

            // Glossy highlight
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillRect(x, y, fillW, barHeight / 2);
        }

        // Border
        ctx.strokeStyle = 'rgba(120,120,120,0.5)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, x, y, barWidth, barHeight, radius);
        ctx.stroke();

        ctx.restore();
    }

    renderSuddenDeathWarning(ctx) {
        ctx.save();
        const alpha = 0.5 + 0.5 * Math.sin(performance.now() * 0.003);
        ctx.globalAlpha = alpha;
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FF0000';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText('SUDDEN DEATH!', ctx.canvas.width / 2, 100);
        ctx.fillText('SUDDEN DEATH!', ctx.canvas.width / 2, 100);
        ctx.restore();
    }

    renderWeaponPanel(ctx) {
        const weapons = this.game.weapons.getWeaponList();
        const cols = 7;
        const cellSize = 50;
        const padding = 4;
        const rows = Math.ceil(weapons.length / cols);

        const panelW = cols * (cellSize + padding) + padding;
        const panelH = rows * (cellSize + padding) + padding + 24;
        const panelX = (ctx.canvas.width - panelW) / 2;
        const panelY = (ctx.canvas.height - panelH) / 2;
        const radius = 8;

        ctx.save();

        // Panel background with rounded corners
        ctx.fillStyle = 'rgba(10, 10, 15, 0.94)';
        this.roundRect(ctx, panelX, panelY, panelW, panelH, radius);
        ctx.fill();

        // Subtle top highlight
        const topGrad = ctx.createLinearGradient(panelX, panelY, panelX, panelY + 30);
        topGrad.addColorStop(0, 'rgba(255,255,255,0.06)');
        topGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = topGrad;
        this.roundRect(ctx, panelX, panelY, panelW, panelH, radius);
        ctx.fill();

        // Border
        ctx.strokeStyle = 'rgba(100,100,120,0.5)';
        ctx.lineWidth = 1.5;
        this.roundRect(ctx, panelX, panelY, panelW, panelH, radius);
        ctx.stroke();

        // Title
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#aaa';
        ctx.fillText('SELECT WEAPON', ctx.canvas.width / 2, panelY + 14);

        const currentWeapon = this.game.weapons.getCurrentWeapon();
        const gridOffY = 20;

        weapons.forEach((weapon, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = panelX + padding + col * (cellSize + padding);
            const y = panelY + padding + gridOffY + row * (cellSize + padding);
            const isSelected = currentWeapon && weapon.name === currentWeapon.name;
            const cellR = 4;

            // Cell background
            if (isSelected) {
                const selGrad = ctx.createLinearGradient(x, y, x, y + cellSize);
                selGrad.addColorStop(0, '#554400');
                selGrad.addColorStop(1, '#332200');
                ctx.fillStyle = selGrad;
            } else {
                ctx.fillStyle = '#1a1a1e';
            }
            this.roundRect(ctx, x, y, cellSize, cellSize, cellR);
            ctx.fill();

            // Cell border
            if (isSelected) {
                ctx.shadowColor = '#FFCC00';
                ctx.shadowBlur = 6;
            }
            ctx.strokeStyle = isSelected ? '#FFCC00' : '#333';
            ctx.lineWidth = isSelected ? 2 : 1;
            this.roundRect(ctx, x, y, cellSize, cellSize, cellR);
            ctx.stroke();
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;

            const icon = this.game.sprites.createWeaponIcon(weapon.name);
            ctx.drawImage(icon, x + (cellSize - 32) / 2, y + 2);

            ctx.font = '7px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = isSelected ? '#FFE080' : '#777';
            const shortName = weapon.name.length > 8 ? weapon.name.substring(0, 7) + '.' : weapon.name;
            ctx.fillText(shortName, x + cellSize / 2, y + cellSize - 8);

            const ammo = this.game.weapons.getAmmo(weapon.name);
            if (ammo !== Infinity) {
                ctx.font = 'bold 9px Arial';
                ctx.textAlign = 'right';
                ctx.fillStyle = ammo > 0 ? '#FFE000' : '#FF3333';
                ctx.fillText(ammo.toString(), x + cellSize - 3, y + cellSize - 2);
            }
        });

        ctx.restore();
    }

    renderMinimap(ctx) {
        const sw = ctx.canvas.width;
        const sh = ctx.canvas.height;
        const mapW = 180;
        const mapH = 100;
        const mapX = sw - mapW - 10;
        const mapY = 10;
        const scaleX = mapW / Config.WORLD_WIDTH;
        const scaleY = mapH / Config.WORLD_HEIGHT;

        ctx.save();

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.roundRect(ctx, mapX - 2, mapY - 2, mapW + 4, mapH + 4, 4);
        ctx.fill();

        // Terrain silhouette
        ctx.fillStyle = 'rgba(100, 80, 50, 0.6)';
        ctx.beginPath();
        const step = 8;
        ctx.moveTo(mapX, mapY + mapH);
        for (let wx = 0; wx < Config.WORLD_WIDTH; wx += step) {
            const surfaceY = this.game.terrain.findSurface(wx);
            const mx = mapX + wx * scaleX;
            const my = mapY + surfaceY * scaleY;
            ctx.lineTo(mx, my);
        }
        ctx.lineTo(mapX + mapW, mapY + mapH);
        ctx.closePath();
        ctx.fill();

        // Water level
        const waterY = mapY + this.game.water.level * scaleY;
        if (waterY < mapY + mapH) {
            ctx.fillStyle = 'rgba(30, 100, 200, 0.4)';
            ctx.fillRect(mapX, waterY, mapW, mapY + mapH - waterY);
        }

        // Worm dots
        for (const entity of this.game.entities) {
            if (!entity.alive || !(entity instanceof Worm)) continue;
            const dx = mapX + entity.x * scaleX;
            const dy = mapY + entity.y * scaleY;
            const isActive = entity === this.game.activeWorm;
            ctx.fillStyle = entity.team.color.primary;
            ctx.beginPath();
            ctx.arc(dx, dy, isActive ? 3 : 2, 0, Math.PI * 2);
            ctx.fill();
            if (isActive) {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }

        // Camera viewport box
        const view = this.game.camera.getView();
        const vx = mapX + view.x * scaleX;
        const vy = mapY + view.y * scaleY;
        const vw = view.viewWidth * scaleX;
        const vh = view.viewHeight * scaleY;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(vx, vy, vw, vh);

        // Border
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.5)';
        ctx.lineWidth = 1;
        this.roundRect(ctx, mapX - 2, mapY - 2, mapW + 4, mapH + 4, 4);
        ctx.stroke();

        ctx.restore();
    }

    getWeaponPanelClickIndex(mouseX, mouseY) {
        const weapons = this.game.weapons.getWeaponList();
        const cols = 7;
        const cellSize = 50;
        const padding = 4;
        const rows = Math.ceil(weapons.length / cols);

        const panelW = cols * (cellSize + padding) + padding;
        const panelH = rows * (cellSize + padding) + padding;
        const panelX = (this.game.renderer.screenWidth - panelW) / 2;
        const panelY = (this.game.renderer.screenHeight - panelH) / 2;

        for (let i = 0; i < weapons.length; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = panelX + padding + col * (cellSize + padding);
            const y = panelY + padding + row * (cellSize + padding);

            if (mouseX >= x && mouseX <= x + cellSize && mouseY >= y && mouseY <= y + cellSize) {
                return i;
            }
        }
        return -1;
    }
}
