"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromiseQueue = void 0;
const uuidv7_1 = require("../vendor/uuidv7");
class PromiseQueue {
    constructor() {
        this.promiseByIds = {};
    }
    add(promise) {
        const promiseUUID = (0, uuidv7_1.uuidv7)();
        this.promiseByIds[promiseUUID] = promise;
        promise
            .catch(() => { })
            .finally(() => {
            delete this.promiseByIds[promiseUUID];
        });
        return promise;
    }
    async join() {
        let promises = Object.values(this.promiseByIds);
        let length = promises.length;
        while (length > 0) {
            await Promise.all(promises);
            promises = Object.values(this.promiseByIds);
            length = promises.length;
        }
    }
    get length() {
        return Object.keys(this.promiseByIds).length;
    }
}
exports.PromiseQueue = PromiseQueue;
//# sourceMappingURL=promise-queue.js.map