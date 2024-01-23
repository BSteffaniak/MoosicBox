import { makePersisted } from '@solid-primitives/storage';
import { isServer } from 'solid-js/web';
import { createSignal } from 'solid-js';
import { QueryParams, createListener } from './util';

function getDefaultApiUrl(): string {
    if (isServer) return 'http://localhost:8000';

    return `${window.location.protocol}//${window.location.hostname}:8000`;
}

export type ArtistType = Api.Artist['type'] | Api.TidalArtist['type'];
export type Artist = Api.Artist | Api.TidalArtist;

export type AlbumType = Api.Album['type'] | Api.TidalAlbum['type'];
export type Album = Api.Album | Api.TidalAlbum;

export type TrackType = Api.Track['type'] | Api.TidalTrack['type'];
export type Track = Api.Track | Api.TidalTrack;

type GenericTrack = Track;

export function trackId(track: Track | undefined): number | undefined {
    if (!track) return undefined;
    return 'trackId' in track
        ? track.trackId
        : 'id' in track
        ? track.id
        : undefined;
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

    export type GlobalSearchResultType = 'ARTIST' | 'ALBUM' | 'TRACK';
    export type GlobalSearchResult =
        | GlobalArtistSearchResult
        | GlobalAlbumSearchResult
        | GlobalTrackSearchResult;

    export interface GlobalArtistSearchResult {
        type: 'ARTIST';
        artistId: number;
        title: string;
        containsCover: boolean;
        blur: boolean;
    }

    export interface GlobalAlbumSearchResult {
        type: 'ALBUM';
        artistId: number;
        artist: string;
        albumId: number;
        title: string;
        containsCover: boolean;
        blur: boolean;
        dateReleased: string;
        dateAdded: string;
        versions: AlbumVersionQuality[];
    }

    export interface GlobalTrackSearchResult {
        type: 'TRACK';
        artistId: number;
        artist: string;
        albumId: number;
        album: string;
        trackId: number;
        title: string;
        containsCover: boolean;
        blur: boolean;
        dateReleased: string;
        dateAdded: string;
        format: PlaybackQuality['format'];
        bitDepth: number;
        audioBitrate: number;
        overallBitrate: number;
        sampleRate: number;
        channels: number;
        source: TrackSource;
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
        tidalId?: number;
        type: 'LIBRARY';
    }

    export interface TidalArtist {
        id: number;
        title: string;
        containsCover: boolean;
        blur: boolean;
        type: 'TIDAL';
    }

    export enum TrackSource {
        LOCAL = 'LOCAL',
        TIDAL = 'TIDAL',
        QOBUZ = 'QOBUZ',
    }

    export interface AlbumVersionQuality {
        format: PlaybackQuality['format'] | null;
        bitDepth: number | null;
        sampleRate: number | null;
        channels: number | null;
        source: TrackSource;
    }

    export interface Album {
        albumId: number;
        title: string;
        artist: string;
        artistId: number;
        containsCover: boolean;
        blur: boolean;
        dateReleased: string;
        dateAdded: string;
        versions: AlbumVersionQuality[];
        type: 'LIBRARY';
    }

    export interface TidalAlbum {
        id: number;
        title: string;
        artist: string;
        artistId: number;
        containsCover: boolean;
        copyright: string;
        dateReleased: string;
        numberOfTracks: number;
        audioQuality: 'LOSSLESS' | 'HIRES';
        mediaMetadataTags: ('LOSSLESS' | 'HIRES_LOSSLESS' | 'MQA')[];
        blur: boolean;
        type: 'TIDAL';
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
        containsCover: boolean;
        blur: boolean;
        bytes: number;
        format: PlaybackQuality['format'];
        bitDepth: number;
        audioBitrate: number;
        overallBitrate: number;
        sampleRate: number;
        channels: number;
        type: 'LIBRARY';
    }

    export interface TidalTrack {
        id: number;
        number: number;
        title: string;
        artist: string;
        artistId: number;
        containsCover: boolean;
        album: string;
        albumId: number;
        duration: number;
        copyright: string;
        numberOfTracks: number;
        audioQuality: 'LOSSLESS' | 'HIRES';
        mediaMetadataTags: ('LOSSLESS' | 'HIRES_LOSSLESS' | 'MQA')[];
        type: 'TIDAL';
    }

    export interface AlbumVersion {
        tracks: Api.Track[];
        format: PlaybackQuality['format'] | null;
        bitDepth: number | null;
        audioBitrate: number | null;
        overallBitrate: number | null;
        sampleRate: number | null;
        channels: number | null;
        source: TrackSource;
    }

    export const AudioFormat = {
        AAC: 'AAC',
        FLAC: 'FLAC',
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
        volume?: number;
        activePlayers: Player[];
        playlist: PlaybackSessionPlaylist;
    }

    export interface PlaybackSessionPlaylist {
        sessionPlaylistId: number;
        tracks: GenericTrack[];
    }

    export type ArtistSort = 'Name' | 'Name-Desc';

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
        | 'Artist-Desc'
        | 'Name'
        | 'Name-Desc'
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

        const query = `${containsQuery ? '&' : '?'}${params.join('&')}`;

        return `${Api.apiUrl()}/${path}${query}`;
    }

    export type PagingResponse<T> = {
        items: T[];
        count: number;
    };
}

export interface ApiType {
    getArtist(artistId: number, signal?: AbortSignal): Promise<Api.Artist>;
    getArtistCover(
        artist: Artist | Album | Track | undefined,
        width: number,
        height: number,
    ): string;
    getArtistSourceCover(artist: Artist | Album | Track | undefined): string;
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
        album: Album | Track | undefined,
        width: number,
        height: number,
        signal?: AbortSignal,
    ): string;
    getAlbumSourceArtwork(
        album: Album | Track | undefined,
        signal?: AbortSignal,
    ): string;
    getAlbumTracks(albumId: number, signal?: AbortSignal): Promise<Api.Track[]>;
    getAlbumVersions(
        albumId: number,
        signal?: AbortSignal,
    ): Promise<Api.AlbumVersion[]>;
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
    globalSearch(
        query: string,
        offset?: number,
        limit?: number,
        signal?: AbortSignal,
    ): Promise<{ position: number; results: Api.GlobalSearchResult[] }>;
    getArtistFromTidalArtistId(
        tidalArtistId: number,
        signal?: AbortSignal,
    ): Promise<Api.Artist>;
    getArtistFromTidalAlbumId(
        tidalAlbumId: number,
        signal?: AbortSignal,
    ): Promise<Api.Artist>;
    getTidalArtist(
        tidalArtistId: number,
        signal?: AbortSignal,
    ): Promise<Api.TidalArtist>;
    getTidalArtistAlbums(
        tidalArtistId: number,
        signal?: AbortSignal,
    ): Promise<Api.PagingResponse<Api.TidalAlbum>>;
    getAlbumFromTidalAlbumId(
        tidalAlbumId: number,
        signal?: AbortSignal,
    ): Promise<Api.Album>;
    getTidalAlbum(
        tidalAlbumId: number,
        signal?: AbortSignal,
    ): Promise<Api.TidalAlbum>;
    getTidalAlbumTracks(
        tidalAlbumId: number,
        signal?: AbortSignal,
    ): Promise<Api.PagingResponse<Api.TidalTrack>>;
    getTidalTrackFileUrl(
        tidalTrackId: number,
        audioQuality: 'HIGH',
        signal?: AbortSignal,
    ): Promise<string>;
}

async function getArtist(
    artistId: number,
    signal?: AbortSignal,
): Promise<Api.Artist> {
    const query = new QueryParams({
        artistId: `${artistId}`,
    });

    const response = await request(`${Api.apiUrl()}/artist?${query}`, {
        credentials: 'include',
        signal,
    });

    return await response.json();
}

function getAlbumArtwork(
    album: Album | Track | undefined,
    width: number,
    height: number,
): string {
    if (!album) return '/img/album.svg';

    const albumType = album.type;

    switch (albumType) {
        case 'LIBRARY':
            if (album.containsCover) {
                return Api.getPath(
                    `albums/${album.albumId}/${width}x${height}?source=${albumType}`,
                );
            }
            break;

        case 'TIDAL':
            if (album.containsCover) {
                if ('albumId' in album) {
                    return Api.getPath(
                        `albums/${album.albumId}/${width}x${height}?source=${albumType}`,
                    );
                } else if ('id' in album) {
                    return Api.getPath(
                        `albums/${album.id}/${width}x${height}?source=${albumType}`,
                    );
                }
            }
            break;

        default:
            albumType satisfies never;
    }

    return '/img/album.svg';
}

function getAlbumSourceArtwork(album: Album | Track | undefined): string {
    if (!album) return '/img/album.svg';

    const albumType = album.type;

    switch (albumType) {
        case 'LIBRARY':
            if (album.containsCover) {
                return Api.getPath(
                    `albums/${album.albumId}/source?source=${albumType}`,
                );
            }
            break;

        case 'TIDAL':
            if (album.containsCover) {
                if ('albumId' in album) {
                    return Api.getPath(
                        `albums/${album.albumId}/source?source=${albumType}`,
                    );
                } else if ('id' in album) {
                    return Api.getPath(
                        `albums/${album.id}/source?source=${albumType}`,
                    );
                }
            }
            break;

        default:
            albumType satisfies never;
    }

    return '/img/album.svg';
}

async function getArtistAlbums(
    artistId: number,
    signal?: AbortSignal,
): Promise<Api.Album[]> {
    const query = new QueryParams({
        artistId: `${artistId}`,
    });

    const response = await request(`${Api.apiUrl()}/artist/albums?${query}`, {
        credentials: 'include',
        signal,
    });

    return await response.json();
}

async function getAlbum(id: number, signal?: AbortSignal): Promise<Api.Album> {
    const query = new QueryParams({
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
    const query = new QueryParams();
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
    artist: Artist | Album | Track | undefined,
    width: number,
    height: number,
): string {
    if (!artist) return '/img/album.svg';

    const artistType = artist.type;

    switch (artistType) {
        case 'LIBRARY':
            if (artist.containsCover) {
                return Api.getPath(
                    `artists/${artist.artistId}/${width}x${height}?source=${artistType}`,
                );
            }
            break;

        case 'TIDAL':
            if (artist.containsCover) {
                if ('artistId' in artist) {
                    return Api.getPath(
                        `artists/${artist.artistId}/${width}x${height}?source=${artistType}`,
                    );
                } else if ('id' in artist) {
                    return Api.getPath(
                        `artists/${artist.id}/${width}x${height}?source=${artistType}`,
                    );
                }
            }
            break;

        default:
            artistType satisfies never;
    }

    return '/img/album.svg';
}

function getArtistSourceCover(
    artist: Artist | Album | Track | undefined,
): string {
    if (!artist) return '/img/album.svg';

    const artistType = artist.type;

    switch (artistType) {
        case 'LIBRARY':
            if (artist.containsCover) {
                return Api.getPath(
                    `artists/${artist.artistId}/source?source=${artistType}`,
                );
            }
            break;

        case 'TIDAL':
            if (artist.containsCover) {
                if ('artistId' in artist) {
                    return Api.getPath(
                        `artists/${artist.artistId}/source?source=${artistType}`,
                    );
                } else if ('id' in artist) {
                    return Api.getPath(
                        `artists/${artist.id}/source?source=${artistType}`,
                    );
                }
            }
            break;

        default:
            artistType satisfies never;
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

async function getAlbumVersions(
    albumId: number,
    signal?: AbortSignal,
): Promise<Api.AlbumVersion[]> {
    const response = await request(
        `${Api.apiUrl()}/album/versions?albumId=${albumId}`,
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
    const query = new QueryParams();
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

async function globalSearch(
    query: string,
    offset?: number,
    limit?: number,
    signal?: AbortSignal,
): Promise<{ position: number; results: Api.GlobalSearchResult[] }> {
    const queryParams = new QueryParams({
        query,
        offset: offset?.toString() ?? undefined,
        limit: limit?.toString() ?? undefined,
    });
    const response = await request(
        `${Api.apiUrl()}/search/global-search?${queryParams.toString()}`,
        {
            credentials: 'include',
            signal,
        },
    );

    return await response.json();
}

async function getArtistFromTidalArtistId(
    tidalArtistId: number,
    signal?: AbortSignal,
): Promise<Api.Artist> {
    const query = new QueryParams({
        tidalArtistId: `${tidalArtistId}`,
    });

    const response = await request(`${Api.apiUrl()}/artist?${query}`, {
        credentials: 'include',
        signal,
    });

    return await response.json();
}

async function getArtistFromTidalAlbumId(
    tidalAlbumId: number,
    signal?: AbortSignal,
): Promise<Api.Artist> {
    const query = new QueryParams({
        tidalAlbumId: `${tidalAlbumId}`,
    });

    const response = await request(`${Api.apiUrl()}/artist?${query}`, {
        credentials: 'include',
        signal,
    });

    return await response.json();
}

async function getTidalArtist(
    tidalArtistId: number,
    signal?: AbortSignal,
): Promise<Api.TidalArtist> {
    const query = new QueryParams({
        artistId: `${tidalArtistId}`,
    });

    const response = await request(`${Api.apiUrl()}/tidal/artists?${query}`, {
        credentials: 'include',
        signal,
    });

    return await response.json();
}

async function getTidalArtistAlbums(
    tidalArtistId: number,
    signal?: AbortSignal,
): Promise<Api.PagingResponse<Api.TidalAlbum>> {
    const query = new QueryParams({
        artistId: `${tidalArtistId}`,
    });

    const response = await request(
        `${Api.apiUrl()}/tidal/artists/albums?${query}`,
        {
            credentials: 'include',
            signal,
        },
    );

    return await response.json();
}

async function getAlbumFromTidalAlbumId(
    tidalAlbumId: number,
    signal?: AbortSignal,
): Promise<Api.Album> {
    const query = new QueryParams({
        tidalAlbumId: `${tidalAlbumId}`,
    });

    const response = await request(`${Api.apiUrl()}/album?${query}`, {
        credentials: 'include',
        signal,
    });

    return await response.json();
}

async function getTidalAlbum(
    tidalAlbumId: number,
    signal?: AbortSignal,
): Promise<Api.TidalAlbum> {
    const query = new QueryParams({
        albumId: `${tidalAlbumId}`,
    });

    const response = await request(`${Api.apiUrl()}/tidal/albums?${query}`, {
        credentials: 'include',
        signal,
    });

    return await response.json();
}

async function getTidalAlbumTracks(
    tidalAlbumId: number,
    signal?: AbortSignal,
): Promise<Api.PagingResponse<Api.TidalTrack>> {
    const query = new QueryParams({
        albumId: `${tidalAlbumId}`,
    });

    const response = await request(
        `${Api.apiUrl()}/tidal/albums/tracks?${query}`,
        {
            credentials: 'include',
            signal,
        },
    );

    return await response.json();
}

async function getTidalTrackFileUrl(
    tidalTrackId: number,
    audioQuality: 'HIGH',
    signal?: AbortSignal,
): Promise<string> {
    const query = new QueryParams({
        audioQuality,
        trackId: `${tidalTrackId}`,
    });

    const response = await request(`${Api.apiUrl()}/tidal/track/url?${query}`, {
        credentials: 'include',
        signal,
    });

    const { urls } = await response.json();

    return urls[0];
}

function request(
    url: string,
    options: Parameters<typeof fetch>[1],
): ReturnType<typeof fetch> {
    if (url[url.length - 1] === '?') url = url.substring(0, url.length - 1);

    const params = new QueryParams();
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
    getArtistSourceCover,
    getArtistAlbums,
    getAlbum,
    getAlbums,
    getAlbumArtwork,
    getAlbumSourceArtwork,
    getAlbumTracks,
    getAlbumVersions,
    getTracks,
    getArtists,
    fetchSignatureToken,
    refetchSignatureToken,
    validateSignatureTokenAndClient,
    validateSignatureToken,
    magicToken,
    globalSearch,
    getArtistFromTidalArtistId,
    getArtistFromTidalAlbumId,
    getAlbumFromTidalAlbumId,
    getTidalArtist,
    getTidalArtistAlbums,
    getTidalAlbum,
    getTidalAlbumTracks,
    getTidalTrackFileUrl,
};
