import { makePersisted } from '@solid-primitives/storage';
import { isServer } from 'solid-js/web';
import { createSignal } from 'solid-js';
import { currentPlayerId, setCurrentPlayerId, setPlaying } from './player';

function getDefaultApiUrl(): string {
    if (isServer) return 'http://localhost:8000';

    return `${window.location.protocol}//${window.location.hostname}:8000`;
}

export const [apiUrl, setApiUrl] = makePersisted(createSignal(''), {
    name: 'apiUrl',
});

if (!apiUrl()) {
    setApiUrl(getDefaultApiUrl);
}

export const [connection, setConnection] = makePersisted(
    createSignal<ConnectionResponse | undefined>(),
    { name: 'player/connection' },
);
export const [status, setStatus] = createSignal<StatusResponse | undefined>();

export interface PingResponse {
    alive: boolean;
}

export interface Player {
    playerId: string;
    isPlaying: boolean;
}

export interface ConnectionResponse {
    clientId: string;
    players: string[];
}

export interface StatusResponse {
    players: Player[];
}

export interface Album {
    albumId: number;
    title: string;
    artist: string;
    artistId: number;
    containsArtwork: boolean;
}

export interface Track {
    trackId: number;
    albumId: number;
    artistId: number;
    title: string;
    containsArtwork: boolean;
}

export type AlbumSource = 'Local' | 'Tidal' | 'Qobuz';
export type AlbumSort =
    | 'Artist'
    | 'Name'
    | 'Release-Date'
    | 'Release-Date-Desc'
    | 'Date-Added'
    | 'Date-Added-Desc';

export type AlbumsRequest = {
    sources?: AlbumSource[];
    sort?: AlbumSort;
    filters?: AlbumFilters;
};

export type AlbumFilters = {
    search?: string;
};

export let initialized: Promise<void>;

export async function initConnection() {
    initialized = (async () => {
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
    })();
}

async function newConnection() {
    setConnection(await connect());
    setCurrentPlayerId(connection()!.players[0]);
}

async function updateStatus() {
    setStatus(await getStatus());
    setPlaying(status()!.players.some((p) => p.isPlaying));
}

async function pingConnection() {
    try {
        const pingResponse = await ping(connection()!.clientId);

        if (!pingResponse.alive) {
            await newConnection();
        }
    } catch {
        await newConnection();
    }
}

export async function getAlbum(id: number): Promise<Album> {
    await initialized;
    const query = new URLSearchParams({
        albumId: `${id}`,
    });

    const response = await fetch(`${apiUrl()}/album?${query}`, {
        credentials: 'include',
    });

    return await response.json();
}

export async function getAlbums(
    request: AlbumsRequest | undefined = undefined,
): Promise<Album[]> {
    await initialized;
    const query = new URLSearchParams({
        playerId: currentPlayerId()!,
    });
    if (request?.sources) query.set('sources', request.sources.join(','));
    if (request?.sort) query.set('sort', request.sort);
    if (request?.filters?.search) query.set('search', request.filters.search);

    const response = await fetch(`${apiUrl()}/albums?${query}`, {
        credentials: 'include',
    });

    const albums: Album[] = await response.json();

    return albums;
}

export function getAlbumArtwork(album: {
    albumId: number;
    containsArtwork: boolean;
}): string {
    if (album.containsArtwork) {
        return `${apiUrl()}/albums/${album.albumId}/300x300`;
    }
    return '/img/album.svg';
}

export async function getStatus(): Promise<StatusResponse> {
    const response = await fetch(`${apiUrl()}/status`, {
        credentials: 'include',
    });

    return await response.json();
}

export async function connect(): Promise<ConnectionResponse> {
    const response = await fetch(`${apiUrl()}/connect`, {
        method: 'POST',
        credentials: 'include',
    });

    return await response.json();
}

export async function ping(clientId: string): Promise<PingResponse> {
    const response = await fetch(`${apiUrl()}/ping?clientId=${clientId}`, {
        method: 'POST',
        credentials: 'include',
    });

    return await response.json();
}

export async function stopPlayer(playerId: string): Promise<any> {
    const response = await fetch(
        `${apiUrl()}/playback/stop-player?playerId=${playerId}`,
        {
            method: 'POST',
            credentials: 'include',
        },
    );

    return await response.json();
}

export async function startPlayer(playerId: string): Promise<any> {
    const response = await fetch(
        `${apiUrl()}/playback/start-player?playerId=${playerId}`,
        {
            method: 'POST',
            credentials: 'include',
        },
    );

    return await response.json();
}

export async function restartPlayer(playerId: string): Promise<any> {
    const response = await fetch(
        `${apiUrl()}/playback/restart-player?playerId=${playerId}`,
        {
            method: 'POST',
            credentials: 'include',
        },
    );

    return await response.json();
}

export async function play(): Promise<any> {
    await initialized;
    const response = await fetch(
        `${apiUrl()}/playback/play?playerId=${currentPlayerId()}`,
        {
            method: 'POST',
            credentials: 'include',
        },
    );

    return await response.json();
}

export async function getAlbumTracks(albumId: number): Promise<Track[]> {
    await initialized;
    const response = await fetch(
        `${apiUrl()}/album/tracks?albumId=${albumId}`,
        {
            method: 'GET',
            credentials: 'include',
        },
    );

    return await response.json();
}

export async function playAlbum(albumId: string): Promise<any> {
    await initialized;
    const response = await fetch(
        `${apiUrl()}/playback/play-album?playerId=${currentPlayerId()}&albumId=${albumId}`,
        {
            method: 'POST',
            credentials: 'include',
        },
    );

    return await response.json();
}

export async function pause(): Promise<any> {
    await initialized;
    const response = await fetch(
        `${apiUrl()}/playback/pause?playerId=${currentPlayerId()}`,
        {
            method: 'POST',
            credentials: 'include',
        },
    );

    return await response.json();
}

export async function nextTrack(): Promise<any> {
    await initialized;
    const response = await fetch(
        `${apiUrl()}/playback/next-track?playerId=${currentPlayerId()}`,
        {
            method: 'POST',
            credentials: 'include',
        },
    );

    return await response.json();
}

export async function previousTrack(): Promise<any> {
    await initialized;
    const response = await fetch(
        `${apiUrl()}/playback/previous-track?playerId=${currentPlayerId()}`,
        {
            method: 'POST',
            credentials: 'include',
        },
    );

    return await response.json();
}
