import './search.css';
import {
    For,
    JSXElement,
    Show,
    createSignal,
    onCleanup,
    onMount,
} from 'solid-js';
import { debounce } from '@solid-primitives/scheduled';
import { Api, api } from '~/services/api';
import Artist from '../Artist';
import Album from '../Album';
import { isServer } from 'solid-js/web';
import { A } from 'solid-start';

let searchResultsRefStyles: CSSStyleDeclaration | undefined = undefined;

export default function searchInput() {
    let searchContainerRef: HTMLDivElement;
    let searchInputRef: HTMLInputElement;
    let searchResultsRef: HTMLDivElement;

    const [searchFilterValue, setSearchFilterValue] = createSignal('');
    const [searchResults, setSearchResults] =
        createSignal<Api.GlobalSearchResult[]>();

    const resizeListener = () => {
        const playerTop = document
            .getElementsByClassName('footer-player-container')[0]
            .getBoundingClientRect().top;

        const searchContainerOffset =
            searchContainerRef.getBoundingClientRect().bottom;

        searchResultsRefStyles =
            searchResultsRefStyles ?? getComputedStyle(searchResultsRef);
        const styles = searchResultsRefStyles;

        searchResultsRef.style.top = `${searchContainerOffset}px`;
        searchResultsRef.style.maxHeight = `calc(${playerTop}px - ${searchContainerOffset}px - ${styles.paddingTop} - ${styles.paddingBottom} - ${styles.marginBottom})`;
    };

    function closeSearch() {
        searchInputRef.focus();
        searchInputRef.blur();
    }

    function inputFocused(
        e: FocusEvent & {
            currentTarget: HTMLInputElement;
            target: HTMLInputElement;
        },
    ) {
        e.target.select();
        resizeListener();
    }

    onMount(() => {
        if (isServer) return;
        window.addEventListener('resize', resizeListener);

        resizeListener();
    });

    onCleanup(() => {
        if (isServer) return;
        window.removeEventListener('resize', resizeListener);
    });

    async function search(searchString: string) {
        setSearchFilterValue(searchString);
        setSearchResults(undefined);
        const results = await api.globalSearch(searchString, 0, 20);
        setSearchResults(results);
    }

    function searchResultLink(result: Api.GlobalSearchResult): string {
        switch (result.type) {
            case 'ARTIST':
                return `/artists/${result.artistId}`;
            case 'ALBUM':
                return `/albums/${result.albumId}`;
            case 'TRACK':
                return `/albums/${result.albumId}`;
        }
    }

    function searchResult(result: Api.GlobalSearchResult): JSXElement {
        switch (result.type) {
            case 'ARTIST': {
                const artist = result as Api.GlobalArtistSearchResult;
                return (
                    <div class="search-results-result">
                        <div class="search-results-result-icon">
                            <Artist size={50} artist={artist} route={false} />
                        </div>
                        <div class="search-results-result-details">
                            Artist - {artist.title}
                        </div>
                    </div>
                );
            }
            case 'ALBUM': {
                const album = result as Api.GlobalAlbumSearchResult;
                return (
                    <div class="search-results-result">
                        <div class="search-results-result-icon">
                            <Album
                                size={50}
                                artist={false}
                                year={false}
                                route={false}
                                album={album}
                            />
                        </div>
                        <div class="search-results-result-details">
                            Album - {album.title} by {album.artist}
                        </div>
                    </div>
                );
            }
            case 'TRACK': {
                const album = {
                    ...result,
                    versions: [result],
                    type: 'ALBUM',
                } as Api.GlobalAlbumSearchResult;
                const track = result as Api.GlobalTrackSearchResult;
                return (
                    <div class="search-results-result">
                        <div class="search-results-result-icon">
                            <Album
                                size={50}
                                artist={false}
                                year={false}
                                route={false}
                                album={album}
                            />
                        </div>
                        <div class="search-results-result-details">
                            Track - {track.title} - {track.album} by{' '}
                            {track.artist}
                        </div>
                    </div>
                );
            }
        }
    }

    return (
        <div class="search-container" ref={searchContainerRef!}>
            <div class="search-label-container">
                <label class="search-label">
                    <input
                        ref={searchInputRef!}
                        class="search-input"
                        title="Search..."
                        type="text"
                        onFocus={(e) => inputFocused(e)}
                        value={searchFilterValue()}
                        onInput={debounce(async (e) => {
                            await search(e.target.value ?? '');
                        }, 200)}
                        onKeyUp={(e) => e.key === 'Escape' && closeSearch()}
                    />
                    <div class="search-backdrop"></div>
                </label>
            </div>
            <div
                class="search-results"
                style={{ display: searchResults() ? undefined : 'none' }}
                ref={searchResultsRef!}
            >
                <Show when={searchResults()}>
                    {(results) => (
                        <For each={results()}>
                            {(result) => (
                                <A
                                    href={searchResultLink(result)}
                                    class="search-results-result-link"
                                    onClick={() => closeSearch()}
                                >
                                    {searchResult(result)}
                                </A>
                            )}
                        </For>
                    )}
                </Show>
            </div>
        </div>
    );
}
