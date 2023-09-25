import { A } from '@solidjs/router';
import './album.css';
import * as api from '~/services/api';
import { addAlbumToQueue, playAlbum } from '~/services/player';

function albumControls(album: api.Album) {
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

function albumDetails(album: api.Album, showArtist = true, showTitle = true) {
    return (
        <div class="album-details">
            {showTitle && (
                <div class="album-title">
                    <span class="album-title-text">{album.title}</span>
                </div>
            )}
            {showArtist && (
                <div class="album-artist">
                    <span class="album-artist-text">{album.artist}</span>
                </div>
            )}
        </div>
    );
}

export default function Album(props: {
    album: api.Album;
    controls?: boolean;
    size?: number;
    artist?: boolean;
    title?: boolean;
    blur?: boolean;
}) {
    props.size = props.size ?? 200;
    props.artist = props.artist ?? true;
    props.title = props.title ?? true;
    props.blur = props.blur ?? false;

    return (
        <div class="album">
            <div
                class="album-icon-container"
                style={{ width: `${props.size}px`, height: `${props.size}px` }}
            >
                <A href={`/albums/${props.album.albumId}`}>
                    <img
                        class="album-icon"
                        style={{
                            width: `${props.size}px`,
                            height: `${props.size}px`,
                            filter: props.blur
                                ? `blur(${props.size / 20}px)`
                                : undefined,
                        }}
                        src={api.getAlbumArtwork(props.album)}
                        alt={`${props.album.title} by ${props.album.artist}`}
                        loading="lazy"
                    />
                    {props.controls && albumControls(props.album)}
                </A>
            </div>
            {(props.artist || props.title) &&
                albumDetails(props.album, props.artist, props.title)}
        </div>
    );
}
