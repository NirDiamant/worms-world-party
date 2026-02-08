export class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    on(event, callback, context = null) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push({ callback, context });
        return () => this.off(event, callback);
    }

    off(event, callback) {
        const list = this.listeners.get(event);
        if (!list) return;
        const idx = list.findIndex(l => l.callback === callback);
        if (idx !== -1) list.splice(idx, 1);
    }

    emit(event, data) {
        const list = this.listeners.get(event);
        if (!list) return;
        for (const { callback, context } of list) {
            callback.call(context, data);
        }
    }

    clear() {
        this.listeners.clear();
    }
}
