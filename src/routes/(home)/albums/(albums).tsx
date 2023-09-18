import './albums.css';
import * as api from '~/services/api';
import { createSignal, For, Show } from 'solid-js';
import { isServer } from 'solid-js/web';
import { debounce } from '@solid-primitives/scheduled';

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
    const [searchFilterValue, setSearchFilterValue] = createSignal<string>();
    const searchParams = new URLSearchParams(
        isServer ? {} : window.location.search,
    );

    function setSearchParam(name: string, value: string) {
        searchParams.set(name, value);
        const newRelativePathQuery = `${
            window.location.pathname
        }?${searchParams.toString()}`;
        history.pushState(null, '', newRelativePathQuery);
    }

    function removeSearchParam(name: string) {
        searchParams.delete(name);
        const newRelativePathQuery = `${
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

    function getSearchFilter(): string | undefined {
        return searchParams.get('search') as string | undefined;
    }

    function setAlbumSources(sources: api.AlbumSource[]) {
        setSearchParam('sources', sources.join(','));
    }

    function setAlbumSort(sort: api.AlbumSort) {
        setSearchParam('sort', sort);
    }

    function setSearchFilter(search: string) {
        if (search.trim().length === 0) {
            removeSearchParam('search');
        } else {
            setSearchParam('search', search);
        }
        setSearchFilterValue(search);
    }

    async function loadAlbums(
        request: api.AlbumsRequest | undefined = undefined,
    ) {
        if (request?.sources) setAlbumSources(request.sources);
        if (request?.sort) setAlbumSort(request.sort);
        if (typeof request?.filters?.search === 'string')
            setSearchFilter(request.filters.search);
        setAlbums(
            await api.getAlbums({
                sources: getAlbumSources(),
                sort: getAlbumSort(),
                filters: {
                    search: getSearchFilter(),
                },
            }),
        );
    }

    (async () => {
        if (isServer) return;
        setSearchFilterValue(getSearchFilter() ?? '');
        await loadAlbums();
    })();

    return (
        <>
            <header id="albums-header">
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
                <button
                    onClick={() =>
                        loadAlbums({
                            sort:
                                getAlbumSort() === 'Year'
                                    ? 'Year-Desc'
                                    : 'Year',
                        })
                    }
                >
                    Album Year
                </button>
                <input
                    type="text"
                    value={searchFilterValue()}
                    onInput={debounce(
                        (e) =>
                            loadAlbums({
                                filters: {
                                    search: e.target.value ?? undefined,
                                },
                            }),
                        200,
                    )}
                />
            </header>
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
