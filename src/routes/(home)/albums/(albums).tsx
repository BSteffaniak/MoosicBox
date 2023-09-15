import './albums.css';
import * as api from '~/services/api';
import { createSignal, For, Show } from 'solid-js';
import { isServer } from 'solid-js/web';

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
    var searchParams = new URLSearchParams(
        isServer ? {} : window.location.search,
    );

    function setSearchParam(name: string, value: string) {
        searchParams.set(name, value);
        var newRelativePathQuery = `${
            window.location.pathname
        }?${searchParams.toString()}`;
        history.pushState(null, '', newRelativePathQuery);
    }

    function getAlbumSources(): api.AlbumSource[] | undefined {
        return searchParams.get('sources')?.split(',') as
            | api.AlbumSource[]
            | undefined;
    }

    function getAlbumSort(): api.AlbumSort | undefined {
        return searchParams.get('sort') as api.AlbumSort | undefined;
    }

    function setAlbumSources(sources: api.AlbumSource[]) {
        setSearchParam('sources', sources.join(','));
    }

    function setAlbumSort(sort: api.AlbumSort) {
        setSearchParam('sort', sort);
    }

    async function loadAlbums(
        filters: api.AlbumFilters | undefined = undefined,
    ) {
        if (filters?.sources) setAlbumSources(filters.sources);
        if (filters?.sort) setAlbumSort(filters.sort);
        setAlbums(
            await api.getAlbums({
                sources: getAlbumSources(),
                sort: getAlbumSort(),
            }),
        );
    }

    (async () => {
        if (isServer) return;
        await loadAlbums();
    })();

    return (
        <>
            <div class="albums-header">Albums:</div>
            <button onClick={() => loadAlbums({ sources: ['Local'] })}>
                Local
            </button>
            <button onClick={() => loadAlbums({ sources: ['Tidal'] })}>
                Tidal
            </button>
            <button onClick={() => loadAlbums({ sources: ['Qobuz'] })}>
                Qobuz
            </button>
            <button onClick={() => loadAlbums({ sort: 'Artist' })}>
                Album Artist
            </button>
            <button onClick={() => loadAlbums({ sort: 'Name' })}>
                Album Name
            </button>
            <button onClick={() => loadAlbums({ sort: getAlbumSort() === 'Year' ? 'Year-Desc' : 'Year' })}>
                Album Year
            </button>
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
