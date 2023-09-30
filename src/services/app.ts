import { isServer } from 'solid-js/web';
import { Api } from './api';
import { createSignal } from 'solid-js';

type StartupCallback = () => void | Promise<void>;

declare global {
    interface Window {
        startupCallbacks: StartupCallback[];
    }

    var startupCallbacks: StartupCallback[];
}

if (isServer) global.startupCallbacks = global.startupCallbacks ?? [];
else window.startupCallbacks = window.startupCallbacks ?? [];

const startupCallbacks: StartupCallback[] = isServer
    ? globalThis.startupCallbacks
    : window.startupCallbacks;
let startedUp = false;

export function onStartup(func: StartupCallback) {
    if (startedUp) {
        func();
        return;
    }
    startupCallbacks.push(func);
}

export async function triggerStartup() {
    if (startedUp) return;
    startedUp = true;

    for (const func of startupCallbacks) {
        await func();
    }
}

export const [currentAlbumSearch, setCurrentAlbumSearch] =
    createSignal<Api.Album[]>();
