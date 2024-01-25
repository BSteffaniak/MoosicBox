import './album-page.css';
import {
    createComputed,
    createEffect,
    createSignal,
    For,
    on,
    onCleanup,
    onMount,
    Show,
} from 'solid-js';
import { isServer } from 'solid-js/web';
import { A, useParams } from 'solid-start';
import Album from '~/components/Album';
import { displayDate, toTime } from '~/services/formatting';
import { addTracksToQueue, playerState, playPlaylist } from '~/services/player';
import { Album as ApiAlbum, Api, api, Track, trackId } from '~/services/api';
import { artistRoute as rootArtistRoute } from '~/components/Artist/Artist';

export default function albumPage() {
    const params = useParams();
    const [libraryAlbum, setLibraryAlbum] = createSignal<
        Api.Album | null | undefined
    >();
    const [libraryArtist, setLibraryArtist] = createSignal<
        Api.Artist | null | undefined
    >();
    const [album, setAlbum] = createSignal<Api.TidalAlbum>();
    const [tracks, setTracks] = createSignal<Api.TidalTrack[]>();
    const [showingArtwork, setShowingArtwork] = createSignal(false);
    const [blurringArtwork, setBlurringArtwork] = createSignal<boolean>();
    const [sourceImage, setSourceImage] = createSignal<HTMLImageElement>();

    let sourceImageRef: HTMLImageElement | undefined;

    async function loadLibraryArtist() {
        try {
            setLibraryArtist(
                await api.getArtistFromTidalArtistId(album()!.artistId),
            );
        } catch {
            setLibraryArtist(null);
        }
    }

    async function loadLibraryAlbum() {
        try {
            setLibraryAlbum(await api.getAlbumFromTidalAlbumId(album()!.id));
        } catch {
            setLibraryAlbum(null);
        }
    }

    createComputed(async () => {
        setAlbum(undefined);
        setShowingArtwork(false);
        setBlurringArtwork(undefined);
        setSourceImage(undefined);

        if (isServer) return;

        Promise.all([
            (async () => {
                const album = await api.getTidalAlbum(parseInt(params.albumId));
                setAlbum(album);
                await Promise.all([loadLibraryArtist(), loadLibraryAlbum()]);
                return album;
            })(),
            (async () => {
                setTracks(
                    (await api.getTidalAlbumTracks(parseInt(params.albumId)))
                        .items,
                );
            })(),
        ]);
    });

    function artistRoute(album: ApiAlbum | Track): string | undefined {
        if (typeof libraryArtist() === 'undefined') return;

        if (libraryArtist() && libraryArtist()?.tidalId === album.artistId) {
            return rootArtistRoute(libraryArtist()!);
        }

        return rootArtistRoute(album);
    }

    async function playAlbumFrom(track: Api.TidalTrack) {
        if (!tracks()) return;

        const playlist = tracks()!.slice(tracks()!.indexOf(track));

        playPlaylist(playlist);
    }

    function albumDuration(): number {
        if (!tracks()) return 0;

        let duration = 0;

        tracks()!.forEach((track) => (duration += track.duration));

        return duration;
    }

    createComputed(() => {
        setBlurringArtwork(album()?.blur);
    });

    createEffect(
        on(
            () => showingArtwork(),
            (showing) => {
                if (!sourceImage() && showing && sourceImageRef) {
                    sourceImageRef.src = api.getAlbumSourceArtwork(album());
                    sourceImageRef.onload = ({ target }) => {
                        const image = target as HTMLImageElement;
                        setSourceImage(image);
                    };
                }
            },
        ),
    );

    function toggleBlurringArtwork() {
        setBlurringArtwork(!blurringArtwork());
    }

    function showArtwork(): void {
        setBlurringArtwork(album()?.blur);
        setSourceImage(undefined);
        setShowingArtwork(true);
        setTimeout(() => {
            window.addEventListener('click', handleClick);
        });
    }

    function hideArtwork(): void {
        setShowingArtwork(false);
        setTimeout(() => {
            window.removeEventListener('click', handleClick);
        });
    }

    let albumArtworkPreviewerIcon: HTMLImageElement | undefined;

    const handleClick = (event: MouseEvent) => {
        const node = event.target as Node;
        if (
            !albumArtworkPreviewerIcon?.contains(node) &&
            !sourceImageRef?.contains(node)
        ) {
            hideArtwork();
        }
    };

    onMount(() => {
        if (isServer) return;
    });

    onCleanup(() => {
        if (isServer) return;
        window.removeEventListener('click', handleClick);
    });

    function albumArtworkPreviewer() {
        return (
            <div class="album-page-artwork-previewer">
                <div class="album-page-artwork-previewer-content">
                    <img
                        ref={sourceImageRef}
                        style={{
                            cursor: album()?.blur ? 'pointer' : 'initial',
                            visibility: blurringArtwork()
                                ? 'hidden'
                                : undefined,
                        }}
                        onClick={() => album()?.blur && toggleBlurringArtwork()}
                    />
                    <Show when={blurringArtwork() && sourceImage()}>
                        <img
                            ref={albumArtworkPreviewerIcon}
                            src={api.getAlbumArtwork(album(), 16, 16)}
                            style={{
                                'image-rendering': 'pixelated',
                                cursor: 'pointer',
                                width: '100%',
                                position: 'absolute',
                                left: '0',
                                top: '0',
                            }}
                            onClick={() =>
                                album()?.blur && toggleBlurringArtwork()
                            }
                        />
                    </Show>
                    {blurringArtwork() && (
                        <div class="album-page-artwork-previewer-content-blur-notice">
                            Click to unblur
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <>
            <div class="album-page-container">
                <div class="album-page">
                    <div class="album-page-breadcrumbs">
                        <A
                            class="back-button"
                            href="#"
                            onClick={() => history.back()}
                        >
                            Back
                        </A>
                    </div>
                    <div class="album-page-header">
                        <div class="album-page-album-info">
                            <Show when={album()}>
                                {(album) => (
                                    <>
                                        <div class="album-page-album-info-artwork">
                                            <Album
                                                album={album()}
                                                artist={false}
                                                title={false}
                                                size={300}
                                                route={false}
                                                onClick={showArtwork}
                                            />
                                        </div>
                                        <div class="album-page-album-info-details">
                                            <div class="album-page-album-info-details-album-title">
                                                {album().title}
                                            </div>
                                            <div class="album-page-album-info-details-album-artist">
                                                {artistRoute(album()) ? (
                                                    <A
                                                        href={
                                                            artistRoute(
                                                                album(),
                                                            )!
                                                        }
                                                        class="album-page-album-info-details-album-artist-text"
                                                    >
                                                        {album().artist}
                                                    </A>
                                                ) : (
                                                    <span class="album-page-album-info-details-album-artist-text">
                                                        {album().artist}
                                                    </span>
                                                )}
                                            </div>
                                            <div class="album-page-album-info-details-tracks">
                                                <Show when={tracks()}>
                                                    {(tracks) => (
                                                        <>
                                                            {tracks().length}{' '}
                                                            tracks (
                                                            {toTime(
                                                                Math.round(
                                                                    albumDuration(),
                                                                ),
                                                            )}
                                                            )
                                                        </>
                                                    )}
                                                </Show>
                                            </div>
                                            <div class="album-page-album-info-details-release-date">
                                                {displayDate(
                                                    album().dateReleased,
                                                    'LLLL dd, yyyy',
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </Show>
                        </div>
                        <div class="album-page-album-controls">
                            <div class="album-page-album-controls-playback">
                                <button
                                    class="album-page-album-controls-playback-play-button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        if (tracks()) {
                                            playPlaylist(tracks()!);
                                        }
                                        return false;
                                    }}
                                >
                                    <img
                                        src="/img/play-button.svg"
                                        alt="Play"
                                    />{' '}
                                    Play
                                </button>
                                <button
                                    class="album-page-album-controls-playback-options-button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        if (tracks()) {
                                            addTracksToQueue(tracks()!);
                                        }
                                        return false;
                                    }}
                                >
                                    <img
                                        src="/img/more-options.svg"
                                        alt="Options"
                                    />{' '}
                                    Options
                                </button>
                                <Show when={album() && libraryAlbum() === null}>
                                    <button
                                        class="album-page-album-controls-playback-add-to-library-button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            (async () => {
                                                await api.addAlbumToLibrary({
                                                    tidalAlbumId: album()!.id,
                                                });
                                                await Promise.all([
                                                    loadLibraryArtist(),
                                                    loadLibraryAlbum(),
                                                ]);
                                            })();
                                            return false;
                                        }}
                                    >
                                        Add to Library
                                    </button>
                                </Show>
                            </div>
                            <div class="album-page-album-controls-options"></div>
                        </div>
                    </div>
                    <table class="album-page-tracks">
                        <thead>
                            <tr>
                                <th class="album-page-tracks-track-no-header">
                                    #
                                </th>
                                <th>Title</th>
                                <th class="album-page-tracks-artist-header">
                                    Artist
                                </th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            <Show when={tracks()}>
                                <For each={tracks()!}>
                                    {(track) => (
                                        <tr
                                            class={`album-page-tracks-track${
                                                trackId(
                                                    playerState.currentTrack,
                                                ) === trackId(track)
                                                    ? ' playing'
                                                    : ''
                                            }`}
                                            onDblClick={() =>
                                                playAlbumFrom(track)
                                            }
                                        >
                                            <td
                                                class="album-page-tracks-track-no"
                                                onClick={() =>
                                                    playAlbumFrom(track)
                                                }
                                            >
                                                <div class="album-page-tracks-track-no-container">
                                                    {trackId(
                                                        playerState.currentTrack,
                                                    ) === trackId(track) ? (
                                                        <img
                                                            class="audio-icon"
                                                            src="/img/audio-white.svg"
                                                            alt="Playing"
                                                        />
                                                    ) : (
                                                        <span class="track-no-text">
                                                            {track.number}
                                                        </span>
                                                    )}
                                                    <img
                                                        class="play-button"
                                                        src="/img/play-button-white.svg"
                                                        alt="Play"
                                                    />
                                                </div>
                                            </td>
                                            <td class="album-page-tracks-track-title">
                                                {track.title}
                                            </td>
                                            <td class="album-page-tracks-track-artist">
                                                {artistRoute(track) ? (
                                                    <A
                                                        href={
                                                            artistRoute(track)!
                                                        }
                                                        class="album-page-tracks-track-artist-text"
                                                    >
                                                        {track.artist}
                                                    </A>
                                                ) : (
                                                    <span class="album-page-tracks-track-artist-text">
                                                        {track.artist}
                                                    </span>
                                                )}
                                            </td>
                                            <td class="album-page-tracks-track-time">
                                                {toTime(
                                                    Math.round(track.duration),
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </For>
                            </Show>
                        </tbody>
                    </table>
                </div>
            </div>
            {showingArtwork() && albumArtworkPreviewer()}
        </>
    );
}
