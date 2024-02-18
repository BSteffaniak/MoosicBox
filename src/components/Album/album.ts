import { Api } from '~/services/api';
import type { Album, Track, AlbumType } from '~/services/api';

function getAlbumTitleDisplay(props: AlbumProps): string {
    const albumType = props.album.type;

    switch (albumType) {
        case 'LIBRARY':
            return props.album.title;
        case 'TIDAL': {
            let title = props.album.title;

            if (props.album.mediaMetadataTags?.includes('DOLBY_ATMOS')) {
                title += ' (Dolby Atmos)';
            }

            return title;
        }
        case 'QOBUZ':
            return props.album.title;
        default:
            albumType satisfies never;
            throw new Error(`Invalid albumType: ${albumType}`);
    }
}

function isExplicit(props: AlbumProps): boolean {
    const albumType = props.album.type;

    switch (albumType) {
        case 'LIBRARY':
            return false;
        case 'TIDAL':
            return props.album.explicit;
        case 'QOBUZ':
            return props.album.parentalWarning;
        default:
            albumType satisfies never;
            throw new Error(`Invalid albumType: ${albumType}`);
    }
}

const wordsCache: { [str: string]: string[] } = {};

function getWords(str: string) {
    const words = wordsCache[str] ?? str.split(' ');

    wordsCache[str] = words;

    return words;
}

function allButLastWord(str: string): string {
    const words = getWords(str);
    return words.slice(0, words.length - 1).join(' ');
}

function lastWord(str: string): string {
    const words = getWords(str);
    return words[words.length - 1]!;
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
    props.year = props.year ?? false;
    props.versionQualities = props.versionQualities ?? false;

    props.blur =
        typeof props.blur === 'boolean'
            ? props.blur
            : 'blur' in props.album && props.album.blur;

    const fullProps = props as AlbumProps;
}

class MoosicBoxAlbum extends HTMLElement {
    constructor() {
        super();
    }
}

customElements.define('moosicbox-album', MoosicBoxAlbum);
