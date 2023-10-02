import './artist.css';
import { Api, api } from '~/services/api';
import { createComputed, createSignal } from 'solid-js';
import { A } from 'solid-start';

function artistDetails(artist: Api.Artist, showTitle = true) {
    return (
        <div class="artist-details">
            {showTitle && (
                <div class="artist-title">
                    <span class="artist-title-text">{artist.title}</span>
                </div>
            )}
        </div>
    );
}

function artistImage(props: ArtistProps, blur: boolean) {
    return (
        <img
            class="artist-icon"
            style={{
                width: `${props.size}px`,
                height: `${props.size}px`,
                filter: blur ? `blur(${props.size / 20}px)` : undefined,
                cursor: props.onClick ? `pointer` : undefined,
            }}
            src={api.getArtistCover(props.artist)}
            alt={`${props.artist.title}`}
            title={`${props.artist.title}`}
            loading="lazy"
            onClick={props.onClick}
        />
    );
}

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

type ArtistProps = {
    artist: Api.Artist;
    size: number;
    title: boolean;
    blur: boolean;
    route: boolean;
    onClick?: (e: MouseEvent) => void;
};

export default function artist(
    props: PartialBy<ArtistProps, 'size' | 'title' | 'blur' | 'route'>,
) {
    props.size = props.size ?? 200;
    props.title = props.title ?? false;
    props.route = props.route ?? true;

    const [blur, setBlur] = createSignal(false);

    createComputed(() => {
        setBlur(
            typeof props.blur === 'boolean' ? props.blur : props.artist.blur,
        );
    });

    return (
        <div class="artist">
            <div
                class="artist-icon-container"
                style={{ width: `${props.size}px`, height: `${props.size}px` }}
            >
                {props.route ? (
                    <A href={`/artists/${props.artist.artistId}`}>
                        {artistImage(props as ArtistProps, blur())}
                    </A>
                ) : (
                    artistImage(props as ArtistProps, blur())
                )}
            </div>
            {(props.artist || props.title) &&
                artistDetails(props.artist, props.title)}
        </div>
    );
}
