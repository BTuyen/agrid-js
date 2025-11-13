export class SimpleEventEmitter {
    constructor() {
        this._events = {};
        this._events = {};
    }
    on(event, listener) {
        if (!this._events[event]) {
            this._events[event] = [];
        }
        this._events[event].push(listener);
        return () => {
            this._events[event] = this._events[event].filter((x) => x !== listener);
        };
    }
    emit(event, payload) {
        for (const listener of this._events[event] || []) {
            listener(payload);
        }
        for (const listener of this._events['*'] || []) {
            listener(event, payload);
        }
    }
}
