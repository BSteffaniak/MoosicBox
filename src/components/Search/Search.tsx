import './search.css';
import { For, Show, createSignal, onCleanup, onMount } from 'solid-js';
import type { JSXElement } from 'solid-js';
import { debounce } from '@solid-primitives/scheduled';
import { Api, api } from '~/services/api';
import Artist from '../Artist';
import Album from '../Album';
import { isServer } from 'solid-js/web';
import { artistRoute } from '../Artist/Artist';
import { albumRoute } from '../Album/Album';

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
        const footerPlayerContainer = document.getElementsByClassName(
            'footer-player-container',
        )[0];

        if (!footerPlayerContainer) return;

        const playerTop = footerPlayerContainer.getBoundingClientRect().top;

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
        } catch (e) {
            console.error('Failed to run global search', e);
            setSearchResults(undefined);
        } finally {
            setLoading(false);
        }
    }

    function searchResultLink(result: Api.GlobalSearchResult): string {
        const resultType = result.type;

        switch (resultType) {
            case 'ARTIST':
                return artistRoute({ id: result.artistId, type: 'LIBRARY' });
            case 'ALBUM':
                return albumRoute({ id: result.albumId, type: 'LIBRARY' });
            case 'TRACK':
                return albumRoute({ id: result.albumId, type: 'LIBRARY' });
            default:
                resultType satisfies never;
                throw new Error(`Invalid result type: ${resultType}`);
        }
    }

    function searchResult(result: Api.GlobalSearchResult): JSXElement {
        switch (result.type) {
            case 'ARTIST': {
                const artist = result as Api.GlobalArtistSearchResult;
                const libraryArtist: Api.Artist = {
                    ...artist,
                    type: 'LIBRARY',
                };
                return (
                    <div class="search-results-result">
                        <div class="search-results-result-icon">
                            <Artist
                                size={50}
                                artist={libraryArtist}
                                route={false}
                            />
                        </div>
                        <div class="search-results-result-details">
                            <span class="search-results-result-details-type">
                                Artist
                            </span>{' '}
                            <span class="search-results-result-details-stop-word">
                                -
                            </span>{' '}
                            <a
                                href={artistRoute({
                                    id: artist.artistId,
                                    type: 'LIBRARY',
                                })}
                                class="search-results-result-details-artist"
                                tabindex="-1"
                            >
                                {artist.title}
                            </a>
                        </div>
                    </div>
                );
            }
            case 'ALBUM': {
                const album = result as Api.GlobalAlbumSearchResult;
                const libraryAlbum: Api.Album = { ...album, type: 'LIBRARY' };
                return (
                    <div class="search-results-result">
                        <div class="search-results-result-icon">
                            <Album
                                size={50}
                                artist={false}
                                year={false}
                                route={false}
                                album={libraryAlbum}
                            />
                        </div>
                        <div class="search-results-result-details">
                            <span class="search-results-result-details-type">
                                Album
                            </span>{' '}
                            <span class="search-results-result-details-stop-word">
                                -
                            </span>{' '}
                            <a
                                href={albumRoute({
                                    id: album.albumId,
                                    type: 'LIBRARY',
                                })}
                                class="search-results-result-details-album"
                                tabindex="-1"
                            >
                                {album.title}
                            </a>{' '}
                            <span class="search-results-result-details-stop-word">
                                by
                            </span>{' '}
                            <a
                                href={artistRoute({
                                    id: album.artistId,
                                    type: 'LIBRARY',
                                })}
                                class="search-results-result-details-artist"
                                tabindex="-1"
                            >
                                {album.artist}
                            </a>
                        </div>
                    </div>
                );
            }
            case 'TRACK': {
                const libraryAlbum: Api.Album = {
                    ...result,
                    versions: [result],
                    type: 'LIBRARY',
                };
                const track = result as Api.GlobalTrackSearchResult;
                return (
                    <div class="search-results-result">
                        <div class="search-results-result-icon">
                            <Album
                                size={50}
                                artist={false}
                                year={false}
                                route={false}
                                album={libraryAlbum}
                            />
                        </div>
                        <div class="search-results-result-details">
                            <span class="search-results-result-details-type">
                                Track
                            </span>{' '}
                            <span class="search-results-result-details-stop-word">
                                -
                            </span>{' '}
                            <a
                                href={albumRoute({
                                    id: track.albumId,
                                    type: 'LIBRARY',
                                })}
                                class="search-results-result-details-track"
                                tabindex="-1"
                            >
                                {track.title}
                            </a>{' '}
                            <span class="search-results-result-details-stop-word">
                                on
                            </span>{' '}
                            <a
                                href={albumRoute({
                                    id: track.albumId,
                                    type: 'LIBRARY',
                                })}
                                class="search-results-result-details-album"
                                tabindex="-1"
                            >
                                {track.album}
                            </a>{' '}
                            <span class="search-results-result-details-stop-word">
                                by
                            </span>{' '}
                            <a
                                href={artistRoute({
                                    id: track.artistId,
                                    type: 'LIBRARY',
                                })}
                                class="search-results-result-details-artist"
                                tabindex="-1"
                            >
                                {track.artist}
                            </a>
                        </div>
                    </div>
                );
            }
        }
    }

    return (
        <div
            data-turbo-permanent
            id="search-bar"
            class="search-container"
            ref={searchContainerRef!}
        >
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
                            <a
                                href={searchResultLink(result)}
                                class="search-results-result-link"
                                onClick={() => closeSearch()}
                            >
                                {searchResult(result)}
                            </a>
                        )}
                    </For>
                </Show>
            </div>
        </div>
    );
}
