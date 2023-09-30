import './artists.css';
import { createSignal, For, onCleanup } from 'solid-js';
import { isServer } from 'solid-js/web';
import { debounce } from '@solid-primitives/scheduled';
import { api, Api } from '~/services/api';
import { currentArtistSearch, setCurrentArtistSearch } from '~/services/app';

let historyListener: () => void;

export default function artists() {
    const [artists, setArtists] = createSignal<Api.Artist[]>();
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

    function getArtistSources(): Api.AlbumSource[] | undefined {
        return searchParams.get('sources')?.split(',') as
            | Api.AlbumSource[]
            | undefined;
    }

    function getArtistSort(): Api.ArtistSort | undefined {
        return searchParams.get('sort') as Api.ArtistSort | undefined;
    }

    function getSearchFilter(): string | undefined {
        return searchParams.get('search') as string | undefined;
    }

    function setArtistSources(sources: Api.AlbumSource[]) {
        setSearchParam('sources', sources.join(','));
    }

    function setArtistSort(sort: Api.ArtistSort) {
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

    async function loadArtists(
        request: Api.ArtistsRequest | undefined = undefined,
    ) {
        if (currentArtistSearch() && !artists()) {
            setArtists(currentArtistSearch());
            return;
        }
        if (request?.sources) setArtistSources(request.sources);
        if (request?.sort) setArtistSort(request.sort);
        if (typeof request?.filters?.search === 'string')
            setSearchFilter(request.filters.search);
        setArtists(
            await api.getArtists({
                sources: getArtistSources(),
                sort: getArtistSort(),
                filters: {
                    search: getSearchFilter(),
                },
            }),
        );
        setCurrentArtistSearch(artists());
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
                loadArtists();
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
        await loadArtists();
    })();

    return (
        <>
            <header id="artists-header">
                <button onClick={() => loadArtists({ sources: ['Local'] })}>
                    Local
                </button>
                <button onClick={() => loadArtists({ sources: ['Tidal'] })}>
                    Tidal
                </button>
                <button onClick={() => loadArtists({ sources: ['Qobuz'] })}>
                    Qobuz
                </button>
                <button onClick={() => loadArtists({ sort: 'Name' })}>
                    Name
                </button>
                <input
                    type="text"
                    value={searchFilterValue()}
                    onInput={debounce(
                        (e) =>
                            loadArtists({
                                filters: {
                                    search: e.target.value ?? undefined,
                                },
                            }),
                        200,
                    )}
                />
            </header>
            <div id="artists-header-offset"></div>
            {artists() && (
                <div class="artists-container">
                    Showing {artists()?.length} artist
                    {artists()?.length === 1 ? '' : 's'}
                    <div class="artists">
                        <For each={artists()}>
                            {(artist) => <div>{artist.title}</div>}
                        </For>
                    </div>
                </div>
            )}
        </>
    );
}
