// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BaseCallbackType = (...args: any) => boolean | void;
export function createListener<CallbackType extends BaseCallbackType>(): {
    on: (callback: CallbackType) => CallbackType;
    off: (callback: CallbackType) => void;
    listeners: CallbackType[];
    trigger: CallbackType;
} {
    let listeners: CallbackType[] = [];
    function on(callback: CallbackType): CallbackType {
        listeners.push(callback);
        return callback;
    }
    function off(callback: CallbackType): void {
        listeners = listeners.filter((c) => c !== callback);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const trigger = (...args: any) => {
        for (const listener of listeners) {
            if (listener(...args) === false) {
                break;
            }
        }
    };

    return { on, off, listeners, trigger: trigger as CallbackType };
}
