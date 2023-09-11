import { currentPlayerId, initialized } from "./player";

const API_URL = "http://127.0.0.1:8000";

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
    title: string;
    artist: string;
    icon: string;
}

export async function getAlbums(): Promise<Album[]> {
    await initialized;
    const response = await fetch(`${API_URL}/albums?playerId=${currentPlayerId()}`, {
        credentials: "include",
    });

    return await response.json();
}

export async function getStatus(): Promise<StatusResponse> {
    const response = await fetch(`${API_URL}/status`, {
        credentials: "include",
    });

    return await response.json();
}

export async function connect(): Promise<ConnectionResponse> {
    const response = await fetch(`${API_URL}/connect`, {
        method: "POST",
        credentials: "include",
    });

    return await response.json();
}

export async function ping(clientId: string): Promise<PingResponse> {
    const response = await fetch(`${API_URL}/ping?clientId=${clientId}`, {
        method: "POST",
        credentials: "include",
    });

    return await response.json();
}

export async function stopPlayer(playerId: string): Promise<any> {
    const response = await fetch(
        `${API_URL}/playback/stop-player?playerId=${playerId}`,
        {
            method: "POST",
            credentials: "include",
        },
    );

    return await response.json();
}

export async function startPlayer(playerId: string): Promise<any> {
    const response = await fetch(
        `${API_URL}/playback/start-player?playerId=${playerId}`,
        {
            method: "POST",
            credentials: "include",
        },
    );

    return await response.json();
}

export async function restartPlayer(playerId: string): Promise<any> {
    const response = await fetch(
        `${API_URL}/playback/restart-player?playerId=${playerId}`,
        {
            method: "POST",
            credentials: "include",
        },
    );

    return await response.json();
}

export async function play(): Promise<any> {
    await initialized;
    const response = await fetch(
        `${API_URL}/playback/play?playerId=${currentPlayerId()}`,
        {
            method: "POST",
            credentials: "include",
        },
    );

    return await response.json();
}

export async function pause(): Promise<any> {
    await initialized;
    const response = await fetch(
        `${API_URL}/playback/pause?playerId=${currentPlayerId()}`,
        {
            method: "POST",
            credentials: "include",
        },
    );

    return await response.json();
}

export async function nextTrack(): Promise<any> {
    await initialized;
    const response = await fetch(
        `${API_URL}/playback/next-track?playerId=${currentPlayerId()}`,
        {
            method: "POST",
            credentials: "include",
        },
    );

    return await response.json();
}

export async function previousTrack(): Promise<any> {
    await initialized;
    const response = await fetch(
        `${API_URL}/playback/previous-track?playerId=${currentPlayerId()}`,
        {
            method: "POST",
            credentials: "include",
        },
    );

    return await response.json();
}
