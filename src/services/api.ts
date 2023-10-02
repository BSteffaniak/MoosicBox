import { makePersisted } from '@solid-primitives/storage';
import { isServer } from 'solid-js/web';
import { createSignal } from 'solid-js';
import { currentPlayerId } from './player';

function getDefaultApiUrl(): string {
    if (isServer) return 'http://localhost:8000';

    return `${window.location.protocol}//${window.location.hostname}:8000`;
}

export namespace Api {
    export const [apiUrl, setApiUrl] = makePersisted(
        createSignal(getDefaultApiUrl()),
        {
            name: 'apiUrl',
        },
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

    export interface Artist {
        artistId: number;
        title: string;
        containsArtwork: boolean;
        blur: boolean;
    }

    export interface Album {
        albumId: number;
        title: string;
        artist: string;
        artistId: number;
        containsArtwork: boolean;
        blur: boolean;
        dateReleased: string;
        dateAdded: string;
    }

    export interface Track {
        trackId: number;
        number: number;
        title: string;
        duration: number;
        album: string;
        albumId: number;
        dateReleased: string;
        artist: string;
        artistId: number;
        containsArtwork: boolean;
        blur: boolean;
    }

    export type ArtistSort = 'Name';

    export type ArtistsRequest = {
        sources?: AlbumSource[];
        sort?: ArtistSort;
        filters?: ArtistFilters;
    };

    export type ArtistFilters = {
        search?: string;
    };

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
}

export interface ApiType {
    getAlbum(id: number, signal?: AbortSignal): Promise<Api.Album>;
    getAlbums(
        request: Api.AlbumsRequest | undefined,
        signal?: AbortSignal,
    ): Promise<Api.Album[]>;
    getAlbumArtwork(
        album:
            | {
                  albumId: number;
                  containsArtwork: boolean;
              }
            | undefined,
        signal?: AbortSignal,
    ): string;
    getAlbumTracks(albumId: number, signal?: AbortSignal): Promise<Api.Track[]>;
    getArtists(
        request: Api.ArtistsRequest | undefined,
        signal?: AbortSignal,
    ): Promise<Api.Artist[]>;
}

async function getAlbum(id: number, signal?: AbortSignal): Promise<Api.Album> {
    const query = new URLSearchParams({
        albumId: `${id}`,
    });

    const response = await fetch(`${Api.apiUrl()}/album?${query}`, {
        credentials: 'include',
        signal,
    });

    return await response.json();
}

async function getAlbums(
    request: Api.AlbumsRequest | undefined = undefined,
    signal?: AbortSignal,
): Promise<Api.Album[]> {
    const query = new URLSearchParams({
        playerId: currentPlayerId()!,
    });
    if (request?.sources) query.set('sources', request.sources.join(','));
    if (request?.sort) query.set('sort', request.sort);
    if (request?.filters?.search) query.set('search', request.filters.search);

    const response = await fetch(`${Api.apiUrl()}/albums?${query}`, {
        credentials: 'include',
        signal,
    });

    const albums: Api.Album[] = await response.json();

    return albums;
}

function getAlbumArtwork(
    album:
        | {
              albumId: number;
              containsArtwork: boolean;
          }
        | undefined,
): string {
    if (album?.containsArtwork) {
        return `${Api.apiUrl()}/albums/${album.albumId}/300x300`;
    }
    return '/img/album.svg';
}

async function getAlbumTracks(
    albumId: number,
    signal?: AbortSignal,
): Promise<Api.Track[]> {
    const response = await fetch(
        `${Api.apiUrl()}/album/tracks?albumId=${albumId}`,
        {
            method: 'GET',
            credentials: 'include',
            signal,
        },
    );

    return await response.json();
}

async function getArtists(
    request: Api.ArtistsRequest | undefined = undefined,
    signal?: AbortSignal,
): Promise<Api.Artist[]> {
    const query = new URLSearchParams();
    if (request?.sources) query.set('sources', request.sources.join(','));
    if (request?.sort) query.set('sort', request.sort);
    if (request?.filters?.search) query.set('search', request.filters.search);

    const response = await fetch(`${Api.apiUrl()}/artists?${query}`, {
        credentials: 'include',
        signal,
    });

    const artists: Api.Artist[] = await response.json();

    return artists;
}

export function cancellable<T>(func: (signal: AbortSignal) => Promise<T>): {
    data: Promise<T>;
    controller: AbortController;
    signal: AbortSignal;
} {
    const controller = new AbortController();
    const signal = controller.signal;

    return { data: func(signal), controller, signal };
}

const abortControllers: { [id: string]: AbortController } = {};

export async function once<T>(
    id: string,
    func: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
    const controller = abortControllers[id];

    if (controller) {
        controller.abort();
    }

    const resp = cancellable(func);
    abortControllers[id] = resp.controller;

    let data: T;

    try {
        data = await resp.data;
    } catch (e) {
        throw e;
    } finally {
        delete abortControllers[id];
    }

    return data;
}

export const api: ApiType = {
    getAlbum,
    getAlbums,
    getAlbumArtwork,
    getAlbumTracks,
    getArtists,
};
