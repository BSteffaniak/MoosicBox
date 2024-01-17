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

    const [loading, setLoading] = createSignal(false);
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

        if (!searchString.trim()) return;

        searchResultsRef.scroll({ top: 0, behavior: 'instant' });

        try {
            setLoading(true);
            const response = await api.globalSearch(searchString, 0, 20);
            setSearchResults(response.results);
        } catch {
            setSearchResults(undefined);
        } finally {
            setLoading(false);
        }
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
                            <span class="search-results-result-details-type">
                                Artist
                            </span>{' '}
                            <span class="search-results-result-details-stop-word">
                                -
                            </span>{' '}
                            <A
                                href={`/artists/${artist.artistId}`}
                                class="search-results-result-details-artist"
                                tabindex="-1"
                            >
                                {artist.title}
                            </A>
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
                            <span class="search-results-result-details-type">
                                Album
                            </span>{' '}
                            <span class="search-results-result-details-stop-word">
                                -
                            </span>{' '}
                            <A
                                href={`/albums/${album.albumId}`}
                                class="search-results-result-details-album"
                                tabindex="-1"
                            >
                                {album.title}
                            </A>{' '}
                            <span class="search-results-result-details-stop-word">
                                by
                            </span>{' '}
                            <A
                                href={`/artists/${album.artistId}`}
                                class="search-results-result-details-artist"
                                tabindex="-1"
                            >
                                {album.artist}
                            </A>
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
                            <span class="search-results-result-details-type">
                                Track
                            </span>{' '}
                            <span class="search-results-result-details-stop-word">
                                -
                            </span>{' '}
                            <A
                                href={`/albums/${track.albumId}`}
                                class="search-results-result-details-track"
                                tabindex="-1"
                            >
                                {track.title}
                            </A>{' '}
                            <span class="search-results-result-details-stop-word">
                                on
                            </span>{' '}
                            <A
                                href={`/albums/${track.albumId}`}
                                class="search-results-result-details-album"
                                tabindex="-1"
                            >
                                {track.album}
                            </A>{' '}
                            <span class="search-results-result-details-stop-word">
                                by
                            </span>{' '}
                            <A
                                href={`/artists/${track.artistId}`}
                                class="search-results-result-details-artist"
                                tabindex="-1"
                            >
                                {track.artist}
                            </A>
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
                <img
                    src={'/img/cross.svg'}
                    class="cancel-search-icon"
                    onClick={(e) => {
                        e.stopPropagation();
                        closeSearch();
                    }}
                />
            </div>
            <div
                class={`search-results${loading() ? ' loading' : ' loaded'}`}
                style={{
                    display: searchFilterValue()?.trim() ? undefined : 'none',
                }}
                ref={searchResultsRef!}
            >
                <Show when={searchResults()?.length === 0}>No results</Show>
                <Show when={(searchResults()?.length ?? 0) !== 0}>
                    <For each={searchResults()}>
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
                </Show>
            </div>
        </div>
    );
}
