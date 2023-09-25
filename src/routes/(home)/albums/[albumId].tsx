import { createSignal, For, Show } from 'solid-js';
import { isServer } from 'solid-js/web';
import * as api from '~/services/api';
import { useParams } from 'solid-start';
import { A } from '@solidjs/router';
import Album from '~/components/Album';

export default function AlbumPage() {
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
            <div class="album-page-container">
                <div class="album-page">
                    {album() && <Album album={album()!} />}
                    {tracks() && (
                        <For each={tracks()}>
                            {(track) => <div>{track.title}</div>}
                        </For>
                    )}
                </div>
            </div>
        </>
    );
}
