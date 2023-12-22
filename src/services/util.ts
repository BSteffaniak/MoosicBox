import { Entries } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BaseCallbackType = (...args: any) => boolean | void;
export function createListener<CallbackType extends BaseCallbackType>(): {
    on: (callback: CallbackType) => CallbackType;
    onFirst: (callback: CallbackType) => CallbackType;
    off: (callback: CallbackType) => void;
    listeners: CallbackType[];
    trigger: CallbackType;
} {
    let listeners: CallbackType[] = [];
    function on(callback: CallbackType): CallbackType {
        listeners.push(callback);
        return callback;
    }
    function onFirst(callback: CallbackType): CallbackType {
        listeners.unshift(callback);
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

    return { on, onFirst, off, listeners, trigger: trigger as CallbackType };
}

export function orderedEntries<T extends Parameters<typeof Object.entries>[0]>(
    value: T,
    order: (keyof T)[],
): Entries<T> {
    const updates = Object.entries(value) as Entries<T>;

    updates.sort(([key1], [key2]) => {
        let first = order.indexOf(key1 as keyof T);
        let second = order.indexOf(key2 as keyof T);
        first = first === -1 ? order.length : first;
        second = second === -1 ? order.length : second;

        return first - second;
    });

    return updates;
}
