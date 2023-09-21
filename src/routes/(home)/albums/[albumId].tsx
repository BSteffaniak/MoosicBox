import { createSignal, For, Show } from 'solid-js';
import { isServer } from 'solid-js/web';
import * as api from '~/services/api';
import './albums.css';
import { useParams } from 'solid-start';

function playAlbum(album: api.Album) {
    api.playAlbum(album.id);
}

export default function Album() {
    const params = useParams();
    const [album, setAlbum] = createSignal<api.Album>();

    (async () => {
        if (isServer) return;
        setAlbum(await api.getAlbum(params.albumId));
    })();

    return (
        <>
            <div class="albums-header">Albums:</div>
            <div class="albums-container">
                <div class="albums">
                    <Show when={album()} fallback={<div>Loading...</div>}>
                        {(album) => <div>{album().title}</div>}
                    </Show>
                </div>
            </div>
        </>
    );
}
