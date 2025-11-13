const SESSION_RECORDING_FLUSHED_SIZE = '$sess_rec_flush_size';
export class FlushedSizeTracker {
    constructor(posthog) {
        if (!posthog.persistence) {
            throw new Error('it is not valid to not have persistence and be this far into setting up the application');
        }
        this._getProperty = posthog.get_property.bind(posthog);
        this._setProperty = posthog.persistence.set_property.bind(posthog.persistence);
    }
    trackSize(size) {
        const currentFlushed = Number(this._getProperty(SESSION_RECORDING_FLUSHED_SIZE)) || 0;
        const newValue = currentFlushed + size;
        this._setProperty(SESSION_RECORDING_FLUSHED_SIZE, newValue);
    }
    reset() {
        return this._setProperty(SESSION_RECORDING_FLUSHED_SIZE, 0);
    }
    get currentTrackedSize() {
        return Number(this._getProperty(SESSION_RECORDING_FLUSHED_SIZE)) || 0;
    }
}
