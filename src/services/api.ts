import { makePersisted } from "@solid-primitives/storage";
import { createSignal } from "solid-js";
import { currentPlayerId, initialized } from "./player";

export const [apiUrl, setApiUrl] = makePersisted(
    createSignal("http://127.0.0.1:8000"),
    { name: "apiUrl" },
);

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
    id: string;
    title: string;
    artist: string;
    icon: string;
}

export async function getAlbums(): Promise<Album[]> {
    await initialized;
    const response = await fetch(
        `${apiUrl()}/albums?playerId=${currentPlayerId()}`,
        {
            credentials: "include",
        },
    );

    const albums: Album[] = await response.json();

    albums.forEach((album) => {
        if (album.icon && !album.icon.startsWith("http")) {
            album.icon = `${apiUrl()}/${album.icon}`;
        }
    });

    return albums;
}

export async function getStatus(): Promise<StatusResponse> {
    const response = await fetch(`${apiUrl()}/status`, {
        credentials: "include",
    });

    return await response.json();
}

export async function connect(): Promise<ConnectionResponse> {
    const response = await fetch(`${apiUrl()}/connect`, {
        method: "POST",
        credentials: "include",
    });

    return await response.json();
}

export async function ping(clientId: string): Promise<PingResponse> {
    const response = await fetch(`${apiUrl()}/ping?clientId=${clientId}`, {
        method: "POST",
        credentials: "include",
    });

    return await response.json();
}

export async function stopPlayer(playerId: string): Promise<any> {
    const response = await fetch(
        `${apiUrl()}/playback/stop-player?playerId=${playerId}`,
        {
            method: "POST",
            credentials: "include",
        },
    );

    return await response.json();
}

export async function startPlayer(playerId: string): Promise<any> {
    const response = await fetch(
        `${apiUrl()}/playback/start-player?playerId=${playerId}`,
        {
            method: "POST",
            credentials: "include",
        },
    );

    return await response.json();
}

export async function restartPlayer(playerId: string): Promise<any> {
    const response = await fetch(
        `${apiUrl()}/playback/restart-player?playerId=${playerId}`,
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
        `${apiUrl()}/playback/play?playerId=${currentPlayerId()}`,
        {
            method: "POST",
            credentials: "include",
        },
    );

    return await response.json();
}

export async function playAlbum(albumId: string): Promise<any> {
    await initialized;
    const response = await fetch(
        `${apiUrl()}/playback/play-album?playerId=${currentPlayerId()}&albumId=${albumId}`,
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
        `${apiUrl()}/playback/pause?playerId=${currentPlayerId()}`,
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
        `${apiUrl()}/playback/next-track?playerId=${currentPlayerId()}`,
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
        `${apiUrl()}/playback/previous-track?playerId=${currentPlayerId()}`,
        {
            method: "POST",
            credentials: "include",
        },
    );

    return await response.json();
}
