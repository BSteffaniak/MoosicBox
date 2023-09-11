import { createSignal, For, Show } from "solid-js";
import { Album, getAlbums } from "~/services/api";
import "./albums.css";

function album(album: Album) {
    return (
        <div class="album">
            <img style={{ width: "200px" }} src={album.icon} />
            <div class="album-title">{album.text}</div>
        </div>
    );
}

export default function Albums() {
    const [albums, setAlbums] = createSignal<Album[]>();

    (async () => {
        setAlbums(await getAlbums());
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
