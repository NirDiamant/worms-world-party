export class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = {};
        this.keysJustPressed = {};
        this.keysJustReleased = {};
        this.mouse = { x: 0, y: 0, down: false, rightDown: false };
        this.mouseJustPressed = false;
        this.mouseJustReleased = false;
        this.rightMouseJustPressed = false;
        this.wheelDelta = 0;

        this._pendingPressed = {};
        this._pendingReleased = {};
        this._pendingMousePressed = false;
        this._pendingMouseReleased = false;
        this._pendingRightMousePressed = false;
        this._pendingWheel = 0;

        this.init();
    }

    init() {
        window.addEventListener('keydown', (e) => {
            if (e.repeat) return;
            this.keys[e.code] = true;
            this._pendingPressed[e.code] = true;

            // Prevent default for game keys
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
                 'Space', 'Tab', 'Enter', 'Backspace',
                 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this._pendingReleased[e.code] = true;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.mouse.down = true;
                this._pendingMousePressed = true;
            } else if (e.button === 2) {
                this.mouse.rightDown = true;
                this._pendingRightMousePressed = true;
            }
        });

        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mouse.down = false;
                this._pendingMouseReleased = true;
            } else if (e.button === 2) {
                this.mouse.rightDown = false;
            }
        });

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this._pendingWheel += e.deltaY > 0 ? -1 : 1;
        }, { passive: false });

        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    update() {
        // Transfer pending events
        this.keysJustPressed = { ...this._pendingPressed };
        this.keysJustReleased = { ...this._pendingReleased };
        this.mouseJustPressed = this._pendingMousePressed;
        this.mouseJustReleased = this._pendingMouseReleased;
        this.rightMouseJustPressed = this._pendingRightMousePressed;
        this.wheelDelta = this._pendingWheel;

        // Clear pending
        this._pendingPressed = {};
        this._pendingReleased = {};
        this._pendingMousePressed = false;
        this._pendingMouseReleased = false;
        this._pendingRightMousePressed = false;
        this._pendingWheel = 0;
    }

    isDown(code) {
        return !!this.keys[code];
    }

    justPressed(code) {
        return !!this.keysJustPressed[code];
    }

    justReleased(code) {
        return !!this.keysJustReleased[code];
    }
}
