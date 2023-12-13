import { isServer } from 'solid-js/web';
import { Api, api } from './api';
import { createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';

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

export function onStartupFirst(func: StartupCallback) {
    if (startedUp) {
        func();
        return;
    }
    startupCallbacks.unshift(func);
}

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
        try {
            await func();
        } catch (e) {
            console.error(e);
        }
    }
}

interface AppState {
    connections: Api.Connection[];
}

export const [appState, setAppState] = createStore<AppState>({
    connections: [],
});

export const [currentArtistSearch, setCurrentArtistSearch] =
    createSignal<Api.Artist[]>();

export const [currentAlbumSearch, setCurrentAlbumSearch] =
    createSignal<Api.Album[]>();

export const [showPlaybackQuality, setShowPlaybackQuality] =
    createSignal(false);

export const [showPlaybackSessions, setShowPlaybackSessions] =
    createSignal(false);

Api.onTokenUpdated((_token) => {
    api.validateSignatureToken();
});
Api.onClientIdUpdated((_clientId) => {
    api.validateSignatureToken();
});
onStartup(async () => {
    if (Api.token() && Api.clientId()) {
        await api.validateSignatureToken();
    }
});
