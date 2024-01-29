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
import { A, useNavigate } from 'solid-start';
import Album from '~/components/Album';
import {
    displayAlbumVersionQuality,
    displayDate,
    toTime,
} from '~/services/formatting';
import { addTracksToQueue, playerState, playPlaylist } from '~/services/player';
import {
    Api,
    Album as ApiAlbum,
    Track as ApiTrack,
    api,
    trackId,
} from '~/services/api';
import { artistRoute } from '~/components/Artist/Artist';
import { areEqualShallow } from '~/services/util';
import { albumRoute } from '~/components/Album/Album';

export default function albumPage(props: {
    albumId?: number;
    tidalAlbumId?: number;
    qobuzAlbumId?: string;
}) {
    const navigate = useNavigate();
    const [versions, setVersions] = createSignal<Api.AlbumVersion[]>();
    const [showingArtwork, setShowingArtwork] = createSignal(false);
    const [blurringArtwork, setBlurringArtwork] = createSignal<boolean>();
    const [sourceImage, setSourceImage] = createSignal<HTMLImageElement>();
    const [activeVersion, setActiveVersion] = createSignal<Api.AlbumVersion>();

    const [libraryAlbum, setLibraryAlbum] = createSignal<Api.Album | null>();

    const [tidalAlbum, setTidalAlbum] = createSignal<Api.TidalAlbum>();
    const [tidalTracks, setTidalTracks] = createSignal<Api.TidalTrack[]>();

    const [qobuzAlbum, setQobuzAlbum] = createSignal<Api.QobuzAlbum>();
    const [qobuzTracks, setQobuzTracks] = createSignal<Api.QobuzTrack[]>();

    let sourceImageRef: HTMLImageElement | undefined;

    function getAlbum(): ApiAlbum | undefined {
        return libraryAlbum() ?? tidalAlbum() ?? qobuzAlbum();
    }

    function getTracks(): ApiTrack[] | undefined {
        return activeVersion()?.tracks ?? tidalTracks() ?? qobuzTracks();
    }

    async function loadLibraryAlbum() {
        try {
            if (props.albumId) {
                const libraryAlbum = await api.getAlbum(props.albumId);
                setLibraryAlbum(libraryAlbum);
            } else if (props.tidalAlbumId) {
                const libraryAlbum = await api.getAlbumFromTidalAlbumId(
                    props.tidalAlbumId,
                );
                setLibraryAlbum(libraryAlbum);
            } else if (props.qobuzAlbumId) {
                const libraryAlbum = await api.getAlbumFromQobuzAlbumId(
                    props.qobuzAlbumId,
                );
                setLibraryAlbum(libraryAlbum);
            }
        } catch {
            setLibraryAlbum(null);
        }
    }

    async function loadAlbum() {
        if (props.albumId) {
            loadLibraryAlbum();
        } else if (props.tidalAlbumId) {
            await Promise.all([
                loadLibraryAlbum(),
                (async () => {
                    const page = await api.getTidalAlbumTracks(
                        props.tidalAlbumId!,
                    );
                    const tidalTracks = page.items;
                    setTidalTracks(tidalTracks);
                })(),
                (async () => {
                    const tidalAlbum = await api.getTidalAlbum(
                        props.tidalAlbumId!,
                    );
                    setTidalAlbum(tidalAlbum);
                })(),
            ]);
        } else if (props.qobuzAlbumId) {
            await Promise.all([
                loadLibraryAlbum(),
                (async () => {
                    const page = await api.getQobuzAlbumTracks(
                        props.qobuzAlbumId!,
                    );
                    const qobuzTracks = page.items;
                    setQobuzTracks(qobuzTracks);
                })(),
                (async () => {
                    const qobuzAlbum = await api.getQobuzAlbum(
                        props.qobuzAlbumId!,
                    );
                    setQobuzAlbum(qobuzAlbum);
                })(),
            ]);
        }
    }

    async function loadVersions() {
        if (props.albumId) {
            const versions = await api.getAlbumVersions(props.albumId);
            setVersions(versions);

            if (activeVersion()) {
                const version = versions.find((v) =>
                    areEqualShallow(v, activeVersion()!),
                );
                setActiveVersion(version ?? versions[0]);
            } else {
                setActiveVersion(versions[0]);
            }

            return versions;
        }
    }

    async function loadDetails() {
        return await Promise.all([loadAlbum(), loadVersions()]);
    }

    async function addAlbumToLibrary() {
        if (props.tidalAlbumId) {
            await api.addAlbumToLibrary({
                tidalAlbumId: props.tidalAlbumId,
            });
            await loadDetails();
        }
        if (props.qobuzAlbumId) {
            await api.addAlbumToLibrary({
                qobuzAlbumId: props.qobuzAlbumId,
            });
            await loadDetails();
        }
    }

    async function refavoriteAlbum(albumId: {
        tidalAlbumId?: number;
        qobuzAlbumId?: string;
    }) {
        const album = await api.refavoriteAlbum(albumId);

        if (album.albumId !== libraryAlbum()?.albumId) {
            navigate(albumRoute(album));
        }
    }

    async function removeAlbumFromLibrary() {
        const promises = [];

        const tidalAlbumId = libraryAlbum()?.tidalId;
        const qobuzAlbumId = libraryAlbum()?.qobuzId;

        if (tidalAlbumId) {
            promises.push(
                api.removeAlbumFromLibrary({
                    tidalAlbumId,
                }),
            );
        }
        if (qobuzAlbumId) {
            promises.push(
                api.removeAlbumFromLibrary({
                    qobuzAlbumId,
                }),
            );
        }

        await Promise.all(promises);
        setLibraryAlbum(null);

        if (tidalAlbumId) {
            navigate(albumRoute({ id: tidalAlbumId, type: 'TIDAL' }));
        } else if (qobuzAlbumId) {
            navigate(albumRoute({ id: qobuzAlbumId, type: 'QOBUZ' }));
        }
    }

    createEffect(
        on(
            () => props.albumId,
            (value, prev) => {
                if (value !== prev) loadPage();
            },
        ),
    );

    createEffect(
        on(
            () => props.tidalAlbumId,
            (value, prev) => {
                if (value !== prev) loadPage();
            },
        ),
    );

    createEffect(
        on(
            () => props.qobuzAlbumId,
            (value, prev) => {
                if (value !== prev) loadPage();
            },
        ),
    );

    async function loadPage() {
        setLibraryAlbum(undefined);
        setVersions(undefined);
        setShowingArtwork(false);
        setBlurringArtwork(undefined);
        setSourceImage(undefined);
        setActiveVersion(undefined);

        if (isServer) return;

        await loadDetails();
    }

    function isInvalidFavorite(source: Api.TrackSource) {
        if (!versions() || !libraryAlbum()) {
            return false;
        }

        switch (source) {
            case Api.TrackSource.TIDAL:
                if (!libraryAlbum()!.tidalId) {
                    return false;
                }
                break;
            case Api.TrackSource.QOBUZ:
                if (!libraryAlbum()!.qobuzId) {
                    return false;
                }
                break;
            case Api.TrackSource.LOCAL:
                break;
            default:
                source satisfies never;
                throw new Error(`Invalid TrackSource: '${source}'`);
        }

        return versions()!.every((version) => version.source !== source);
    }

    async function playAlbumFrom(track: ApiTrack) {
        const tracks = getTracks()!;
        const playlist = tracks.slice(tracks.indexOf(track));

        playPlaylist(playlist);
    }

    function albumDuration(): number {
        let duration = 0;

        const tracks = getTracks()!;
        tracks.forEach((track) => (duration += track.duration));

        return duration;
    }

    createComputed(() => {
        setBlurringArtwork(getAlbum()?.blur);
    });

    createEffect(
        on(
            () => showingArtwork(),
            (showing) => {
                if (!sourceImage() && showing && sourceImageRef) {
                    sourceImageRef.src = api.getAlbumSourceArtwork(getAlbum());
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
        setBlurringArtwork(getAlbum()?.blur);
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
                        alt={`${getAlbum()?.title} by ${getAlbum()?.artist}`}
                        style={{
                            cursor: getAlbum()?.blur ? 'pointer' : 'initial',
                            visibility: blurringArtwork()
                                ? 'hidden'
                                : undefined,
                        }}
                        onClick={() =>
                            getAlbum()?.blur && toggleBlurringArtwork()
                        }
                    />
                    <Show when={blurringArtwork() && sourceImage()}>
                        <img
                            ref={albumArtworkPreviewerIcon}
                            src={api.getAlbumArtwork(getAlbum(), 16, 16)}
                            style={{
                                'image-rendering': 'pixelated',
                                cursor: 'pointer',
                                width: '100%',
                                position: 'absolute',
                                left: '0',
                                top: '0',
                            }}
                            onClick={() =>
                                getAlbum()?.blur && toggleBlurringArtwork()
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

    function track(track: ApiTrack) {
        return (
            <tr
                class={`album-page-tracks-track${
                    trackId(playerState.currentTrack) === trackId(track)
                        ? ' playing'
                        : ''
                }`}
                onDblClick={() => playAlbumFrom(track)}
            >
                <td
                    class="album-page-tracks-track-no"
                    onClick={() => playAlbumFrom(track)}
                >
                    <div class="album-page-tracks-track-no-container">
                        {trackId(playerState.currentTrack) ===
                        trackId(track) ? (
                            <img
                                class="audio-icon"
                                src="/img/audio-white.svg"
                                alt="Playing"
                            />
                        ) : (
                            <span class="track-no-text">{track.number}</span>
                        )}
                        <img
                            class="play-button"
                            src="/img/play-button-white.svg"
                            alt="Play"
                        />
                    </div>
                </td>
                <td class="album-page-tracks-track-title">{track.title}</td>
                <td class="album-page-tracks-track-artist">
                    <A
                        href={artistRoute(track)}
                        class="album-page-tracks-track-artist-text"
                    >
                        {track.artist}
                    </A>
                </td>
                <td class="album-page-tracks-track-time">
                    {toTime(Math.round(track.duration))}
                </td>
            </tr>
        );
    }

    return (
        <div>
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
                            <Show when={getAlbum()}>
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
                                                <A
                                                    href={artistRoute(album())}
                                                    class="album-page-album-info-details-album-artist-text"
                                                >
                                                    {album().artist}
                                                </A>
                                            </div>
                                            <div class="album-page-album-info-details-tracks">
                                                <Show when={getTracks()}>
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
                                            <div
                                                class={`album-page-album-info-details-versions${
                                                    (versions()?.length ?? 0) >
                                                    1
                                                        ? ' multiple'
                                                        : ''
                                                }`}
                                            >
                                                <For each={versions()}>
                                                    {(version, index) => (
                                                        <>
                                                            <span
                                                                class={`album-page-album-info-details-versions-version${
                                                                    version ===
                                                                    activeVersion()
                                                                        ? ' active'
                                                                        : ''
                                                                }`}
                                                                onClick={() =>
                                                                    setActiveVersion(
                                                                        version,
                                                                    )
                                                                }
                                                            >
                                                                {displayAlbumVersionQuality(
                                                                    version,
                                                                )}
                                                            </span>
                                                            <>
                                                                {index() <
                                                                    versions()!
                                                                        .length -
                                                                        1 && (
                                                                    <span>
                                                                        {' '}
                                                                        /{' '}
                                                                    </span>
                                                                )}
                                                            </>
                                                        </>
                                                    )}
                                                </For>
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
                                        if (getTracks()) {
                                            playPlaylist(getTracks()!);
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
                                        if (getTracks()) {
                                            addTracksToQueue(getTracks()!);
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
                                <Show
                                    when={
                                        (tidalAlbum() || qobuzAlbum()) &&
                                        libraryAlbum() === null
                                    }
                                >
                                    <button
                                        class="album-page-album-controls-playback-add-to-library-button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            addAlbumToLibrary();
                                            return false;
                                        }}
                                    >
                                        Add to Library
                                    </button>
                                </Show>
                                <Show
                                    when={
                                        libraryAlbum()?.tidalId ||
                                        libraryAlbum()?.qobuzId
                                    }
                                >
                                    <button
                                        class="album-page-album-controls-playback-remove-from-library-button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            removeAlbumFromLibrary();
                                            return false;
                                        }}
                                    >
                                        Remove from Library
                                    </button>
                                </Show>
                                <Show
                                    when={isInvalidFavorite(
                                        Api.TrackSource.TIDAL,
                                    )}
                                >
                                    <button
                                        class="album-page-album-controls-playback-refavorite-button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            refavoriteAlbum({
                                                tidalAlbumId:
                                                    libraryAlbum()!.tidalId!,
                                            });
                                            return false;
                                        }}
                                    >
                                        Re-favorite Tidal Album
                                    </button>
                                </Show>
                                <Show
                                    when={isInvalidFavorite(
                                        Api.TrackSource.QOBUZ,
                                    )}
                                >
                                    <button
                                        class="album-page-album-controls-playback-refavorite-button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            refavoriteAlbum({
                                                qobuzAlbumId:
                                                    libraryAlbum()!.qobuzId!,
                                            });
                                            return false;
                                        }}
                                    >
                                        Re-favorite Qobuz Album
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
                            <Show when={getTracks()}>
                                <For each={getTracks()!}>{track}</For>
                            </Show>
                        </tbody>
                    </table>
                </div>
            </div>
            <Show when={showingArtwork()}>{albumArtworkPreviewer()}</Show>
        </div>
    );
}
