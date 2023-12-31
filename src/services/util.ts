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

export class QueryParams {
    private params: [string, string][];

    public constructor(init?: Record<string, string> | QueryParams | string) {
        this.params = [];

        if (typeof init === 'string') {
            if (init[0] === '?') {
                init = init.substring(1);
            }

            if (init.trim().length > 0) {
                init.split('&')
                    .map((pair) => pair.split('='))
                    .forEach(([key, value]) => {
                        this.params.push([key, value]);
                    });
            }
        } else if (init instanceof QueryParams) {
            this.params.push(...init.params);
        } else if (init) {
            Object.entries(init).forEach(([key, value]) =>
                this.params.push([key, value]),
            );
        }
    }

    public get size(): number {
        return this.params.length;
    }

    public has(key: string): boolean {
        return !!this.params.find(([k, _value]) => k === key);
    }

    public get(key: string): string | undefined {
        const value = this.params.find(([k, _value]) => k === key);

        if (value) {
            return value[1];
        }

        return undefined;
    }

    public set(key: string, value: string) {
        this.params.push([key, value]);
    }

    public delete(key: string) {
        this.params = this.params.filter(([k, _value]) => k !== key);
    }

    public forEach(func: (key: string, value: string) => void) {
        this.params.forEach(([key, value]) => func(key, value));
    }

    public toString(): string {
        return `${this.params
            .map(
                ([key, value]) =>
                    `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
            )
            .join('&')}`;
    }
}
