import { Config } from './Config.js';
import { EventBus } from './EventBus.js';
import { GameLoop } from './GameLoop.js';
import { StateMachine } from './StateMachine.js';
import { GamePhase, TurnPhase } from './GameState.js';
import { Utils } from './Utils.js';
import { TerrainManager } from '../terrain/TerrainManager.js';
import { Water } from '../terrain/Water.js';
import { Renderer } from '../rendering/Renderer.js';
import { Camera } from '../rendering/Camera.js';
import { InputManager } from '../input/InputManager.js';
import { ParticleSystem } from '../rendering/ParticleSystem.js';
import { SpriteFactory } from '../rendering/SpriteFactory.js';
import { UIRenderer } from '../rendering/UIRenderer.js';
import { PhysicsEngine } from '../physics/PhysicsEngine.js';
import { ExplosionSolver } from '../physics/ExplosionSolver.js';
import { Worm } from '../entities/Worm.js';
import { WeaponRegistry } from '../weapons/WeaponRegistry.js';
import { AimController } from '../input/AimController.js';
import { PowerBar } from '../input/PowerBar.js';
import { AIController } from '../ai/AIController.js';
import { AudioManager } from '../audio/AudioManager.js';
import { Tombstone } from '../entities/Tombstone.js';
import { Crate } from '../entities/Crate.js';
import { Barrel } from '../entities/Barrel.js';
import { MenuScreen } from '../ui/MenuScreen.js';
import { SetupScreen } from '../ui/SetupScreen.js';
import { GameOverScreen } from '../ui/GameOverScreen.js';

export class Game {
    constructor() {
        this.events = new EventBus();
        this.renderer = new Renderer();
        this.terrain = new TerrainManager();
        this.water = new Water();
        this.camera = null;
        this.input = null;
        this.particles = new ParticleSystem();
        this.sprites = new SpriteFactory();
        this.physics = new PhysicsEngine(this);
        this.explosions = new ExplosionSolver(this);
        this.weapons = new WeaponRegistry(this);
        this.aim = new AimController(this);
        this.power = new PowerBar(this);
        this.ui = null;
        this.audio = new AudioManager();
        this.ai = new AIController(this);
        this.loop = null;

        // Game state
        this.phase = new StateMachine(this);
        this.turnPhase = new StateMachine(this);
        this.teams = [];
        this.entities = [];
        this.projectiles = [];
        this.currentTeamIndex = 0;
        this.currentWormIndex = [];
        this.turnTimer = 0;
        this.retreatTimer = 0;
        this.wind = 0;
        this.roundNumber = 0;
        this.suddenDeath = false;
        this.pendingExplosions = [];
        this.settleTicks = 0;

        // Active worm reference
        this.activeWorm = null;
        this.hasFired = false;
        this.weaponPanelOpen = false;
        this.damageNumbers = [];

        // Screen flash
        this.screenFlash = 0;

        // Explosion fireballs (persistent radial glow at explosion site)
        this.fireballs = [];

        // Wind particles
        this.windParticles = [];
        for (let i = 0; i < 25; i++) {
            this.windParticles.push({
                x: Math.random() * 2000,
                y: Math.random() * 1200,
                alpha: Math.random() * 0.3 + 0.1,
                size: Math.random() * 2 + 1,
            });
        }

        // Weather particles
        this.weatherParticles = [];

        // UI screens
        this.menuScreen = null;
        this.setupScreen = null;
        this.gameOverScreen = null;

        // Settings from setup
        this.settings = {
            numTeams: 2,
            wormsPerTeam: 4,
            teamNames: ['Red Team', 'Blue Team', 'Green Team', 'Yellow Team'],
            teamAI: [false, false, false, false],
            aiDifficulty: [1, 1, 1, 1], // 0=easy, 1=medium, 2=hard
            terrainTheme: 'Grassland',
            turnTime: Config.TURN_TIME,
        };
    }

    async init() {
        this.renderer.init();
        this.camera = new Camera(this.renderer.screenWidth, this.renderer.screenHeight);
        this.input = new InputManager(this.renderer.getCanvas('ui'));
        this.ui = new UIRenderer(this);
        this.loop = new GameLoop(
            (dt) => this.update(dt),
            (alpha) => this.render(alpha)
        );

        // Load sprite assets (non-blocking - falls back to pixel art grids)
        await this.sprites.init();

        // Setup UI screens
        this.menuScreen = new MenuScreen(this);
        this.setupScreen = new SetupScreen(this);
        this.gameOverScreen = new GameOverScreen(this);

        // Window resize handler
        window.addEventListener('resize', () => {
            this.camera.resize(this.renderer.screenWidth, this.renderer.screenHeight);
        });

        this.setupGameStates();
        this.setupTurnStates();

        // Start in menu
        this.phase.setState(GamePhase.MENU);
        this.loop.start();
    }

    setupGameStates() {
        this.phase.addState(GamePhase.MENU, {
            enter: (game) => {
                this.menuScreen.show();
                document.getElementById('menu-overlay').classList.remove('hidden');
            },
            exit: (game) => {
                this.menuScreen.hide();
            },
        });

        this.phase.addState(GamePhase.SETUP, {
            enter: (game) => {
                this.setupScreen.show();
            },
            exit: (game) => {
                this.setupScreen.hide();
            },
        });

        this.phase.addState(GamePhase.PLAYING, {
            enter: (game) => {
                document.getElementById('menu-overlay').classList.add('hidden');
                this.startGame();
            },
            update: (game, dt) => {
                this.updatePlaying(dt);
            },
        });

        this.phase.addState(GamePhase.GAME_OVER, {
            enter: (game) => {
                document.getElementById('menu-overlay').classList.remove('hidden');
                this.gameOverScreen.show(this.getWinner());
            },
            exit: (game) => {
                this.gameOverScreen.hide();
            },
        });
    }

    setupTurnStates() {
        this.turnPhase.addState(TurnPhase.TURN_START, {
            enter: (game) => {
                this.startTurn();
            },
            update: (game, dt) => {
                // Brief delay then move to player control
                this.settleTicks++;
                if (this.settleTicks > 60) { // 1 second delay
                    this.turnPhase.setState(TurnPhase.PLAYER_CONTROL);
                }
            },
        });

        this.turnPhase.addState(TurnPhase.PLAYER_CONTROL, {
            enter: (game) => {
                this.turnTimer = this.settings.turnTime;
                this.hasFired = false;
                this.ai.reset();
                if (this.activeWorm) {
                    this.camera.follow(this.activeWorm);
                    this.activeWorm.startTurn();
                }
            },
            update: (game, dt) => {
                this.updatePlayerControl(dt);
            },
            exit: (game) => {
                if (this.activeWorm) {
                    this.activeWorm.endControl();
                }
            },
        });

        this.turnPhase.addState(TurnPhase.FIRING, {
            enter: () => {
                // Brief state while weapon fires
            },
            update: (game, dt) => {
                // Transition to projectile flight or aftermath
                if (this.projectiles.length > 0) {
                    this.turnPhase.setState(TurnPhase.PROJECTILE_FLIGHT);
                } else {
                    this.turnPhase.setState(TurnPhase.AFTERMATH);
                }
            },
        });

        this.turnPhase.addState(TurnPhase.PROJECTILE_FLIGHT, {
            enter: () => {
                // Follow the first projectile
                if (this.projectiles.length > 0) {
                    this.camera.follow(this.projectiles[0]);
                }
            },
            update: (game, dt) => {
                // Wait for all projectiles to resolve
                if (this.projectiles.length === 0 && this.pendingExplosions.length === 0) {
                    this.turnPhase.setState(TurnPhase.AFTERMATH);
                } else if (this.projectiles.length > 0) {
                    // Follow active projectile
                    const active = this.projectiles.find(p => p.alive);
                    if (active) this.camera.follow(active);
                }
            },
        });

        this.turnPhase.addState(TurnPhase.EXPLOSION_RESOLVE, {
            enter: () => {
                this.settleTicks = 0;
            },
            update: (game, dt) => {
                this.settleTicks++;
                if (this.pendingExplosions.length === 0 && this.settleTicks > 30) {
                    this.turnPhase.setState(TurnPhase.AFTERMATH);
                }
            },
        });

        this.turnPhase.addState(TurnPhase.AFTERMATH, {
            enter: () => {
                this.settleTicks = 0;
            },
            update: (game, dt) => {
                // Wait for everything to settle (worms falling, etc)
                this.settleTicks++;
                const allSettled = this.entities.every(e =>
                    !e.alive || (Math.abs(e.vx) < 1 && Math.abs(e.vy) < 1 && e.grounded)
                );

                if ((allSettled && this.settleTicks > 30) || this.settleTicks > 300) {
                    if (this.hasFired) {
                        this.turnPhase.setState(TurnPhase.RETREAT_TIMER);
                    } else {
                        this.turnPhase.setState(TurnPhase.TURN_END);
                    }
                }
            },
        });

        this.turnPhase.addState(TurnPhase.RETREAT_TIMER, {
            enter: () => {
                this.retreatTimer = Config.RETREAT_TIME;
                if (this.activeWorm && this.activeWorm.alive) {
                    this.camera.follow(this.activeWorm);
                    this.activeWorm.startRetreat();
                }
            },
            update: (game, dt) => {
                this.retreatTimer -= dt;
                if (this.activeWorm && this.activeWorm.alive) {
                    this.handleWormMovement(dt, false);
                }
                if (this.retreatTimer <= 0) {
                    this.turnPhase.setState(TurnPhase.TURN_END);
                }
            },
        });

        this.turnPhase.addState(TurnPhase.TURN_END, {
            enter: () => {
                this.settleTicks = 0;
                this.endTurn();
            },
            update: (game, dt) => {
                this.settleTicks++;
                if (this.settleTicks > Config.HOT_SEAT_DELAY * 60) {
                    // Check win condition
                    const aliveTeams = this.teams.filter(t => t.worms.some(w => w.alive));
                    if (aliveTeams.length <= 1) {
                        this.phase.setState(GamePhase.GAME_OVER);
                    } else {
                        this.turnPhase.setState(TurnPhase.TURN_START);
                    }
                }
            },
        });
    }

    startGame() {
        // Reset state
        this.entities = [];
        this.projectiles = [];
        this.teams = [];
        this.currentTeamIndex = 0;
        this.roundNumber = 0;
        this.suddenDeath = false;
        this.particles.clear();

        // Generate terrain
        this.terrain.generate(this.settings.terrainTheme);
        this.water = new Water();

        // Generate random worm positions across the map
        const totalWorms = this.settings.numTeams * this.settings.wormsPerTeam;
        const minSpacing = 60;
        const margin = 120;
        const positions = [];
        for (let i = 0; i < totalWorms; i++) {
            let x, attempts = 0;
            do {
                x = margin + Math.random() * (Config.WORLD_WIDTH - margin * 2);
                attempts++;
            } while (attempts < 200 && positions.some(px => Math.abs(px - x) < minSpacing));
            positions.push(x);
        }
        // Shuffle so teams get interleaved random spots
        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }

        // Create teams and worms
        let posIdx = 0;
        for (let i = 0; i < this.settings.numTeams; i++) {
            const team = {
                index: i,
                name: this.settings.teamNames[i],
                color: Config.TEAM_COLORS[i],
                worms: [],
                isAI: this.settings.teamAI[i],
                aiDifficulty: this.settings.aiDifficulty[i],
                currentWormIndex: 0,
            };

            for (let w = 0; w < this.settings.wormsPerTeam; w++) {
                const wormX = positions[posIdx++];
                const wormY = this.terrain.findSurface(Math.round(wormX)) - Config.WORM_HEIGHT / 2 - 1;

                const name = (this.settings.wormNames && this.settings.wormNames[i] && this.settings.wormNames[i][w])
                    ? this.settings.wormNames[i][w]
                    : (Config.WORM_NAMES[i] ? Config.WORM_NAMES[i][w % Config.WORM_NAMES[i].length] : `Worm ${w + 1}`);

                const worm = new Worm(this, wormX, wormY, name, team);
                team.worms.push(worm);
                this.entities.push(worm);
            }

            this.teams.push(team);
        }

        // Initialize weather particles for this theme
        this.weatherParticles = [];
        const weather = this.terrain.theme ? this.terrain.theme.weather : null;
        if (weather) {
            const count = weather === 'snow' ? 80 : weather === 'rain' ? 60 : weather === 'sand' ? 50 : 30;
            for (let i = 0; i < count; i++) {
                this.weatherParticles.push({
                    x: Math.random() * Config.WORLD_WIDTH,
                    y: Math.random() * Config.WORLD_HEIGHT,
                    vx: 0, vy: 0,
                    size: weather === 'snow' ? Math.random() * 3 + 1 : Math.random() * 2 + 1,
                    alpha: Math.random() * 0.4 + 0.2,
                    wobble: Math.random() * Math.PI * 2,
                });
            }
        }

        // Spawn explosive barrels on terrain
        const numBarrels = Utils.randomInt(3, 7);
        for (let i = 0; i < numBarrels; i++) {
            const bx = Utils.randomRange(150, Config.WORLD_WIDTH - 150);
            const by = this.terrain.findSurface(Math.round(bx)) - 10;
            // Avoid spawning too close to worms
            const tooClose = this.entities.some(e => Utils.distance(bx, by, e.x, e.y) < 50);
            if (!tooClose && by > 50) {
                this.entities.push(new Barrel(this, bx, by));
            }
        }

        // Initialize weapon ammo
        this.weapons.initAmmo();

        // Random wind
        this.randomizeWind();

        // Floating damage numbers
        this.damageNumbers = [];
        this.events.on('damageNumber', (data) => {
            this.damageNumbers.push({
                x: data.x, y: data.y,
                vx: Utils.randomRange(-15, 15),
                amount: data.amount,
                life: 1.5,
                maxLife: 1.5,
            });
        });

        // Tombstone spawning
        this.events.on('wormDied', (data) => {
            if (data.cause === 'killed' && data.x !== undefined) {
                const tomb = new Tombstone(this, data.x, data.y);
                this.entities.push(tomb);
            }
        });

        // Crate spawning
        this.events.on('spawnCrate', () => {
            const cx = Utils.randomRange(100, Config.WORLD_WIDTH - 100);
            const type = Math.random() < 0.3 ? 'health' : 'weapon';
            const crate = new Crate(this, cx, 0, type);
            this.entities.push(crate);
        });

        // Start first turn
        this.turnPhase.setState(TurnPhase.TURN_START);
    }

    startTurn() {
        this.settleTicks = 0;
        this.hasFired = false;
        this.weaponPanelOpen = false;

        // Find next team with alive worms
        let attempts = 0;
        while (attempts < this.teams.length) {
            const team = this.teams[this.currentTeamIndex];
            const aliveWorms = team.worms.filter(w => w.alive);
            if (aliveWorms.length > 0) {
                // Get next worm for this team
                team.currentWormIndex = team.currentWormIndex % aliveWorms.length;
                this.activeWorm = aliveWorms[team.currentWormIndex];
                team.currentWormIndex = (team.currentWormIndex + 1) % aliveWorms.length;
                break;
            }
            this.currentTeamIndex = (this.currentTeamIndex + 1) % this.teams.length;
            attempts++;
        }

        // New wind each turn
        this.randomizeWind();
    }

    endTurn() {
        if (this.activeWorm) {
            this.activeWorm.endTurn();
        }
        this.activeWorm = null;

        // Advance to next team
        this.currentTeamIndex = (this.currentTeamIndex + 1) % this.teams.length;

        // Check if we've gone full round
        if (this.currentTeamIndex === 0) {
            this.roundNumber++;
            // Check sudden death
            if (this.roundNumber >= Config.SUDDEN_DEATH_ROUNDS && !this.suddenDeath) {
                this.triggerSuddenDeath();
            }
            if (this.suddenDeath) {
                this.water.rise(Config.WATER_RISE_PER_TURN);
            }
        }

        // Spawn crate occasionally
        if (Math.random() < 0.3) {
            this.events.emit('spawnCrate');
        }
    }

    triggerSuddenDeath() {
        this.suddenDeath = true;
        // Set all worms to 1 HP
        for (const entity of this.entities) {
            if (entity instanceof Worm && entity.alive) {
                entity.health = Config.SUDDEN_DEATH_HEALTH;
            }
        }
        this.audio.play('suddenDeath');
        this.events.emit('suddenDeath');
    }

    randomizeWind() {
        this.wind = Utils.randomRange(Config.WIND_MIN, Config.WIND_MAX);
    }

    updatePlaying(dt) {
        // Update input
        this.input.update();

        // Camera controls (always available)
        this.handleCameraInput(dt);

        // Update turn phase
        this.turnPhase.update(dt);

        // Update physics for all entities
        this.physics.update(dt);

        // Update all entities
        for (const entity of this.entities) {
            if (entity.alive) entity.update(dt);
        }

        // Update projectiles
        for (const proj of this.projectiles) {
            if (proj.alive) proj.update(dt);
        }

        // Update active weapon (for burst-fire weapons like Uzi/Minigun, Ninja Rope swing)
        const currentWeapon = this.weapons.getCurrentWeapon();
        if (currentWeapon && currentWeapon.update) {
            if (currentWeapon.name === 'Ninja Rope') {
                currentWeapon.update(dt, this, this.activeWorm);
            } else {
                currentWeapon.update(dt);
            }
        }

        // Process pending explosions
        this.processExplosions();

        // Clean up dead entities
        this.projectiles = this.projectiles.filter(p => p.alive);

        // Update particles
        this.particles.update(dt);

        // Update water
        this.water.update(dt);

        // Update camera
        this.camera.update(dt);

        // Check drowning
        this.checkDrowning();

        // Update damage numbers
        if (this.damageNumbers) {
            for (const dn of this.damageNumbers) {
                dn.life -= dt;
                dn.y -= 40 * dt; // Float upward
                dn.x += (dn.vx || 0) * dt; // X drift
            }
            this.damageNumbers = this.damageNumbers.filter(d => d.life > 0);
        }

        // Update fireballs
        for (const fb of this.fireballs) {
            fb.life -= dt;
        }
        this.fireballs = this.fireballs.filter(f => f.life > 0);

        // Decay screen flash
        if (this.screenFlash > 0.02) {
            this.screenFlash *= Math.pow(0.01, dt);
        } else {
            this.screenFlash = 0;
        }

        // Update wind particles
        for (const wp of this.windParticles) {
            wp.x += this.wind * dt * 2;
            wp.y += 5 * dt;
            // Wrap around screen
            const sw = this.renderer.screenWidth;
            const sh = this.renderer.screenHeight;
            if (wp.x > sw) wp.x -= sw;
            if (wp.x < 0) wp.x += sw;
            if (wp.y > sh) wp.y -= sh;
            if (wp.y < 0) wp.y += sh;
        }

        // Update weather particles
        const weather = this.terrain.theme ? this.terrain.theme.weather : null;
        if (weather && this.weatherParticles.length > 0) {
            for (const wp of this.weatherParticles) {
                wp.wobble += dt * 2;
                if (weather === 'rain') {
                    wp.vx = this.wind * 0.5;
                    wp.vy = 500;
                } else if (weather === 'snow') {
                    wp.vx = this.wind * 0.3 + Math.sin(wp.wobble) * 20;
                    wp.vy = 30 + Math.sin(wp.wobble * 0.7) * 10;
                } else if (weather === 'sand') {
                    wp.vx = this.wind * 1.5 + 80;
                    wp.vy = 15 + Math.sin(wp.wobble) * 8;
                } else if (weather === 'embers') {
                    wp.vx = this.wind * 0.2 + Math.sin(wp.wobble * 1.5) * 15;
                    wp.vy = -25 - Math.random() * 10;
                }
                wp.x += wp.vx * dt;
                wp.y += wp.vy * dt;
                // Wrap
                if (wp.x > Config.WORLD_WIDTH) wp.x -= Config.WORLD_WIDTH;
                if (wp.x < 0) wp.x += Config.WORLD_WIDTH;
                if (wp.y > Config.WORLD_HEIGHT) wp.y = -10;
                if (wp.y < -20) wp.y = Config.WORLD_HEIGHT;
            }
        }
    }

    updatePlayerControl(dt) {
        if (!this.activeWorm || !this.activeWorm.alive) {
            this.turnPhase.setState(TurnPhase.TURN_END);
            return;
        }

        // Turn timer (applies to both human and AI)
        const prevTimer = this.turnTimer;
        this.turnTimer -= dt;

        // Countdown beep in last 5 seconds
        if (this.turnTimer <= 5 && Math.floor(prevTimer) !== Math.floor(this.turnTimer) && this.turnTimer > 0) {
            this.audio.play('countdown');
        }

        // Check if AI controlled
        const team = this.activeWorm.team;
        if (team.isAI) {
            this.ai.update(dt, this.activeWorm);
            if (this.turnTimer <= 0) {
                this.turnPhase.setState(TurnPhase.TURN_END);
            }
            return;
        }
        if (this.turnTimer <= 0) {
            this.turnPhase.setState(TurnPhase.TURN_END);
            return;
        }

        // Weapon panel toggle
        if (this.input.justPressed('KeyQ') || this.input.rightMouseJustPressed) {
            this.weaponPanelOpen = !this.weaponPanelOpen;
        }

        // Click weapon selection in panel
        if (this.weaponPanelOpen && this.input.mouseJustPressed) {
            const idx = this.ui.getWeaponPanelClickIndex(this.input.mouse.x, this.input.mouse.y);
            if (idx >= 0) {
                this.weapons.selectWeapon(idx);
                this.weaponPanelOpen = false;
                this.audio.play('click');
            }
        }

        // Weapon switching with Tab
        if (this.input.justPressed('Tab') && !this.hasFired) {
            this.weapons.cycleWeapon();
        }

        // Fuse timer keys (1-5)
        for (let i = 1; i <= 5; i++) {
            if (this.input.justPressed(`Digit${i}`)) {
                this.weapons.setFuseTimer(i);
            }
        }

        // Aim
        this.aim.update(dt);

        // Power bar + firing
        this.power.update(dt);

        // Movement (only if hasn't fired yet)
        if (!this.hasFired) {
            this.handleWormMovement(dt, true);
        }
    }

    handleWormMovement(dt, allowJump) {
        if (!this.activeWorm || !this.activeWorm.alive) return;
        const worm = this.activeWorm;

        if (this.input.isDown('ArrowLeft')) {
            worm.moveLeft(dt);
        } else if (this.input.isDown('ArrowRight')) {
            worm.moveRight(dt);
        } else {
            worm.stopMoving();
        }

        if (allowJump) {
            if (this.input.justPressed('Enter')) {
                worm.jump();
            }
            if (this.input.justPressed('Backspace')) {
                worm.backflip();
            }
        }
    }

    handleCameraInput(dt) {
        // WASD camera pan
        if (this.input.isDown('KeyW')) this.camera.pan(0, -Config.CAMERA_PAN_SPEED, dt);
        if (this.input.isDown('KeyS')) this.camera.pan(0, Config.CAMERA_PAN_SPEED, dt);
        if (this.input.isDown('KeyA')) this.camera.pan(-Config.CAMERA_PAN_SPEED, 0, dt);
        if (this.input.isDown('KeyD')) this.camera.pan(Config.CAMERA_PAN_SPEED, 0, dt);

        // Zoom
        if (this.input.wheelDelta !== 0) {
            this.camera.zoomBy(this.input.wheelDelta * Config.CAMERA_ZOOM_SPEED);
        }
    }

    fireWeapon(angle, power) {
        if (this.hasFired || !this.activeWorm) return;
        this.hasFired = true;
        this.weaponPanelOpen = false;

        const weapon = this.weapons.getCurrentWeapon();
        if (!weapon) return;

        weapon.fire(this, this.activeWorm, angle, power);
        this.weapons.useAmmo(weapon.name);

        this.audio.play('fire');

        // Some weapons end turn immediately
        if (weapon.endsTurnOnFire) {
            this.turnPhase.setState(TurnPhase.PROJECTILE_FLIGHT);
        } else if (weapon.isMelee || weapon.isHitscan) {
            this.turnPhase.setState(TurnPhase.AFTERMATH);
        }
    }

    addProjectile(projectile) {
        this.projectiles.push(projectile);
        if (this.turnPhase.is(TurnPhase.PLAYER_CONTROL) || this.turnPhase.is(TurnPhase.FIRING)) {
            this.turnPhase.setState(TurnPhase.PROJECTILE_FLIGHT);
        }
    }

    addExplosion(x, y, radius, damage, owner = null) {
        this.pendingExplosions.push({ x, y, radius, damage, owner });
    }

    processExplosions() {
        while (this.pendingExplosions.length > 0) {
            const exp = this.pendingExplosions.shift();
            this.explosions.resolve(exp.x, exp.y, exp.radius, exp.damage, exp.owner);

            // Screen flash based on blast radius
            this.screenFlash = exp.radius >= 50 ? 0.7 : exp.radius / 80;

            // Impact zoom
            if (this.camera.impactZoom) {
                this.camera.impactZoom(exp.radius * 0.002);
            }

            // Spawn fireball (persistent glow)
            this.fireballs.push({
                x: exp.x, y: exp.y,
                radius: exp.radius * 1.2,
                life: 0.6,
                maxLife: 0.6,
            });
        }
    }

    checkDrowning() {
        for (const entity of this.entities) {
            if (entity.alive && entity instanceof Worm) {
                const waterY = this.water.getWaveY(entity.x);
                const feetY = entity.y + entity.height / 2;
                if (feetY >= waterY) {
                    // Splash effect on first contact
                    if (!entity._wasInWater) {
                        entity._wasInWater = true;
                        this.particles.emitSplash(entity.x, waterY);
                        this.audio.play('splash');
                    }
                    entity.drown();
                } else {
                    entity._wasInWater = false;
                }
            }
        }

        // Projectiles entering water
        for (const proj of this.projectiles) {
            if (proj.alive && !proj._wasInWater) {
                const waterY = this.water.getWaveY(proj.x);
                if (proj.y >= waterY) {
                    proj._wasInWater = true;
                    this.particles.emitSplash(proj.x, waterY);
                    this.audio.play('splash');
                    proj.alive = false;
                }
            }
        }
    }

    addEntity(entity) {
        this.entities.push(entity);
    }

    removeEntity(entity) {
        entity.alive = false;
    }

    getAliveWorms() {
        return this.entities.filter(e => e instanceof Worm && e.alive);
    }

    getWinner() {
        const aliveTeams = this.teams.filter(t => t.worms.some(w => w.alive));
        if (aliveTeams.length === 1) return aliveTeams[0];
        if (aliveTeams.length === 0) return null; // Draw
        return null;
    }

    update(dt) {
        if (this.phase.is(GamePhase.PLAYING)) {
            this.phase.currentState.update(this, dt);
        }
    }

    render(alpha) {
        // Always clear effects and entity layers
        this.renderer.clear('entities');
        this.renderer.clear('effects');
        this.renderer.clear('ui');

        if (this.phase.is(GamePhase.PLAYING)) {
            const bgCtx = this.renderer.getContext('background');
            const terrainCtx = this.renderer.getContext('terrain');
            const entityCtx = this.renderer.getContext('entities');
            const effectsCtx = this.renderer.getContext('effects');
            const uiCtx = this.renderer.getContext('ui');

            // Sky (only redraw if needed - for now, every frame)
            this.renderer.clear('background');
            this.renderer.renderSky(this.camera, this.terrain.theme);

            // Terrain
            this.renderer.clear('terrain');
            this.terrain.render(terrainCtx, this.camera);

            // Water (on terrain layer)
            this.water.render(terrainCtx, this.camera);

            // Entity shadows (world space, under each worm)
            this.camera.applyTransform(entityCtx);
            for (const entity of this.entities) {
                if (entity.alive && entity instanceof Worm) {
                    const shadowY = this.terrain.findSurface(Math.round(entity.x));
                    entityCtx.globalAlpha = 0.25;
                    entityCtx.fillStyle = '#000';
                    entityCtx.beginPath();
                    entityCtx.ellipse(entity.x, shadowY, entity.width * 0.6, 3, 0, 0, Math.PI * 2);
                    entityCtx.fill();
                    entityCtx.globalAlpha = 1;
                }
            }

            // Entities
            for (const entity of this.entities) {
                if (entity.alive) entity.render(entityCtx, alpha);
            }
            for (const proj of this.projectiles) {
                if (proj.alive) proj.render(entityCtx, alpha);
            }
            // Ninja rope line
            const ropeWeapon = this.weapons.getCurrentWeapon();
            if (ropeWeapon && ropeWeapon.name === 'Ninja Rope' && ropeWeapon.active && ropeWeapon.attached && this.activeWorm) {
                entityCtx.strokeStyle = '#8B4513';
                entityCtx.lineWidth = 2;
                entityCtx.beginPath();
                entityCtx.moveTo(this.activeWorm.x, this.activeWorm.y);
                entityCtx.lineTo(ropeWeapon.anchorX, ropeWeapon.anchorY);
                entityCtx.stroke();
                // Anchor point
                entityCtx.fillStyle = '#888';
                entityCtx.beginPath();
                entityCtx.arc(ropeWeapon.anchorX, ropeWeapon.anchorY, 3, 0, Math.PI * 2);
                entityCtx.fill();
            }

            // Aim crosshair (world space)
            if (this.turnPhase.is(TurnPhase.PLAYER_CONTROL) && !this.hasFired) {
                this.aim.render(entityCtx);
            }
            this.camera.resetTransform(entityCtx);

            // Explosion fireballs (world space, effects layer)
            this.camera.applyTransform(effectsCtx);
            for (const fb of this.fireballs) {
                const t = fb.life / fb.maxLife;
                const grad = effectsCtx.createRadialGradient(
                    fb.x, fb.y, 0, fb.x, fb.y, fb.radius * (1 + (1 - t) * 0.5)
                );
                grad.addColorStop(0, `rgba(255, 220, 100, ${t * 0.6})`);
                grad.addColorStop(0.3, `rgba(255, 120, 20, ${t * 0.4})`);
                grad.addColorStop(0.7, `rgba(200, 40, 0, ${t * 0.15})`);
                grad.addColorStop(1, `rgba(100, 10, 0, 0)`);
                effectsCtx.fillStyle = grad;
                effectsCtx.beginPath();
                effectsCtx.arc(fb.x, fb.y, fb.radius * (1 + (1 - t) * 0.5), 0, Math.PI * 2);
                effectsCtx.fill();
            }
            this.camera.resetTransform(effectsCtx);

            // Particles + damage numbers (effects layer)
            this.camera.applyTransform(effectsCtx);
            this.particles.render(effectsCtx);
            // Floating damage numbers with pop-in, color tiers, drift
            if (this.damageNumbers) {
                for (const dn of this.damageNumbers) {
                    const elapsed = dn.maxLife - dn.life;
                    const alphaVal = Math.min(1, dn.life / dn.maxLife * 1.5);

                    // Pop-in scale: starts at 2.0, eases to 1.0 over 0.2s, then slowly grows to 1.3
                    let scale;
                    if (elapsed < 0.2) {
                        scale = 2.0 - (elapsed / 0.2) * 1.0; // 2.0 → 1.0
                    } else {
                        scale = 1.0 + ((elapsed - 0.2) / (dn.maxLife - 0.2)) * 0.3; // 1.0 → 1.3
                    }

                    // Color tiers
                    let color;
                    if (dn.amount >= 50) color = '#ff0044';
                    else if (dn.amount >= 30) color = '#ff2222';
                    else if (dn.amount >= 15) color = '#ff6644';
                    else color = '#ffaa22';

                    effectsCtx.globalAlpha = alphaVal;
                    effectsCtx.font = `bold ${Math.round(22 * scale)}px monospace`;
                    effectsCtx.textAlign = 'center';
                    effectsCtx.fillStyle = color;
                    effectsCtx.strokeStyle = '#000';
                    effectsCtx.lineWidth = 4;
                    effectsCtx.strokeText(`-${dn.amount}`, dn.x, dn.y);
                    effectsCtx.fillText(`-${dn.amount}`, dn.x, dn.y);
                    effectsCtx.globalAlpha = 1;
                }
            }
            this.camera.resetTransform(effectsCtx);

            // Screen flash (screen-space, effects layer)
            if (this.screenFlash > 0.02) {
                effectsCtx.globalAlpha = this.screenFlash;
                effectsCtx.fillStyle = '#fff';
                effectsCtx.fillRect(0, 0, effectsCtx.canvas.width, effectsCtx.canvas.height);
                effectsCtx.globalAlpha = 1;
            }

            // Wind particles (screen-space, effects layer)
            for (const wp of this.windParticles) {
                effectsCtx.globalAlpha = wp.alpha;
                effectsCtx.fillStyle = 'rgba(220, 220, 220, 1)';
                effectsCtx.beginPath();
                effectsCtx.arc(wp.x, wp.y, wp.size, 0, Math.PI * 2);
                effectsCtx.fill();
            }
            effectsCtx.globalAlpha = 1;

            // Weather particles (world space)
            const weatherType = this.terrain.theme ? this.terrain.theme.weather : null;
            if (weatherType && this.weatherParticles.length > 0) {
                this.camera.applyTransform(effectsCtx);
                for (const wp of this.weatherParticles) {
                    effectsCtx.globalAlpha = wp.alpha;
                    if (weatherType === 'rain') {
                        effectsCtx.strokeStyle = 'rgba(180, 210, 255, 0.6)';
                        effectsCtx.lineWidth = 1;
                        effectsCtx.beginPath();
                        effectsCtx.moveTo(wp.x, wp.y);
                        effectsCtx.lineTo(wp.x + this.wind * 0.02, wp.y + 8);
                        effectsCtx.stroke();
                    } else if (weatherType === 'snow') {
                        effectsCtx.fillStyle = '#fff';
                        effectsCtx.beginPath();
                        effectsCtx.arc(wp.x, wp.y, wp.size, 0, Math.PI * 2);
                        effectsCtx.fill();
                    } else if (weatherType === 'sand') {
                        effectsCtx.fillStyle = 'rgba(210, 180, 120, 0.5)';
                        effectsCtx.fillRect(wp.x, wp.y, wp.size, wp.size * 0.5);
                    } else if (weatherType === 'embers') {
                        const grad = effectsCtx.createRadialGradient(wp.x, wp.y, 0, wp.x, wp.y, wp.size * 2);
                        grad.addColorStop(0, `rgba(255, ${150 + Math.random() * 50 | 0}, 30, ${wp.alpha})`);
                        grad.addColorStop(1, 'rgba(255, 80, 0, 0)');
                        effectsCtx.fillStyle = grad;
                        effectsCtx.beginPath();
                        effectsCtx.arc(wp.x, wp.y, wp.size * 2, 0, Math.PI * 2);
                        effectsCtx.fill();
                    }
                }
                effectsCtx.globalAlpha = 1;
                this.camera.resetTransform(effectsCtx);
            }

            // Vignette (subtle screen edge darkening)
            const sw = effectsCtx.canvas.width;
            const sh = effectsCtx.canvas.height;
            const vignetteGrad = effectsCtx.createRadialGradient(
                sw / 2, sh / 2, Math.min(sw, sh) * 0.35,
                sw / 2, sh / 2, Math.max(sw, sh) * 0.75
            );
            vignetteGrad.addColorStop(0, 'rgba(0,0,0,0)');
            vignetteGrad.addColorStop(1, 'rgba(0,0,0,0.3)');
            effectsCtx.fillStyle = vignetteGrad;
            effectsCtx.fillRect(0, 0, sw, sh);

            // UI (screen space)
            this.ui.render(uiCtx);
        }
    }

    // Called from setup screen
    startWithSettings(settings) {
        Object.assign(this.settings, settings);
        this.phase.setState(GamePhase.PLAYING);
    }

    // Quick play - default settings
    quickPlay() {
        this.settings.numTeams = 2;
        this.settings.wormsPerTeam = 4;
        this.settings.teamAI = [false, true, false, false];
        this.settings.terrainTheme = Utils.randomChoice(
            ['Grassland', 'Desert', 'Arctic', 'Hell']
        );
        this.phase.setState(GamePhase.PLAYING);
    }

    returnToMenu() {
        this.entities = [];
        this.projectiles = [];
        this.teams = [];
        this.particles.clear();
        this.phase.setState(GamePhase.MENU);
    }
}
