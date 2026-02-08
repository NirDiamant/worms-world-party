import { Config } from '../core/Config.js';
import { Utils } from '../core/Utils.js';

export class Camera {
    constructor(screenWidth, screenHeight) {
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
        this.x = 0;
        this.y = 0;
        this.zoom = 1;
        this.targetX = 0;
        this.targetY = 0;
        this.targetZoom = 1;
        this.followTarget = null;
        this.shakeX = 0;
        this.shakeY = 0;
        this.shakeIntensity = 0;
        this.shakeTime = 0;

        // Impact zoom
        this.zoomImpulse = 0;

        // Center on world initially
        this.x = Config.WORLD_WIDTH / 2 - screenWidth / 2;
        this.y = Config.WORLD_HEIGHT / 2 - screenHeight / 2;
        this.targetX = this.x;
        this.targetY = this.y;
    }

    resize(screenWidth, screenHeight) {
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
    }

    follow(target) {
        this.followTarget = target;
    }

    clearFollow() {
        this.followTarget = null;
    }

    pan(dx, dy, dt) {
        this.followTarget = null;
        this.targetX += dx * dt / this.zoom;
        this.targetY += dy * dt / this.zoom;
    }

    zoomBy(amount) {
        this.targetZoom = Utils.clamp(
            this.targetZoom + amount,
            Config.CAMERA_ZOOM_MIN,
            Config.CAMERA_ZOOM_MAX
        );
    }

    shake(intensity) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
        this.shakeTime = 0;
    }

    impactZoom(amount) {
        this.zoomImpulse = Math.max(this.zoomImpulse, amount);
    }

    update(dt) {
        // Follow target
        if (this.followTarget && this.followTarget.alive !== false) {
            const tx = this.followTarget.x;
            const ty = this.followTarget.y;
            this.targetX = tx - (this.screenWidth / this.zoom) / 2;
            this.targetY = ty - (this.screenHeight / this.zoom) / 2;
        }

        // Smooth camera movement
        const speed = Config.CAMERA_FOLLOW_SPEED * dt;
        const effectiveZoom = this.targetZoom + this.zoomImpulse;
        this.x = Utils.lerp(this.x, this.targetX, Math.min(speed, 1));
        this.y = Utils.lerp(this.y, this.targetY, Math.min(speed, 1));
        this.zoom = Utils.lerp(this.zoom, effectiveZoom, Math.min(speed * 2, 1));

        // Decay impact zoom
        if (this.zoomImpulse > 0.001) {
            this.zoomImpulse *= Math.pow(0.05, dt);
        } else {
            this.zoomImpulse = 0;
        }

        // Clamp to world bounds
        const viewW = this.screenWidth / this.zoom;
        const viewH = this.screenHeight / this.zoom;
        this.x = Utils.clamp(this.x, -50, Config.WORLD_WIDTH - viewW + 50);
        this.y = Utils.clamp(this.y, -100, Config.WORLD_HEIGHT - viewH + 100);

        // Screen shake - sinusoidal oscillation with damped envelope
        if (this.shakeIntensity > 0.1) {
            this.shakeTime += dt;
            this.shakeX = Math.sin(this.shakeTime * 40) * this.shakeIntensity;
            this.shakeY = Math.cos(this.shakeTime * 33) * this.shakeIntensity * 0.7;
            this.shakeIntensity *= Math.pow(0.15, dt); // Visible for ~0.5s
        } else {
            this.shakeX = 0;
            this.shakeY = 0;
            this.shakeIntensity = 0;
            this.shakeTime = 0;
        }
    }

    getView() {
        return {
            x: this.x + this.shakeX,
            y: this.y + this.shakeY,
            zoom: this.zoom,
            viewWidth: this.screenWidth / this.zoom,
            viewHeight: this.screenHeight / this.zoom,
        };
    }

    worldToScreen(wx, wy) {
        const view = this.getView();
        return {
            x: (wx - view.x) * view.zoom,
            y: (wy - view.y) * view.zoom,
        };
    }

    screenToWorld(sx, sy) {
        const view = this.getView();
        return {
            x: sx / view.zoom + view.x,
            y: sy / view.zoom + view.y,
        };
    }

    applyTransform(ctx) {
        const view = this.getView();
        ctx.setTransform(view.zoom, 0, 0, view.zoom, -view.x * view.zoom, -view.y * view.zoom);
    }

    resetTransform(ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
}
