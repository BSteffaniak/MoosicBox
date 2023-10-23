import { makePersisted } from '@solid-primitives/storage';
import { isServer } from 'solid-js/web';
import { createSignal } from 'solid-js';
import { createListener } from './util';

function getDefaultApiUrl(): string {
    if (isServer) return 'http://localhost:8000';

    return `${window.location.protocol}//${window.location.hostname}:8000`;
}

export namespace Api {
    const onApiUrlUpdatedListeners = createListener<(url: string) => void>();
    export const onApiUrlUpdated = onApiUrlUpdatedListeners.on;
    export const offApiUrlUpdated = onApiUrlUpdatedListeners.off;
    const [_apiUrl, _setApiUrl] = makePersisted(
        createSignal(getDefaultApiUrl()),
        {
            name: 'apiUrl',
        },
    );
    export function apiUrl(): ReturnType<typeof _apiUrl> {
        return _apiUrl();
    }
    export function setApiUrl(url: string): void {
        _setApiUrl(url);

        onApiUrlUpdatedListeners.trigger(url);
    }

    export enum PlayerType {
        HOWLER = 'HOWLER',
    }

    export interface Player {
        playerId: number;
        name: string;
        type: PlayerType;
    }

    export interface Connection {
        connectionId: string;
        name: string;
    }

    export interface Artist {
        artistId: number;
        title: string;
        containsCover: boolean;
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

    export interface PlaybackSession {
        sessionId: number;
        name: string;
        active: boolean;
        playing: boolean;
        position?: number;
        seek?: number;
        playlist: PlaybackSessionPlaylist;
    }

    export interface PlaybackSessionPlaylist {
        sessionPlaylistId: number;
        tracks: Track[];
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
    getArtist(artistId: number, signal?: AbortSignal): Promise<Api.Artist>;
    getArtistCover(
        artist:
            | {
                  artistId: number;
                  containsCover: boolean;
              }
            | undefined,
    ): string;
    getArtistAlbums(
        artistId: number,
        signal?: AbortSignal,
    ): Promise<Api.Album[]>;
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

async function getArtist(
    artistId: number,
    signal?: AbortSignal,
): Promise<Api.Artist> {
    const query = new URLSearchParams({
        artistId: `${artistId}`,
    });

    const response = await fetch(`${Api.apiUrl()}/artist?${query}`, {
        credentials: 'include',
        signal,
    });

    return await response.json();
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

async function getArtistAlbums(
    artistId: number,
    signal?: AbortSignal,
): Promise<Api.Album[]> {
    const query = new URLSearchParams({
        artistId: `${artistId}`,
    });

    const response = await fetch(`${Api.apiUrl()}/artist/albums?${query}`, {
        credentials: 'include',
        signal,
    });

    return await response.json();
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
    const query = new URLSearchParams();
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

function getArtistCover(
    artist:
        | {
              artistId: number;
              containsCover: boolean;
          }
        | undefined,
): string {
    if (artist?.containsCover) {
        return `${Api.apiUrl()}/artists/${artist.artistId}/300x300`;
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
    getArtist,
    getArtistCover,
    getArtistAlbums,
    getAlbum,
    getAlbums,
    getAlbumArtwork,
    getAlbumTracks,
    getArtists,
};
