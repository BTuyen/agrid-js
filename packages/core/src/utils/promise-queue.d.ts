export declare class PromiseQueue {
    private promiseByIds;
    add(promise: Promise<any>): Promise<any>;
    join(): Promise<void>;
    get length(): number;
}
