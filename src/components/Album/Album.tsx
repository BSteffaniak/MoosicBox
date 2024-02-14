import './album.css';
import {
    type Album,
    type AlbumType,
    Api,
    type Track,
    api,
} from '~/services/api';
import { addAlbumToQueue, playAlbum } from '~/services/player';
import { createComputed, createSignal } from 'solid-js';
import { displayAlbumVersionQualities } from '~/services/formatting';
import { artistRoute } from '../Artist/Artist';

function albumControls(album: Album | Track) {
    return (
        <div class="album-controls">
            <button
                class="media-button play-button button"
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    playAlbum(album);
                    return false;
                }}
            >
                <img src="/img/play-button.svg" alt="Play" />
            </button>
            <button
                class="media-button options-button button"
                onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    addAlbumToQueue(album);
                    return false;
                }}
            >
                <img src="/img/more-options.svg" alt="Play" />
            </button>
        </div>
    );
}

function albumDetails(
    album: Album | Track,
    showArtist = true,
    showTitle = true,
    showYear = true,
    showVersionQualities = true,
    route = true,
) {
    return (
        <div class="album-details">
            {showTitle && (
                <div class="album-title">
                    {route ? (
                        <a href={albumRoute(album)} class="album-title-text">
                            {album.title}
                        </a>
                    ) : (
                        <span class="album-title-text">{album.title}</span>
                    )}
                </div>
            )}
            {showArtist && (
                <div class="album-artist">
                    <a href={artistRoute(album)} class="album-artist-text">
                        {album.artist}
                    </a>
                </div>
            )}
            {showYear && 'dateReleased' in album && (
                <div class="album-year">
                    <span class="album-year-text">
                        {album.dateReleased?.substring(0, 4)}
                    </span>
                </div>
            )}
            {'versions' in album && showVersionQualities && (
                <div class="album-version-qualities">
                    <span class="album-version-qualities-text">
                        {album.versions.length > 0 &&
                            displayAlbumVersionQualities(album.versions)}
                    </span>
                </div>
            )}
        </div>
    );
}

export function albumRoute(
    album:
        | Album
        | Track
        | { id: number | string; type: AlbumType }
        | { albumId: number | string; type: AlbumType },
): string {
    const albumType = album.type;

    switch (albumType) {
        case 'LIBRARY':
            if ('albumId' in album) {
                return `/albums?albumId=${
                    (album as { albumId: number | string }).albumId
                }`;
            } else if ('id' in album) {
                return `/albums?albumId=${
                    (album as { id: number | string }).id
                }`;
            } else {
                throw new Error(`Invalid album: ${album}`);
            }
        case 'TIDAL':
            if ('number' in album) {
                return `/albums?tidalAlbumId=${
                    (album as Api.TidalTrack).albumId
                }`;
            } else {
                return `/albums?tidalAlbumId=${
                    (album as { id: number | string }).id
                }`;
            }
        case 'QOBUZ':
            if ('number' in album) {
                return `/albums?qobuzAlbumId=${
                    (album as Api.QobuzTrack).albumId
                }`;
            } else {
                return `/albums?qobuzAlbumId=${
                    (album as { id: number | string }).id
                }`;
            }
        default:
            albumType satisfies never;
            throw new Error(`Invalid albumType: ${albumType}`);
    }
}

function albumImage(props: AlbumProps, blur: boolean) {
    return (
        <img
            class="album-icon"
            style={{
                width: `${props.size}px`,
                height: `${props.size}px`,
                'image-rendering': blur ? 'pixelated' : undefined,
                cursor: props.onClick ? `pointer` : undefined,
            }}
            src={api.getAlbumArtwork(
                props.album,
                blur ? 16 : props.imageRequestSize,
                blur ? 16 : props.imageRequestSize,
            )}
            alt={`${props.album.title} by ${props.album.artist}`}
            title={`${props.album.title} by ${props.album.artist}`}
            loading="lazy"
            onClick={props.onClick ?? (() => {})}
        />
    );
}

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

type AlbumProps = {
    album: Album | Track;
    controls?: boolean;
    size: number;
    imageRequestSize: number;
    artist: boolean;
    year: boolean;
    title: boolean;
    versionQualities: boolean;
    blur: boolean;
    route: boolean;
    onClick?: (e: MouseEvent) => void;
};

export default function album(
    props: PartialBy<
        AlbumProps,
        | 'size'
        | 'imageRequestSize'
        | 'artist'
        | 'title'
        | 'blur'
        | 'route'
        | 'year'
        | 'versionQualities'
    >,
) {
    props.size = props.size ?? 200;
    props.imageRequestSize =
        props.imageRequestSize ??
        Math.ceil(Math.round(Math.max(200, props.size) * 1.33) / 20) * 20;
    props.artist = props.artist ?? false;
    props.title = props.title ?? false;
    props.route = props.route ?? true;
    props.versionQualities = props.versionQualities ?? false;

    const [blur, setBlur] = createSignal(false);

    createComputed(() => {
        setBlur(
            typeof props.blur === 'boolean'
                ? props.blur
                : 'blur' in props.album && props.album.blur,
        );
    });

    return (
        <div class="album">
            <div
                class="album-icon-container"
                style={{ width: `${props.size}px`, height: `${props.size}px` }}
            >
                {props.route ? (
                    <a href={albumRoute(props.album)}>
                        {albumImage(props as AlbumProps, blur())}
                        {props.controls && albumControls(props.album)}
                    </a>
                ) : (
                    <>
                        {albumImage(props as AlbumProps, blur())}
                        {props.controls && albumControls(props.album)}
                    </>
                )}
            </div>
            {(props.artist || props.title) &&
                albumDetails(
                    props.album,
                    props.artist,
                    props.title,
                    props.year,
                    props.versionQualities,
                    props.route,
                )}
        </div>
    );
}
