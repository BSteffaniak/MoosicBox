import './albums.css';
import * as api from '~/services/api';
import { createSignal, For, Show } from 'solid-js';
import { isServer } from 'solid-js/web';
import { useLocation } from 'solid-start';

function playAlbum(album: api.Album) {
    api.playAlbum(album.id);
}

function album(album: api.Album) {
    return (
        <div class="album">
            <div
                class="album-icon-container"
                style={{ width: '200px', height: '200px' }}
            >
                <img
                    class="album-icon"
                    style={{ width: '200px', height: '200px' }}
                    src={album.icon ?? '/img/album.svg'}
                />
                <div class="album-controls">
                    <button
                        class="media-button play-button button"
                        onClick={() => playAlbum(album)}
                    >
                        <img src="/img/play-button.svg" alt="Play" />
                    </button>
                </div>
            </div>
            <div class="album-details">
                <div class="album-title">
                    <span class="album-title-text">{album.title}</span>
                </div>
                <div class="album-artist">
                    <span class="album-artist-text">{album.artist}</span>
                </div>
            </div>
        </div>
    );
}

export default function Albums() {
    const [albums, setAlbums] = createSignal<api.Album[]>();

    (async () => {
        if (isServer) return;
        const location = useLocation();
        const sources = location.query.sources?.split(',') as api.AlbumSources | undefined; 
        setAlbums(await api.getAlbums(sources));
    })();

    return (
        <>
            <div class="albums-header">Albums:</div>
            <div class="albums-container">
                <div class="albums">
                    <Show when={albums()} fallback={<div>Loading...</div>}>
                        <For each={albums()}>{album}</For>
                    </Show>
                </div>
            </div>
        </>
    );
}
