import './playlist.css';
import * as api from '~/services/api';
import { For, createEffect, createSignal, on } from 'solid-js';
import {
    currentTrack,
    playFromPlaylistPosition,
    playlist as playerPlaylist,
    playing,
    removeTrackFromPlaylist,
} from '~/services/player';
import Album from '../Album';
import { A } from '@solidjs/router';

export default function playlist() {
    const [playlist, setPlaylist] = createSignal<api.Track[]>([]);
    const [currentlyPlayingIndex, setCurrentlyPlayingIndex] =
        createSignal<number>();

    function updateCurrentlyPlayingIndex() {
        setCurrentlyPlayingIndex(
            playlist().findIndex(
                (track) => track.trackId === currentTrack()?.trackId,
            ),
        );
    }

    createEffect(
        on(
            () => playerPlaylist(),
            (value) => {
                setPlaylist(value);
                updateCurrentlyPlayingIndex();
            },
        ),
    );

    createEffect(
        on(
            () => currentTrack(),
            () => {
                updateCurrentlyPlayingIndex();
            },
        ),
    );

    return (
        <div class="playlist">
            <div class="playlist-tracks">
                <div class="playlist-tracks-play-queue">Play queue</div>
                <For each={playlist()}>
                    {(track, index) => (
                        <>
                            {currentTrack()?.trackId === track.trackId && (
                                <div class="playlist-tracks-playing-from">
                                    Playing from:{' '}
                                    <A href={`/albums/${track.albumId}`}>
                                        {track.album}
                                    </A>
                                </div>
                            )}
                            {index() === (currentlyPlayingIndex() ?? 0) + 1 && (
                                <div class="playlist-tracks-next-up">
                                    Next up:
                                </div>
                            )}
                            <div
                                class={`playlist-tracks-track${
                                    currentTrack()?.trackId === track.trackId
                                        ? ' current'
                                        : ''
                                }${
                                    currentTrack()?.trackId === track.trackId &&
                                    playing()
                                        ? ' playing'
                                        : ''
                                }${
                                    index() < (currentlyPlayingIndex() ?? 0)
                                        ? ' past'
                                        : ''
                                }`}
                                onClick={() =>
                                    index() !== currentlyPlayingIndex() &&
                                    playFromPlaylistPosition(index())
                                }
                            >
                                <div class="playlist-tracks-track-album-artwork">
                                    <div class="playlist-tracks-track-album-artwork-icon">
                                        <Album
                                            album={track}
                                            size={50}
                                            route={false}
                                        />
                                        {index() === currentlyPlayingIndex() ? (
                                            <img
                                                class="audio-icon"
                                                src="/img/audio-white.svg"
                                                alt="Playing"
                                            />
                                        ) : (
                                            <img
                                                class="play-icon"
                                                src="/img/play-button-white.svg"
                                                alt="Playing"
                                            />
                                        )}
                                    </div>
                                </div>
                                <div class="playlist-tracks-track-details">
                                    <div class="playlist-tracks-track-details-title">
                                        {track.title}
                                    </div>
                                    <div class="playlist-tracks-track-details-artist">
                                        {track.artist}
                                    </div>
                                </div>
                                {index() !== (currentlyPlayingIndex() ?? 0) && (
                                    <div
                                        class="playlist-tracks-track-remove"
                                        onClick={() =>
                                            removeTrackFromPlaylist(index())
                                        }
                                    >
                                        <img
                                            class="cross-icon"
                                            src="/img/cross-white.svg"
                                            alt="Remove from queue"
                                        />
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </For>
            </div>
        </div>
    );
}
