import './albums.css';
import { createSignal, For, onCleanup } from 'solid-js';
import { isServer } from 'solid-js/web';
import { debounce } from '@solid-primitives/scheduled';
import Album from '~/components/Album';
import { api, Api, once } from '~/services/api';
import { currentAlbumSearch, setCurrentAlbumSearch } from '~/services/app';

let historyListener: () => void;

export default function albums() {
    const [albums, setAlbums] = createSignal<Api.Album[]>();
    const [searchFilterValue, setSearchFilterValue] = createSignal<string>();
    const searchParams = new URLSearchParams(
        isServer ? {} : window.location.search,
    );

    function setSearchParam(name: string, value: string) {
        searchParams.set(name, value);
        const newRelativePathQuery = `${window.location.pathname}?${searchParams}`;
        history.pushState(null, '', newRelativePathQuery);
    }

    function removeSearchParam(name: string) {
        searchParams.delete(name);
        const newRelativePathQuery = `${window.location.pathname}?${searchParams}`;
        history.pushState(null, '', newRelativePathQuery);
    }

    function getAlbumSources(): Api.AlbumSource[] | undefined {
        return searchParams.get('sources')?.split(',') as
            | Api.AlbumSource[]
            | undefined;
    }

    function getAlbumSort(): Api.AlbumSort | undefined {
        return searchParams.get('sort') as Api.AlbumSort | undefined;
    }

    function getSearchFilter(): string | undefined {
        return searchParams.get('search') as string | undefined;
    }

    function setAlbumSources(sources: Api.AlbumSource[]) {
        setSearchParam('sources', sources.join(','));
    }

    function setAlbumSort(sort: Api.AlbumSort) {
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
        request: Api.AlbumsRequest | undefined = undefined,
    ) {
        if (currentAlbumSearch() && !albums()) {
            setAlbums(currentAlbumSearch());
            return;
        }
        if (request?.sources) setAlbumSources(request.sources);
        if (request?.sort) setAlbumSort(request.sort);
        if (typeof request?.filters?.search === 'string')
            setSearchFilter(request.filters.search);

        setAlbums(
            await once('albums', (signal) =>
                api.getAlbums(
                    {
                        sources: getAlbumSources(),
                        sort: getAlbumSort(),
                        filters: {
                            search: getSearchFilter(),
                        },
                    },
                    signal,
                ),
            ),
        );

        setCurrentAlbumSearch(albums());
    }

    if (!isServer) {
        if (historyListener) {
            window.removeEventListener('popstate', historyListener);
        }

        historyListener = () => {
            const newSearchParams = new URLSearchParams(window.location.search);

            let wasChange = false;

            searchParams.forEach((_value, key) => {
                if (!newSearchParams.has(key)) {
                    switch (key) {
                        case 'sources':
                            wasChange = true;
                            break;
                        case 'sort':
                            wasChange = true;
                            break;
                        case 'search':
                            searchParams.delete(key);
                            setSearchFilterValue('');
                            wasChange = true;
                            break;
                    }
                }
            });

            newSearchParams.forEach((value, key) => {
                if (searchParams.get(key) !== value) {
                    searchParams.set(key, value);

                    switch (key) {
                        case 'sources':
                            wasChange = true;
                            break;
                        case 'sort':
                            wasChange = true;
                            break;
                        case 'search':
                            setSearchFilterValue(value);
                            wasChange = true;
                            break;
                    }
                }
            });

            if (wasChange) {
                loadAlbums();
            }
        };

        window.addEventListener('popstate', historyListener);
    }

    onCleanup(() => {
        if (historyListener) {
            window.removeEventListener('popstate', historyListener);
        }
    });

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
                                getAlbumSort() === 'Release-Date-Desc'
                                    ? 'Release-Date'
                                    : 'Release-Date-Desc',
                        })
                    }
                >
                    Album Release Date
                </button>
                <button
                    onClick={() =>
                        loadAlbums({
                            sort:
                                getAlbumSort() === 'Date-Added-Desc'
                                    ? 'Date-Added'
                                    : 'Date-Added-Desc',
                        })
                    }
                >
                    Date Added
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
            <div id="albums-header-offset"></div>
            {albums() && (
                <div class="albums-container">
                    Showing {albums()?.length} album
                    {albums()?.length === 1 ? '' : 's'}
                    <div class="albums">
                        <For each={albums()}>
                            {(album) => (
                                <Album
                                    album={album}
                                    controls={true}
                                    artist={true}
                                    title={true}
                                    versionQualities={true}
                                />
                            )}
                        </For>
                    </div>
                </div>
            )}
        </>
    );
}
