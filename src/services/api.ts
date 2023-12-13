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

    const onClientIdUpdatedListeners =
        createListener<(clientId: string, old: string) => void>();
    export const onClientIdUpdated = onClientIdUpdatedListeners.on;
    export const offClientIdUpdated = onClientIdUpdatedListeners.off;
    const [_clientId, _setClientId] = makePersisted(createSignal(''), {
        name: 'clientId',
    });
    export function clientId(): ReturnType<typeof _clientId> {
        return _clientId();
    }
    export function setClientId(clientId: string): void {
        const old = _clientId();
        _setClientId(clientId);

        onClientIdUpdatedListeners.trigger(clientId, old);
    }

    const onTokenUpdatedListeners =
        createListener<(token: string, old: string) => void>();
    export const onTokenUpdated = onTokenUpdatedListeners.on;
    export const offTokenUpdated = onTokenUpdatedListeners.off;
    const [_token, _setToken] = makePersisted(createSignal(''), {
        name: 'token',
    });
    export function token(): ReturnType<typeof _token> {
        return _token();
    }
    export function setToken(token: string): void {
        const old = _token();
        _setToken(token);

        onTokenUpdatedListeners.trigger(token, old);
    }

    const onSignatureTokenUpdatedListeners =
        createListener<(url: string) => void>();
    export const onSignatureTokenUpdated = onSignatureTokenUpdatedListeners.on;
    export const offSignatureTokenUpdated =
        onSignatureTokenUpdatedListeners.off;
    const [_signatureToken, _setSignatureToken] = makePersisted(
        createSignal(''),
        {
            name: 'signatureToken',
        },
    );
    export function signatureToken(): ReturnType<typeof _signatureToken> {
        return _signatureToken();
    }
    export function setSignatureToken(url: string): void {
        _setSignatureToken(url);

        onSignatureTokenUpdatedListeners.trigger(url);
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
        alive: boolean;
        players: Player[];
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

    export const AudioFormat = {
        AAC: 'AAC',
        MP3: 'MP3',
        SOURCE: 'SOURCE',
    } as const;

    export interface PlaybackQuality {
        format: keyof typeof AudioFormat;
    }

    export interface PlaybackSession {
        sessionId: number;
        name: string;
        active: boolean;
        playing: boolean;
        position?: number;
        seek?: number;
        activePlayers: Player[];
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

    export function getPath(path: string): string {
        path = path[0] === '/' ? path.substring(1) : path;
        const containsQuery = path.includes('?');
        const params = [];

        const clientId = Api.clientId();
        if (clientId) {
            params.push(`clientId=${encodeURIComponent(clientId)}`);
        }
        const signatureToken = Api.signatureToken();
        if (signatureToken) {
            params.push(`signature=${encodeURIComponent(signatureToken)}`);
        }

        const query = `${containsQuery ? '' : '?'}${params.join('&')}`;

        return `${Api.apiUrl()}/${path}${query}`;
    }
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
        width: number,
        height: number,
        signal?: AbortSignal,
    ): string;
    getAlbumSourceArtwork(
        album:
            | {
                  albumId: number;
                  containsArtwork: boolean;
              }
            | undefined,
        signal?: AbortSignal,
    ): string;
    getAlbumTracks(albumId: number, signal?: AbortSignal): Promise<Api.Track[]>;
    getTracks(trackIds: number[], signal?: AbortSignal): Promise<Api.Track[]>;
    getArtists(
        request: Api.ArtistsRequest | undefined,
        signal?: AbortSignal,
    ): Promise<Api.Artist[]>;
    fetchSignatureToken(signal?: AbortSignal): Promise<string | undefined>;
    refetchSignatureToken(signal?: AbortSignal): Promise<void>;
    validateSignatureToken(signal?: AbortSignal): Promise<void>;
    validateSignatureTokenAndClient(
        signature: string,
        signal?: AbortSignal,
    ): Promise<boolean>;
    magicToken(
        magicToken: string,
        signal?: AbortSignal,
    ): Promise<{ clientId: string; accessToken: string }>;
}

async function getArtist(
    artistId: number,
    signal?: AbortSignal,
): Promise<Api.Artist> {
    const query = new URLSearchParams({
        artistId: `${artistId}`,
    });

    const response = await request(`${Api.apiUrl()}/artist?${query}`, {
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
    width: number,
    height: number,
): string {
    if (album?.containsArtwork) {
        return Api.getPath(`albums/${album.albumId}/${width}x${height}`);
    }
    return '/img/album.svg';
}

function getAlbumSourceArtwork(
    album:
        | {
              albumId: number;
              containsArtwork: boolean;
          }
        | undefined,
): string {
    if (album?.containsArtwork) {
        return Api.getPath(`albums/${album.albumId}/source`);
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

    const response = await request(`${Api.apiUrl()}/artist/albums?${query}`, {
        credentials: 'include',
        signal,
    });

    return await response.json();
}

async function getAlbum(id: number, signal?: AbortSignal): Promise<Api.Album> {
    const query = new URLSearchParams({
        albumId: `${id}`,
    });

    const response = await request(`${Api.apiUrl()}/album?${query}`, {
        credentials: 'include',
        signal,
    });

    return await response.json();
}

async function getAlbums(
    albumsRequest: Api.AlbumsRequest | undefined = undefined,
    signal?: AbortSignal,
): Promise<Api.Album[]> {
    const query = new URLSearchParams();
    if (albumsRequest?.sources)
        query.set('sources', albumsRequest.sources.join(','));
    if (albumsRequest?.sort) query.set('sort', albumsRequest.sort);
    if (albumsRequest?.filters?.search)
        query.set('search', albumsRequest.filters.search);

    const response = await request(`${Api.apiUrl()}/albums?${query}`, {
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
        return Api.getPath(`artists/${artist.artistId}/300x300`);
    }
    return '/img/album.svg';
}

async function getAlbumTracks(
    albumId: number,
    signal?: AbortSignal,
): Promise<Api.Track[]> {
    const response = await request(
        `${Api.apiUrl()}/album/tracks?albumId=${albumId}`,
        {
            method: 'GET',
            credentials: 'include',
            signal,
        },
    );

    return await response.json();
}

async function getTracks(
    trackIds: number[],
    signal?: AbortSignal,
): Promise<Api.Track[]> {
    const response = await request(
        `${Api.apiUrl()}/tracks?trackIds=${trackIds.join(',')}`,
        {
            method: 'GET',
            credentials: 'include',
            signal,
        },
    );

    return await response.json();
}

async function getArtists(
    artistsRequest: Api.ArtistsRequest | undefined = undefined,
    signal?: AbortSignal,
): Promise<Api.Artist[]> {
    const query = new URLSearchParams();
    if (artistsRequest?.sources)
        query.set('sources', artistsRequest.sources.join(','));
    if (artistsRequest?.sort) query.set('sort', artistsRequest.sort);
    if (artistsRequest?.filters?.search)
        query.set('search', artistsRequest.filters.search);

    const response = await request(`${Api.apiUrl()}/artists?${query}`, {
        credentials: 'include',
        signal,
    });

    const artists: Api.Artist[] = await response.json();

    return artists;
}

async function fetchSignatureToken(
    signal?: AbortSignal,
): Promise<string | undefined> {
    const response = await request(`${Api.apiUrl()}/auth/signature-token`, {
        credentials: 'include',
        method: 'POST',
        signal,
    });

    const payload = await response.json();

    return payload?.token;
}

async function validateSignatureTokenAndClient(
    signature: string,
    signal?: AbortSignal,
): Promise<boolean> {
    try {
        const response = await request(
            `${Api.apiUrl()}/auth/validate-signature-token?signature=${signature}`,
            {
                credentials: 'include',
                method: 'POST',
                signal,
            },
        );

        const payload = await response.json();

        return payload.valid;
    } catch {
        return false;
    }
}

async function refetchSignatureToken(): Promise<void> {
    console.debug('Refetching signature token');
    const token = await api.fetchSignatureToken();

    if (token) {
        Api.setSignatureToken(token);
    } else {
        console.error('Failed to fetch signature token');
    }
}

async function validateSignatureToken(): Promise<void> {
    if (!Api.token()) return;

    const existing = Api.signatureToken();

    if (!existing) {
        await api.refetchSignatureToken();

        return;
    }

    const valid = await api.validateSignatureTokenAndClient(existing);

    if (!valid) {
        await api.refetchSignatureToken();
    }
}

async function magicToken(
    magicToken: string,
    signal?: AbortSignal,
): Promise<{ clientId: string; accessToken: string }> {
    const response = await request(
        `${Api.apiUrl()}/auth/magic-token?magicToken=${magicToken}`,
        {
            credentials: 'include',
            signal,
        },
    );

    return await response.json();
}

function request(
    url: string,
    options: Parameters<typeof fetch>[1],
): ReturnType<typeof fetch> {
    if (url[url.length - 1] === '?') url = url.substring(0, url.length - 1);

    const params = new URLSearchParams();
    const clientId = Api.clientId();

    if (clientId) {
        params.set('clientId', clientId);
    }

    if (url.indexOf('?') > 0) {
        url += '&';
    } else {
        url += '?';
    }

    url += params.toString();

    const token = Api.token();
    if (token) {
        const headers = { ...(options?.headers ?? {}), Authorization: token };
        options = {
            ...options,
            headers,
        };
    }
    return fetch(url, options);
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
    getAlbumSourceArtwork,
    getAlbumTracks,
    getTracks,
    getArtists,
    fetchSignatureToken,
    refetchSignatureToken,
    validateSignatureTokenAndClient,
    validateSignatureToken,
    magicToken,
};
