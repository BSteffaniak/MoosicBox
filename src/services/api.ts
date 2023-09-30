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
        artist: string;
        artistId: number;
        containsArtwork: boolean;
        blur: boolean;
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
}

export interface ApiType {
    getAlbum(id: number): Promise<Api.Album>;
    getAlbums(request: Api.AlbumsRequest | undefined): Promise<Api.Album[]>;
    getAlbumArtwork(
        album:
            | {
                  albumId: number;
                  containsArtwork: boolean;
              }
            | undefined,
    ): string;
    getAlbumTracks(albumId: number): Promise<Api.Track[]>;
}

async function getAlbum(id: number): Promise<Api.Album> {
    const query = new URLSearchParams({
        albumId: `${id}`,
    });

    const response = await fetch(`${Api.apiUrl()}/album?${query}`, {
        credentials: 'include',
    });

    return await response.json();
}

async function getAlbums(
    request: Api.AlbumsRequest | undefined = undefined,
): Promise<Api.Album[]> {
    const query = new URLSearchParams({
        playerId: currentPlayerId()!,
    });
    if (request?.sources) query.set('sources', request.sources.join(','));
    if (request?.sort) query.set('sort', request.sort);
    if (request?.filters?.search) query.set('search', request.filters.search);

    const response = await fetch(`${Api.apiUrl()}/albums?${query}`, {
        credentials: 'include',
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

async function getAlbumTracks(albumId: number): Promise<Api.Track[]> {
    const response = await fetch(
        `${Api.apiUrl()}/album/tracks?albumId=${albumId}`,
        {
            method: 'GET',
            credentials: 'include',
        },
    );

    return await response.json();
}

export const api: ApiType = {
    getAlbum,
    getAlbums,
    getAlbumArtwork,
    getAlbumTracks,
};
