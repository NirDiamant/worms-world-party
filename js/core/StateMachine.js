export class StateMachine {
    constructor(owner) {
        this.owner = owner;
        this.states = new Map();
        this.currentState = null;
        this.currentStateName = null;
        this.previousStateName = null;
    }

    addState(name, state) {
        this.states.set(name, state);
    }

    setState(name, ...args) {
        if (this.currentStateName === name) return;

        const newState = this.states.get(name);
        if (!newState) {
            console.warn(`State '${name}' not found`);
            return;
        }

        if (this.currentState && this.currentState.exit) {
            this.currentState.exit(this.owner);
        }

        this.previousStateName = this.currentStateName;
        this.currentStateName = name;
        this.currentState = newState;

        if (this.currentState.enter) {
            this.currentState.enter(this.owner, ...args);
        }
    }

    update(dt) {
        if (this.currentState && this.currentState.update) {
            this.currentState.update(this.owner, dt);
        }
    }

    is(name) {
        return this.currentStateName === name;
    }

    get name() {
        return this.currentStateName;
    }
}
