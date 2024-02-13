import { makePersisted } from '@solid-primitives/storage';
import { isServer } from 'solid-js/web';
import { Setter, createSignal } from 'solid-js';
import { QueryParams, createListener } from './util';

function getDefaultApiUrl(): string {
    if (isServer) return 'http://localhost:8000';

    return `${window.location.protocol}//${window.location.hostname}:8000`;
}

export type Artist = Api.Artist | Api.TidalArtist | Api.QobuzArtist;
export type ArtistType = Artist['type'];

export type Album = Api.Album | Api.TidalAlbum | Api.QobuzAlbum;
export type AlbumType = Album['type'];

export type Track = Api.Track | Api.TidalTrack | Api.QobuzTrack;
export type TrackType = Track['type'];

export type ApiSource = 'LIBRARY' | 'TIDAL' | 'QOBUZ';

type GenericTrack = Track;

export function trackId(track: Track | undefined): number | undefined {
    if (!track) return undefined;
    return 'trackId' in track
        ? track.trackId
        : 'id' in track
        ? track.id
        : undefined;
}

export function toSessionPlaylistTrack(
    track: Track,
): Api.UpdateSessionPlaylistTrack {
    if (track.type === 'LIBRARY') {
        return {
            id: track.trackId,
            type: track.type,
        };
    } else {
        return {
            id: track.id,
            type: track.type,
            data: JSON.stringify(track),
        };
    }
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
    export type GlobalSearchResult = (
        | GlobalArtistSearchResult
        | GlobalAlbumSearchResult
        | GlobalTrackSearchResult
    ) & { type: GlobalSearchResultType };

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
        qobuzId?: number;
        type: 'LIBRARY';
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
        tidalId?: number;
        qobuzId?: string;
        tidalArtistId?: number;
        qobuzArtistId?: number;
        type: 'LIBRARY';
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

    export interface UpdatePlaybackSession {
        sessionId: number;
        name?: string;
        active?: boolean;
        playing?: boolean;
        position?: number;
        seek?: number;
        volume?: number;
        activePlayers?: Player[];
        playlist?: UpdatePlaybackSessionPlaylist;
    }

    export interface UpdatePlaybackSessionPlaylist {
        sessionPlaylistId: number;
        tracks: UpdateSessionPlaylistTrack[];
    }

    export interface UpdateSessionPlaylistTrack {
        id: number;
        type: TrackType;
        data?: string;
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
        artistId?: number;
        tidalArtistId?: number;
        qobuzArtistId?: number;
        sources?: AlbumSource[];
        sort?: AlbumSort;
        filters?: AlbumFilters;
        offset?: number;
        limit?: number;
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

    export type QobuzPagingResponse<T> = {
        items: T[];
        hasMore: boolean;
    };

    type BasePagingResponse<T> = {
        items: T[];
        count: number;
        offset: number;
        limit: number;
    };

    export type PagingResponseWithTotal<T> = BasePagingResponse<T> & {
        total: number;
        hasMore: boolean;
    };

    export type PagingResponseWithHasMore<T> = BasePagingResponse<T> & {
        hasMore: boolean;
    };

    export type PagingResponse<T> =
        | PagingResponseWithTotal<T>
        | PagingResponseWithHasMore<T>;

    export interface TidalArtist {
        id: number;
        title: string;
        containsCover: boolean;
        blur: boolean;
        type: 'TIDAL';
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

    export type TidalAlbumType = 'LP' | 'EPS_AND_SINGLES' | 'COMPILATIONS';

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

    export interface QobuzArtist {
        id: number;
        title: string;
        containsCover: boolean;
        blur: boolean;
        type: 'QOBUZ';
    }

    export interface QobuzAlbum {
        id: string;
        title: string;
        artist: string;
        artistId: number;
        containsCover: boolean;
        dateReleased: string;
        numberOfTracks: number;
        blur: boolean;
        type: 'QOBUZ';
    }

    export type QobuzAlbumType = 'LP' | 'EPS_AND_SINGLES' | 'COMPILATIONS';

    export interface QobuzTrack {
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
        type: 'QOBUZ';
    }

    export type DownloadTaskState =
        | 'PENDING'
        | 'PAUSED'
        | 'CANCELLED'
        | 'STARTED'
        | 'ERROR'
        | 'FINISHED';

    export type DownloadItemType = 'TRACK' | 'ALBUM_COVER' | 'ARTIST_COVER';
    export type TrackDownloadItem = {
        type: 'TRACK';
        artistId: number;
        albumId: number;
        trackId: number;
        title: string;
        source: DownloadApiSource;
        quality: TrackAudioQuality;
        containsCover: boolean;
    };
    export type AlbumCoverDownloadItem = {
        type: 'ALBUM_COVER';
        artistId: number;
        artist: string;
        albumId: number;
        title: string;
        containsCover: boolean;
    };
    export type ArtistCoverDownloadItem = {
        type: 'ARTIST_COVER';
        artistId: number;
        albumId: number;
        title: string;
        containsCover: boolean;
    };
    export type DownloadItem =
        | TrackDownloadItem
        | AlbumCoverDownloadItem
        | ArtistCoverDownloadItem;

    export type TrackAudioQuality =
        | 'LOW'
        | 'FLAC_LOSSLESS'
        | 'FLAC_HI_RES'
        | 'FLAC_HIGHEST_RES';

    export type DownloadApiSource = Omit<ApiSource, 'LIBRARY'>;

    export interface DownloadTask {
        id: number;
        state: DownloadTaskState;
        item: DownloadItem;
        filePath: string;
        progress: number;
        bytes: number;
        totalBytes: number;
        speed?: number;
    }
}

export interface ApiType {
    getArtist(artistId: number, signal?: AbortSignal): Promise<Api.Artist>;
    getArtistCover(
        artist: Artist | Album | Track | undefined,
        width: number,
        height: number,
    ): string;
    getArtistSourceCover(artist: Artist | Album | Track | undefined): string;
    getAlbum(id: number, signal?: AbortSignal): Promise<Api.Album>;
    getAlbums(
        request: Api.AlbumsRequest | undefined,
        signal?: AbortSignal,
    ): Promise<Api.PagingResponseWithTotal<Api.Album>>;
    getAllAlbums(
        request: Api.AlbumsRequest | undefined,
        onAlbums?: (
            albums: Api.Album[],
            allAlbums: Api.Album[],
            index: number,
        ) => void,
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
    ): Promise<{ valid?: boolean; notFound?: boolean }>;
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
    getArtistFromQobuzArtistId(
        qobuzArtistId: number,
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
    getQobuzArtist(
        qobuzArtistId: number,
        signal?: AbortSignal,
    ): Promise<Api.QobuzArtist>;
    getAllTidalArtistAlbums(
        tidalArtistId: number,
        setter?: Setter<Api.TidalAlbum[] | undefined>,
        types?: Api.TidalAlbumType[],
        signal?: AbortSignal,
    ): Promise<{
        lps: Api.TidalAlbum[];
        epsAndSingles: Api.TidalAlbum[];
        compilations: Api.TidalAlbum[];
    }>;
    getAllQobuzArtistAlbums(
        qobuzArtistId: number,
        setter?: Setter<Api.QobuzAlbum[] | undefined>,
        types?: Api.QobuzAlbumType[],
        signal?: AbortSignal,
    ): Promise<{
        lps: Api.QobuzAlbum[];
        epsAndSingles: Api.QobuzAlbum[];
        compilations: Api.QobuzAlbum[];
    }>;
    getTidalArtistAlbums(
        tidalArtistId: number,
        albumType?: Api.TidalAlbumType,
        signal?: AbortSignal,
    ): Promise<Api.PagingResponse<Api.TidalAlbum>>;
    getQobuzArtistAlbums(
        qobuzArtistId: number,
        albumType?: Api.QobuzAlbumType,
        signal?: AbortSignal,
    ): Promise<Api.QobuzPagingResponse<Api.QobuzAlbum>>;
    getAlbumFromTidalAlbumId(
        tidalAlbumId: number,
        signal?: AbortSignal,
    ): Promise<Api.Album>;
    getAlbumFromQobuzAlbumId(
        qobuzAlbumId: string,
        signal?: AbortSignal,
    ): Promise<Api.Album>;
    getLibraryAlbumsFromTidalArtistId(
        tidalArtistId: number,
        signal?: AbortSignal,
    ): Promise<Api.Album[]>;
    getLibraryAlbumsFromQobuzArtistId(
        qobuzArtistId: number,
        signal?: AbortSignal,
    ): Promise<Api.Album[]>;
    getTidalAlbum(
        tidalAlbumId: number,
        signal?: AbortSignal,
    ): Promise<Api.TidalAlbum>;
    getQobuzAlbum(
        qobuzAlbumId: string,
        signal?: AbortSignal,
    ): Promise<Api.QobuzAlbum>;
    getTidalAlbumTracks(
        tidalAlbumId: number,
        signal?: AbortSignal,
    ): Promise<Api.PagingResponse<Api.TidalTrack>>;
    getQobuzAlbumTracks(
        qobuzAlbumId: string,
        signal?: AbortSignal,
    ): Promise<Api.PagingResponse<Api.QobuzTrack>>;
    getTidalTrack(
        tidalTrackId: number,
        signal?: AbortSignal,
    ): Promise<Api.TidalTrack>;
    getTidalTrackFileUrl(
        tidalTrackId: number,
        audioQuality: 'HIGH',
        signal?: AbortSignal,
    ): Promise<string>;
    getQobuzTrackFileUrl(
        qobuzTrackId: number,
        audioQuality: 'LOW',
        signal?: AbortSignal,
    ): Promise<string>;
    addAlbumToLibrary(
        albumId: {
            tidalAlbumId?: number;
            qobuzAlbumId?: string;
        },
        signal?: AbortSignal,
    ): Promise<void>;
    removeAlbumFromLibrary(
        albumId: {
            tidalAlbumId?: number;
            qobuzAlbumId?: string;
        },
        signal?: AbortSignal,
    ): Promise<Api.Album>;
    refavoriteAlbum(
        albumId: {
            tidalAlbumId?: number;
            qobuzAlbumId?: string;
        },
        signal?: AbortSignal,
    ): Promise<Api.Album>;
    download(
        items: {
            trackId?: number;
            trackIds?: number[];
            albumId?: number;
            albumIds?: number[];
        },
        source: Api.DownloadApiSource,
        signal?: AbortSignal,
    ): Promise<void>;
    getDownloadTasks(
        signal?: AbortSignal,
    ): Promise<Api.PagingResponseWithTotal<Api.DownloadTask>>;
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
    const query = new QueryParams({
        source: albumType,
        artistId: album.artistId?.toString(),
    });

    switch (albumType) {
        case 'LIBRARY':
            if (album.containsCover) {
                return Api.getPath(
                    `albums/${album.albumId}/${width}x${height}?${query}`,
                );
            }
            break;

        case 'TIDAL':
            if (album.containsCover) {
                if ('albumId' in album) {
                    return Api.getPath(
                        `albums/${album.albumId}/${width}x${height}?${query}`,
                    );
                } else if ('id' in album) {
                    return Api.getPath(
                        `albums/${album.id}/${width}x${height}?${query}`,
                    );
                }
            }
            break;

        case 'QOBUZ':
            if (album.containsCover) {
                if ('albumId' in album) {
                    return Api.getPath(
                        `albums/${album.albumId}/${width}x${height}?${query}`,
                    );
                } else if ('id' in album) {
                    return Api.getPath(
                        `albums/${album.id}/${width}x${height}?${query}`,
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
    const query = new QueryParams({
        source: albumType,
        artistId: album.artistId.toString(),
    });

    switch (albumType) {
        case 'LIBRARY':
            if (album.containsCover) {
                return Api.getPath(`albums/${album.albumId}/source?${query}`);
            }
            break;

        case 'TIDAL':
            if (album.containsCover) {
                if ('albumId' in album) {
                    return Api.getPath(
                        `albums/${album.albumId}/source?${query}`,
                    );
                } else if ('id' in album) {
                    return Api.getPath(`albums/${album.id}/source?${query}`);
                }
            }
            break;

        case 'QOBUZ':
            if (album.containsCover) {
                if ('albumId' in album) {
                    return Api.getPath(
                        `albums/${album.albumId}/source?${query}`,
                    );
                } else if ('id' in album) {
                    return Api.getPath(`albums/${album.id}/source?${query}`);
                }
            }
            break;

        default:
            albumType satisfies never;
    }

    return '/img/album.svg';
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
): Promise<Api.PagingResponseWithTotal<Api.Album>> {
    const query = new QueryParams({
        artistId: albumsRequest?.artistId?.toString(),
        tidalArtistId: albumsRequest?.tidalArtistId?.toString(),
        qobuzArtistId: albumsRequest?.qobuzArtistId?.toString(),
        offset: `${albumsRequest?.offset ?? 0}`,
        limit: `${albumsRequest?.limit ?? 100}`,
    });
    if (albumsRequest?.sources)
        query.set('sources', albumsRequest.sources.join(','));
    if (albumsRequest?.sort) query.set('sort', albumsRequest.sort);
    if (albumsRequest?.filters?.search)
        query.set('search', albumsRequest.filters.search);

    const response = await request(`${Api.apiUrl()}/albums?${query}`, {
        credentials: 'include',
        signal,
    });

    const albums: Api.PagingResponseWithTotal<Api.Album> =
        await response.json();

    return albums;
}

async function getAllAlbums(
    albumsRequest: Api.AlbumsRequest | undefined = undefined,
    onAlbums?: (
        albums: Api.Album[],
        allAlbums: Api.Album[],
        index: number,
    ) => void,
    signal?: AbortSignal,
): Promise<Api.Album[]> {
    let offset = albumsRequest?.offset ?? 0;
    let limit = albumsRequest?.limit ?? 100;

    albumsRequest = albumsRequest ?? { offset, limit };

    const page = await getAlbums(albumsRequest, signal);

    let items = page.items;

    onAlbums?.(page.items, items, 0);

    if (signal?.aborted || !page.hasMore) return items;

    offset = limit;
    limit = Math.min(Math.max(100, ~~((page.total - limit) / 6)), 1000);

    const requests = [];

    do {
        requests.push({ ...albumsRequest, offset, limit });
        offset += limit;
    } while (offset < page.total);

    const output = [items, ...requests.map(() => [])];

    await Promise.all(
        requests.map(async (request, i) => {
            const page = await getAlbums(request, signal);

            output[i + 1] = page.items;

            items = output.flat();

            onAlbums?.(page.items, items, i + 1);

            return page;
        }),
    );

    return items;
}

function getArtistCover(
    artist: Artist | Album | Track | undefined,
    width: number,
    height: number,
): string {
    if (!artist) return '/img/album.svg';

    const artistType = artist.type;
    const query = new QueryParams({
        source: artistType,
    });

    switch (artistType) {
        case 'LIBRARY':
            if (artist.containsCover) {
                return Api.getPath(
                    `artists/${artist.artistId}/${width}x${height}?${query}`,
                );
            }
            break;

        case 'TIDAL':
            if (artist.containsCover) {
                if ('artistId' in artist) {
                    return Api.getPath(
                        `artists/${artist.artistId}/${width}x${height}?${query}`,
                    );
                } else if ('id' in artist) {
                    return Api.getPath(
                        `artists/${artist.id}/${width}x${height}?${query}`,
                    );
                }
            }
            break;

        case 'QOBUZ':
            if (artist.containsCover) {
                if ('artistId' in artist) {
                    return Api.getPath(
                        `artists/${artist.artistId}/${width}x${height}?${query}`,
                    );
                } else if ('id' in artist) {
                    return Api.getPath(
                        `artists/${artist.id}/${width}x${height}?${query}`,
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
    const query = new QueryParams({
        source: artistType,
    });

    switch (artistType) {
        case 'LIBRARY':
            if (artist.containsCover) {
                return Api.getPath(
                    `artists/${artist.artistId}/source?${query}`,
                );
            }
            break;

        case 'TIDAL':
            if (artist.containsCover) {
                if ('artistId' in artist) {
                    return Api.getPath(
                        `artists/${artist.artistId}/source?${query}`,
                    );
                } else if ('id' in artist) {
                    return Api.getPath(`artists/${artist.id}/source?${query}`);
                }
            }
            break;

        case 'QOBUZ':
            if (artist.containsCover) {
                if ('artistId' in artist) {
                    return Api.getPath(
                        `artists/${artist.artistId}/source?${query}`,
                    );
                } else if ('id' in artist) {
                    return Api.getPath(`artists/${artist.id}/source?${query}`);
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

const [nonTunnelApis, setNonTunnelApis] = makePersisted(
    createSignal<string[]>([]),
    {
        name: 'nonTunnelApis',
    },
);

async function validateSignatureTokenAndClient(
    signature: string,
    signal?: AbortSignal,
): Promise<{ valid?: boolean; notFound?: boolean }> {
    const apis = nonTunnelApis();

    if (apis.includes(Api.apiUrl())) {
        return { notFound: true };
    }

    try {
        const response = await request(
            `${Api.apiUrl()}/auth/validate-signature-token?signature=${signature}`,
            {
                credentials: 'include',
                method: 'POST',
                signal,
            },
        );

        if (response.status === 404) {
            setNonTunnelApis([...apis, Api.apiUrl()]);
            return { notFound: true };
        }

        const payload = await response.json();

        return { valid: payload.valid };
    } catch {
        return { valid: false };
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

    const { valid, notFound } =
        await api.validateSignatureTokenAndClient(existing);

    if (notFound) {
        console.debug('Not hitting tunnel server');
        return;
    }

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

async function getArtistFromQobuzArtistId(
    qobuzArtistId: number,
    signal?: AbortSignal,
): Promise<Api.Artist> {
    const query = new QueryParams({
        qobuzArtistId: `${qobuzArtistId}`,
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

async function getQobuzArtist(
    qobuzArtistId: number,
    signal?: AbortSignal,
): Promise<Api.QobuzArtist> {
    const query = new QueryParams({
        artistId: `${qobuzArtistId}`,
    });

    const response = await request(`${Api.apiUrl()}/qobuz/artists?${query}`, {
        credentials: 'include',
        signal,
    });

    return await response.json();
}

export function sortAlbumsByDateDesc<T extends Album>(albums: T[]): T[] {
    return albums.toSorted((a, b) => {
        if (!a.dateReleased) return 1;
        if (!b.dateReleased) return -1;

        return b.dateReleased.localeCompare(a.dateReleased);
    });
}

async function getAllTidalArtistAlbums(
    tidalArtistId: number,
    setter?: Setter<Api.TidalAlbum[] | undefined>,
    types?: Api.TidalAlbumType[],
    signal?: AbortSignal,
): Promise<{
    lps: Api.TidalAlbum[];
    epsAndSingles: Api.TidalAlbum[];
    compilations: Api.TidalAlbum[];
}> {
    const albums: Awaited<ReturnType<typeof getAllTidalArtistAlbums>> = {
        lps: [],
        epsAndSingles: [],
        compilations: [],
    };

    const promises = [];

    if (!types || types.find((t) => t === 'LP')) {
        promises.push(
            (async () => {
                const page = await api.getTidalArtistAlbums(
                    tidalArtistId,
                    'LP',
                    signal,
                );

                albums.lps = page.items;

                if (setter) {
                    const { lps, epsAndSingles, compilations } = albums;
                    setter(
                        sortAlbumsByDateDesc([
                            ...lps,
                            ...epsAndSingles,
                            ...compilations,
                        ]),
                    );
                }
            })(),
        );
    }
    if (!types || types.find((t) => t === 'EPS_AND_SINGLES')) {
        promises.push(
            (async () => {
                const page = await api.getTidalArtistAlbums(
                    tidalArtistId,
                    'EPS_AND_SINGLES',
                    signal,
                );

                if (setter) {
                    albums.epsAndSingles = page.items;

                    const { lps, epsAndSingles, compilations } = albums;
                    setter(
                        sortAlbumsByDateDesc([
                            ...lps,
                            ...epsAndSingles,
                            ...compilations,
                        ]),
                    );
                }
            })(),
        );
    }
    if (!types || types.find((t) => t === 'COMPILATIONS')) {
        promises.push(
            (async () => {
                const page = await api.getTidalArtistAlbums(
                    tidalArtistId,
                    'COMPILATIONS',
                    signal,
                );

                if (setter) {
                    albums.compilations = page.items;

                    const { lps, epsAndSingles, compilations } = albums;
                    setter(
                        sortAlbumsByDateDesc([
                            ...lps,
                            ...epsAndSingles,
                            ...compilations,
                        ]),
                    );
                }
            })(),
        );
    }

    await Promise.all(promises);

    return albums;
}

async function getAllQobuzArtistAlbums(
    qobuzArtistId: number,
    setter?: Setter<Api.QobuzAlbum[] | undefined>,
    types?: Api.QobuzAlbumType[],
    signal?: AbortSignal,
): Promise<{
    lps: Api.QobuzAlbum[];
    epsAndSingles: Api.QobuzAlbum[];
    compilations: Api.QobuzAlbum[];
}> {
    const albums: Awaited<ReturnType<typeof getAllQobuzArtistAlbums>> = {
        lps: [],
        epsAndSingles: [],
        compilations: [],
    };

    const promises = [];

    if (!types || types.find((t) => t === 'LP')) {
        promises.push(
            (async () => {
                const page = await api.getQobuzArtistAlbums(
                    qobuzArtistId,
                    'LP',
                    signal,
                );

                albums.lps = page.items;

                if (setter) {
                    const { lps, epsAndSingles, compilations } = albums;
                    setter(
                        sortAlbumsByDateDesc([
                            ...lps,
                            ...epsAndSingles,
                            ...compilations,
                        ]),
                    );
                }
            })(),
        );
    }
    if (!types || types.find((t) => t === 'EPS_AND_SINGLES')) {
        promises.push(
            (async () => {
                const page = await api.getQobuzArtistAlbums(
                    qobuzArtistId,
                    'EPS_AND_SINGLES',
                    signal,
                );

                if (setter) {
                    albums.epsAndSingles = page.items;

                    const { lps, epsAndSingles, compilations } = albums;
                    setter(
                        sortAlbumsByDateDesc([
                            ...lps,
                            ...epsAndSingles,
                            ...compilations,
                        ]),
                    );
                }
            })(),
        );
    }
    if (!types || types.find((t) => t === 'COMPILATIONS')) {
        promises.push(
            (async () => {
                const page = await api.getQobuzArtistAlbums(
                    qobuzArtistId,
                    'COMPILATIONS',
                    signal,
                );

                if (setter) {
                    albums.compilations = page.items;

                    const { lps, epsAndSingles, compilations } = albums;
                    setter(
                        sortAlbumsByDateDesc([
                            ...lps,
                            ...epsAndSingles,
                            ...compilations,
                        ]),
                    );
                }
            })(),
        );
    }

    await Promise.all(promises);

    return albums;
}

async function getTidalArtistAlbums(
    tidalArtistId: number,
    albumType?: Api.TidalAlbumType,
    signal?: AbortSignal,
): Promise<Api.PagingResponse<Api.TidalAlbum>> {
    const query = new QueryParams({
        artistId: `${tidalArtistId}`,
    });

    if (albumType) {
        query.set('albumType', albumType);
    }

    const response = await request(
        `${Api.apiUrl()}/tidal/artists/albums?${query}`,
        {
            credentials: 'include',
            signal,
        },
    );

    return await response.json();
}

async function getQobuzArtistAlbums(
    qobuzArtistId: number,
    albumType?: Api.QobuzAlbumType,
    signal?: AbortSignal,
): Promise<Api.QobuzPagingResponse<Api.QobuzAlbum>> {
    const query = new QueryParams({
        artistId: `${qobuzArtistId}`,
    });

    if (albumType) {
        query.set('releaseType', albumType);
    }

    const response = await request(
        `${Api.apiUrl()}/qobuz/artists/albums?${query}`,
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

async function getAlbumFromQobuzAlbumId(
    qobuzAlbumId: string,
    signal?: AbortSignal,
): Promise<Api.Album> {
    const query = new QueryParams({
        qobuzAlbumId: `${qobuzAlbumId}`,
    });

    const response = await request(`${Api.apiUrl()}/album?${query}`, {
        credentials: 'include',
        signal,
    });

    return await response.json();
}

async function getLibraryAlbumsFromTidalArtistId(
    tidalArtistId: number,
    signal?: AbortSignal,
): Promise<Api.Album[]> {
    const query = new QueryParams({
        tidalArtistId: `${tidalArtistId}`,
    });

    const response = await request(`${Api.apiUrl()}/albums?${query}`, {
        credentials: 'include',
        signal,
    });

    return await response.json();
}

async function getLibraryAlbumsFromQobuzArtistId(
    qobuzArtistId: number,
    signal?: AbortSignal,
): Promise<Api.Album[]> {
    const query = new QueryParams({
        qobuzArtistId: `${qobuzArtistId}`,
    });

    const response = await request(`${Api.apiUrl()}/albums?${query}`, {
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

async function getQobuzAlbum(
    qobuzAlbumId: string,
    signal?: AbortSignal,
): Promise<Api.QobuzAlbum> {
    const query = new QueryParams({
        albumId: `${qobuzAlbumId}`,
    });

    const response = await request(`${Api.apiUrl()}/qobuz/albums?${query}`, {
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

async function getQobuzAlbumTracks(
    qobuzAlbumId: string,
    signal?: AbortSignal,
): Promise<Api.PagingResponse<Api.QobuzTrack>> {
    const query = new QueryParams({
        albumId: `${qobuzAlbumId}`,
    });

    const response = await request(
        `${Api.apiUrl()}/qobuz/albums/tracks?${query}`,
        {
            credentials: 'include',
            signal,
        },
    );

    return await response.json();
}

async function getTidalTrack(
    tidalTrackId: number,
    signal?: AbortSignal,
): Promise<Api.TidalTrack> {
    const query = new QueryParams({
        trackId: `${tidalTrackId}`,
    });

    const response = await request(`${Api.apiUrl()}/tidal/track?${query}`, {
        credentials: 'include',
        signal,
    });

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

async function getQobuzTrackFileUrl(
    qobuzTrackId: number,
    audioQuality: 'LOW',
    signal?: AbortSignal,
): Promise<string> {
    const query = new QueryParams({
        audioQuality,
        trackId: `${qobuzTrackId}`,
    });

    const response = await request(`${Api.apiUrl()}/qobuz/track/url?${query}`, {
        credentials: 'include',
        signal,
    });

    const { url } = await response.json();

    return url;
}

async function addAlbumToLibrary(
    albumId: {
        tidalAlbumId?: number;
        qobuzAlbumId?: string;
    },
    signal?: AbortSignal,
): Promise<void> {
    const query = new QueryParams({
        albumId: albumId.tidalAlbumId?.toString() ?? albumId.qobuzAlbumId,
        source: albumId.tidalAlbumId
            ? 'TIDAL'
            : albumId.qobuzAlbumId
            ? 'QOBUZ'
            : undefined,
    });

    const response = await request(`${Api.apiUrl()}/album?${query}`, {
        method: 'POST',
        credentials: 'include',
        signal,
    });

    return await response.json();
}

async function removeAlbumFromLibrary(
    albumId: {
        tidalAlbumId?: number;
        qobuzAlbumId?: string;
    },
    signal?: AbortSignal,
): Promise<Api.Album> {
    const query = new QueryParams({
        albumId: albumId.tidalAlbumId?.toString() ?? albumId.qobuzAlbumId,
        source: albumId.tidalAlbumId
            ? 'TIDAL'
            : albumId.qobuzAlbumId
            ? 'QOBUZ'
            : undefined,
    });

    const response = await request(`${Api.apiUrl()}/album?${query}`, {
        method: 'DELETE',
        credentials: 'include',
        signal,
    });

    return await response.json();
}

async function refavoriteAlbum(
    albumId: {
        tidalAlbumId?: number;
        qobuzAlbumId?: string;
    },
    signal?: AbortSignal,
): Promise<Api.Album> {
    const query = new QueryParams({
        albumId: albumId.tidalAlbumId?.toString() ?? albumId.qobuzAlbumId,
        source: albumId.tidalAlbumId
            ? 'TIDAL'
            : albumId.qobuzAlbumId
            ? 'QOBUZ'
            : undefined,
    });

    const response = await request(
        `${Api.apiUrl()}/album/re-favorite?${query}`,
        {
            method: 'POST',
            credentials: 'include',
            signal,
        },
    );

    return await response.json();
}

async function download(
    items: {
        trackId?: number;
        trackIds?: number[];
        albumId?: number;
        albumIds?: number[];
    },
    source: Api.DownloadApiSource,
    signal?: AbortSignal,
): Promise<void> {
    const query = new QueryParams({
        trackId: items.trackId ? `${items.trackId}` : undefined,
        trackIds: items.trackIds ? `${items.trackIds.join(',')}` : undefined,
        albumId: items.albumId ? `${items.albumId}` : undefined,
        albumIds: items.albumIds ? `${items.albumIds.join(',')}` : undefined,
        source: `${source}`,
    });

    const response = await request(`${Api.apiUrl()}/download?${query}`, {
        method: 'POST',
        credentials: 'include',
        signal,
    });

    return await response.json();
}

async function getDownloadTasks(
    signal?: AbortSignal,
): Promise<Api.PagingResponseWithTotal<Api.DownloadTask>> {
    const response = await request(`${Api.apiUrl()}/download-tasks`, {
        credentials: 'include',
        signal,
    });

    return await response.json();
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
    getAlbum,
    getAlbums,
    getAllAlbums,
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
    getArtistFromQobuzArtistId,
    getArtistFromTidalAlbumId,
    getAlbumFromTidalAlbumId,
    getAlbumFromQobuzAlbumId,
    getTidalArtist,
    getQobuzArtist,
    getAllTidalArtistAlbums,
    getAllQobuzArtistAlbums,
    getTidalArtistAlbums,
    getQobuzArtistAlbums,
    getLibraryAlbumsFromTidalArtistId,
    getLibraryAlbumsFromQobuzArtistId,
    getTidalAlbum,
    getQobuzAlbum,
    getTidalAlbumTracks,
    getQobuzAlbumTracks,
    getTidalTrack,
    getTidalTrackFileUrl,
    getQobuzTrackFileUrl,
    addAlbumToLibrary,
    removeAlbumFromLibrary,
    refavoriteAlbum,
    getDownloadTasks,
    download,
};
