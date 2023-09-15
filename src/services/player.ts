import { makePersisted } from '@solid-primitives/storage';
import { createSignal } from 'solid-js';
import { isServer } from 'solid-js/web';
import {
    connect,
    ConnectionResponse,
    getStatus,
    ping,
    StatusResponse,
} from './api';

export const [connection, setConnection] = makePersisted(
    createSignal<ConnectionResponse | undefined>(),
    { name: 'player/connection' },
);
export const [status, setStatus] = createSignal<StatusResponse | undefined>();
export const [currentPlayerId, setCurrentPlayerId] = createSignal<string>();
export const [playing, setPlaying] = createSignal(false);

async function newConnection() {
    setConnection(await connect());
    setCurrentPlayerId(connection()!.players[0]);
}

async function updateStatus() {
    setStatus(await getStatus());
    setPlaying(status()!.players.some((p) => p.isPlaying));
}

async function pingConnection() {
    const pingResponse = await ping(connection()!.clientId);

    if (!pingResponse.alive) {
        await newConnection();
    }
}

export let initialized: Promise<void>;

export async function initConnection() {
    initialized = new Promise(async (resolve) => {
        if (isServer) return;

        updateStatus();

        if (connection()) {
            console.debug('Connection already exists in local storage');
            setCurrentPlayerId(connection()!.players[0]);
            pingConnection();
        } else {
            console.debug("Connection doesn't exist in local storage");
            await newConnection();
        }
        resolve();
    });
}
