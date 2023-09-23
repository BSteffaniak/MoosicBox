import { createSignal, For, Show } from 'solid-js';
import { isServer } from 'solid-js/web';
import * as api from '~/services/api';
import './album.css';
import { useParams } from 'solid-start';
import { playAlbum } from '~/services/player';
import { A } from '@solidjs/router';

export default function Album() {
    const params = useParams();
    const [album, setAlbum] = createSignal<api.Album>();
    const [tracks, setTracks] = createSignal<api.Track[]>();

    (async () => {
        if (isServer) return;
        setAlbum(await api.getAlbum(parseInt(params.albumId)));
        setTracks(await api.getAlbumTracks(parseInt(params.albumId)));
    })();

    return (
        <>
            <A href="#" onClick={() => history.back()}>
                Back
            </A>
            <div class="album-container">
                <div class="album">
                    <Show when={album()} fallback={<div>Loading...</div>}>
                        {(album) => (
                            <div>
                                <img
                                    class="album-icon"
                                    style={{ width: '200px', height: '200px' }}
                                    src={api.getAlbumArtwork(album())}
                                />
                                <h1>{album().title}</h1>
                                <button
                                    class="media-button play-button button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        playAlbum(album());
                                        return false;
                                    }}
                                >
                                    <img
                                        src="/img/play-button.svg"
                                        alt="Play"
                                    />
                                </button>
                            </div>
                        )}
                    </Show>
                    <Show when={tracks()} fallback={<div>Loading...</div>}>
                        {(tracks) => (
                            <For each={tracks()}>
                                {(track) => <div>{track.title}</div>}
                            </For>
                        )}
                    </Show>
                </div>
            </div>
        </>
    );
}
