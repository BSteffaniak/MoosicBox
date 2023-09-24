import { createEffect, createSignal, on, onCleanup, onMount } from 'solid-js';
import './Player.css';
import {
    currentAlbum,
    currentSeek,
    currentTrack,
    currentTrackLength,
    nextTrack,
    pause,
    play,
    playing,
    previousTrack,
    seek,
    setCurrentAlbum,
    setCurrentSeek,
    setCurrentTrack,
    setCurrentTrackLength,
} from '~/services/player';
import { A } from '@solidjs/router';
import { getAlbumArtwork } from '~/services/api';
import { toTime } from '~/services/formatting';
import { isServer } from 'solid-js/web';

let mouseX: number;

function eventToSeekPosition(element: HTMLElement): number {
    const pos = element.getBoundingClientRect()!;
    const percentage = (mouseX - pos.left) / pos.width;
    return currentTrackLength() * percentage;
}

function seekTo(event: MouseEvent): void {
    seek(Math.round(eventToSeekPosition(event.target as HTMLElement)));
}

let dragStartListener: (event: MouseEvent) => void;
let dragListener: (event: MouseEvent) => void;
let dragEndListener: (event: MouseEvent) => void;

export default function Player() {
    let progressBar: HTMLDivElement | undefined;
    let progressBarTrigger: HTMLDivElement | undefined;
    let [dragging, setDragging] = createSignal(false);
    let [applyDrag, setApplyDrag] = createSignal(false);
    let [seekPosition, setSeekPosition] = createSignal(currentSeek());

    function speedyProgressTransition() {
        progressBar?.classList.add('no-transition');
        setTimeout(() => {
            progressBar?.classList.remove('no-transition');
        }, 100);
    }

    function getSeekPosition() {
        return Math.max(Math.min(seekPosition() ?? 0, currentTrackLength()), 0);
    }

    onMount(() => {
        setCurrentTrackLength(currentTrackLength());
        setCurrentAlbum(currentAlbum());
        setCurrentTrack(currentTrack());
        setCurrentSeek(currentSeek());
        speedyProgressTransition();

        if (!isServer) {
            dragStartListener = (event: MouseEvent) => {
                if (event.button === 0) {
                    progressBar?.classList.add('no-transition');
                    setDragging(true);
                    setApplyDrag(true);
                }
            };
            dragListener = (event: MouseEvent) => {
                mouseX = event.clientX;
                if (dragging()) {
                    event.preventDefault();
                    if (!applyDrag()) return;
                }
                setSeekPosition(eventToSeekPosition(progressBarTrigger!));
            };
            dragEndListener = (event: MouseEvent) => {
                if (event.button === 0 && dragging()) {
                    setDragging(false);
                    if (!applyDrag()) return;
                    setApplyDrag(false);
                    seek(Math.round(seekPosition()!));
                    progressBar?.classList.remove('no-transition');
                    event.preventDefault();
                }
            };
            progressBarTrigger!.addEventListener(
                'mousedown',
                dragStartListener,
            );
            window.addEventListener('mousemove', dragListener);
            window.addEventListener('mouseup', dragEndListener);
        }
    });

    onCleanup(() => {
        if (!isServer) {
            progressBarTrigger!.removeEventListener(
                'mousedown',
                dragStartListener,
            );
            window.removeEventListener('mousemove', dragListener);
            window.removeEventListener('mouseup', dragEndListener);
        }
    });

    createEffect(
        on(
            () => currentSeek(),
            (newSeek, oldSeek) => {
                if (
                    typeof newSeek === 'undefined' ||
                    typeof oldSeek === 'undefined' ||
                    Math.abs(newSeek - oldSeek) > 1.2
                ) {
                    speedyProgressTransition();
                }
            },
        ),
    );

    createEffect(
        on(
            () => currentTrackLength(),
            () => {
                setSeekPosition(eventToSeekPosition(progressBarTrigger!));
            },
        ),
    );

    createEffect(
        on(
            () => playing(),
            () => {
                if (dragging()) {
                    setApplyDrag(false);
                    progressBar?.classList.remove('no-transition');
                }
            },
        ),
    );

    return (
        <div class="player">
            <div class="player-now-playing">
                <A href={`/albums/${currentTrack()?.albumId}`}>
                    <img
                        class="player-album-icon"
                        style={{ width: '70px', height: '70px' }}
                        src={getAlbumArtwork(currentTrack())}
                    />
                </A>
                <div class="player-now-playing-details">
                    <div class="player-now-playing-details-title">
                        <A href={`/albums/${currentTrack()?.albumId}`}>
                            {currentTrack()?.title}
                        </A>
                    </div>
                    <div class="player-now-playing-details-artist">
                        <A href={`/artists/${currentTrack()?.artistId}`}>
                            {currentTrack()?.artist}
                        </A>
                    </div>
                    <div class="player-now-playing-details-album">
                        Playing from:{' '}
                        <A href={`/albums/${currentTrack()?.albumId}`}>
                            {currentTrack()?.album}
                        </A>
                    </div>
                </div>
            </div>
            <div class="player-media-controls">
                <div class="player-media-controls-track">
                    <button
                        class="media-button button"
                        onClick={() => previousTrack()}
                    >
                        <img
                            class="previous-track-button"
                            src="/img/next-button-white.svg"
                            alt="Previous Track"
                        />
                    </button>
                    {playing() ? (
                        <button
                            class="media-button button"
                            onClick={() => pause()}
                        >
                            <img
                                class="pause-button"
                                src="/img/pause-button-white.svg"
                                alt="Pause"
                            />
                        </button>
                    ) : (
                        <button
                            class="media-button button"
                            onClick={() => play()}
                        >
                            <img
                                class="play-button"
                                src="/img/play-button-white.svg"
                                alt="Play"
                            />
                        </button>
                    )}
                    <button
                        class="media-button button"
                        onClick={() => nextTrack()}
                    >
                        <img
                            class="next-track-button"
                            src="/img/next-button-white.svg"
                            alt="Next Track"
                        />
                    </button>
                </div>
                <div class="player-media-controls-seeker">
                    <div class="player-media-controls-seeker-current-time">
                        {toTime(currentSeek() ?? 0)}
                    </div>
                    <div class="player-media-controls-seeker-bar">
                        <div
                            ref={progressBar}
                            class="player-media-controls-seeker-bar-progress"
                            style={{
                                width: `${Math.min(
                                    ((applyDrag() && dragging()
                                        ? getSeekPosition()!
                                        : (currentSeek() ?? 0) +
                                          (currentSeek() ?? 0) /
                                              currentTrackLength()) /
                                        currentTrackLength()) *
                                        100,
                                    100,
                                )}%`,
                            }}
                        ></div>
                        <div
                            ref={progressBarTrigger}
                            class="player-media-controls-seeker-bar-progress-trigger"
                            onClick={(e) => seekTo(e)}
                        ></div>
                        <div
                            class="player-media-controls-seeker-bar-progress-tooltip"
                            style={{
                                left: `${
                                    (getSeekPosition() / currentTrackLength()) *
                                    100
                                }%`,
                            }}
                        >
                            {toTime(Math.round(getSeekPosition()))}
                        </div>
                    </div>
                    <div class="player-media-controls-seeker-total-time">
                        {toTime(currentTrackLength())}
                    </div>
                </div>
            </div>
            <div class="player-track-options"></div>
        </div>
    );
}
