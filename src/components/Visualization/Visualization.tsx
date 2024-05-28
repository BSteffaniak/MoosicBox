import {
    For,
    createComputed,
    createEffect,
    createSignal,
    on,
    onCleanup,
    onMount,
} from 'solid-js';
import './Visualization.css';
import {
    currentSeek,
    currentTrackLength,
    offNextTrack,
    offPreviousTrack,
    playing as playerPlaying,
    playerState,
    seek,
} from '~/services/player';
import { toTime } from '~/services/formatting';
import { isServer } from 'solid-js/web';
import { api, trackId } from '~/services/api';

const VIZ_HEIGHT = 40;
let visualizationData: number[] | undefined;
let visualizationPos = 0;
let mouseX: number;
let waitingForPlayback = true;
let targetPlaybackPos = 0;

function getTrackDuration() {
    return playerState.currentTrack?.duration ?? currentTrackLength();
}

function eventToSeekPosition(element: HTMLElement): number {
    if (!element) return 0;

    const pos = element.getBoundingClientRect()!;
    const percentage = Math.min(
        100,
        Math.max(0, (mouseX - pos.left) / pos.width),
    );
    return getTrackDuration() * percentage;
}

function seekTo(event: MouseEvent): void {
    const seekPos = Math.round(
        eventToSeekPosition(event.target as HTMLElement),
    );
    seek(seekPos, true);
    waitingForPlayback = true;
    targetPlaybackPos = seekPos;
}

let dragStartListener: (event: MouseEvent) => void;
let dragListener: (event: MouseEvent) => void;
let dragEndListener: (event: MouseEvent) => void;
let visibilityChangeListener: () => void;

enum BackToNowPlayingPosition {
    top = 'TOP',
    bottom = 'BOTTOM',
    none = 'NONE',
}

export default function player() {
    let progressBar: HTMLDivElement | undefined;
    let progressBarVisualizer: HTMLDivElement | undefined;
    let progressBarCursor: HTMLDivElement;
    let playlistSlideout: HTMLDivElement | undefined;
    let playlistSlideoutContentRef: HTMLDivElement | undefined;
    let backToNowPlayingTopRef: HTMLDivElement | undefined;
    let backToNowPlayingBottomRef: HTMLDivElement | undefined;
    let containerRef: HTMLDivElement | undefined;
    const [dragging, setDragging] = createSignal(false);
    const [applyDrag, setApplyDrag] = createSignal(false);
    const [seekPosition, setSeekPosition] = createSignal(currentSeek());
    const [playing, setPlaying] = createSignal(playerPlaying());

    const [data, setData] = createSignal<number[]>([]);

    createComputed(() => {
        setPlaying(playerState.currentPlaybackSession?.playing ?? false);
    });

    function getSeekPosition(): number {
        return Math.max(Math.min(seekPosition() ?? 0, getTrackDuration()), 0);
    }

    function getCurrentSeekPosition(): number {
        return Math.max(Math.min(currentSeek() ?? 0, getTrackDuration()), 0);
    }

    function getProgressBarWidth(): number {
        if (applyDrag() && dragging()) {
            return (getSeekPosition() / getTrackDuration()) * 100;
        }

        return (getCurrentSeekPosition() / getTrackDuration()) * 100;
    }

    onMount(() => {
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
                setSeekPosition(eventToSeekPosition(progressBarVisualizer!));
            };
            dragEndListener = (event: MouseEvent) => {
                if (event.button === 0 && dragging()) {
                    setDragging(false);
                    if (!applyDrag()) return;
                    setApplyDrag(false);
                    seek(Math.round(seekPosition()!), true);
                    progressBar?.classList.remove('no-transition');
                    event.preventDefault();
                }
            };

            visibilityChangeListener = () => {
                if (document.visibilityState !== 'hidden') {
                    animationStart = undefined;
                }
            };

            progressBarVisualizer?.addEventListener(
                'mousedown',
                dragStartListener,
            );
            window.addEventListener('mousemove', dragListener);
            window.addEventListener('mouseup', dragEndListener);
            document.addEventListener(
                'visibilitychange',
                visibilityChangeListener,
            );
        }
    });

    onCleanup(() => {
        if (!isServer) {
            progressBarVisualizer?.removeEventListener(
                'mousedown',
                dragStartListener,
            );
            window.removeEventListener('mousemove', dragListener);
            window.removeEventListener('mouseup', dragEndListener);
            document.removeEventListener(
                'visibilitychange',
                visibilityChangeListener,
            );
        }
    });

    createEffect(
        on(
            () => currentSeek(),
            (value) => {
                animationStart = document.timeline.currentTime as number;
                if (
                    waitingForPlayback &&
                    (value ?? 0) > targetPlaybackPos &&
                    (targetPlaybackPos === 0 ||
                        (value ?? 0) <= targetPlaybackPos + 1) &&
                    playing()
                ) {
                    console.debug('playback started');
                    waitingForPlayback = false;
                    animationStart = undefined;
                    startAnimation();
                }
            },
        ),
    );

    function resetVisualizationOpacity() {
        visualizationPos = 0;
        const children = progressBarVisualizer?.children;
        if (children && children.length > 0) {
            for (let i = 0; i < children.length; i++) {
                const child = children[i] as HTMLElement;
                if (child === progressBarCursor) continue;
                child.style.removeProperty('opacity');
            }
        }
    }

    function initVisualization() {
        if (!visualizationData) {
            throw new Error('No visualizationData set');
        }

        const delta = Math.max(1, visualizationData.length / window.innerWidth);

        const sizedData: number[] = [];

        for (let i = 0; i < visualizationData.length; i += delta) {
            sizedData.push(visualizationData[~~i]!);
        }

        setData(sizedData);

        resetVisualizationOpacity();
    }

    createEffect(
        on(
            () => playerState.currentTrack,
            async (track, prev) => {
                if (prev && track && trackId(prev) === trackId(track)) return;

                waitingForPlayback = true;
                targetPlaybackPos = 0;
                setData([]);
                resetVisualizationOpacity();

                if (track) {
                    const data: number[] =
                        await api.getTrackVisualization(track);
                    data.forEach((x, i) => {
                        data[i] = Math.max(
                            3,
                            Math.round((x / 255) * VIZ_HEIGHT),
                        );
                    });
                    visualizationData = data;

                    initVisualization();
                }
            },
        ),
    );

    createEffect(
        on(
            () => currentTrackLength(),
            () => {
                setSeekPosition(eventToSeekPosition(progressBarVisualizer!));
                updateVisualizationBarOpacity();
            },
        ),
    );

    createEffect(
        on(
            () => playing(),
            (playing) => {
                if (!playing) {
                    waitingForPlayback = true;
                    visualizationPos = 0;
                }
                if (dragging()) {
                    setApplyDrag(false);
                    progressBar?.classList.remove('no-transition');
                }
            },
        ),
    );

    let nextTrackListener: () => void;
    let previousTrackListener: () => void;

    onCleanup(() => {
        offNextTrack(nextTrackListener);
        offPreviousTrack(previousTrackListener);
    });

    const [backToNowPlayingPosition, setBackToNowPlayingPosition] =
        createSignal(BackToNowPlayingPosition.none);

    let backToNowPlayingTopTimeout: NodeJS.Timeout;
    let backToNowPlayingBottomTimeout: NodeJS.Timeout;
    const scrollListener = () => {
        if (!getCurrentTrack()) return;

        if (
            getCurrentTrack()!.getBoundingClientRect().top >
            playlistSlideout!.offsetHeight
        ) {
            clearTimeout(backToNowPlayingBottomTimeout);
            setBackToNowPlayingPosition(BackToNowPlayingPosition.bottom);
            backToNowPlayingTopRef!.style.opacity = '0';
            backToNowPlayingBottomRef!.style.display = 'block';
            setTimeout(() => {
                backToNowPlayingBottomRef!.style.opacity = '1';
            }, 0);
        } else if (getCurrentTrack()!.getBoundingClientRect().bottom < 0) {
            clearTimeout(backToNowPlayingTopTimeout);
            setBackToNowPlayingPosition(BackToNowPlayingPosition.top);
            backToNowPlayingBottomRef!.style.opacity = '0';
            backToNowPlayingTopRef!.style.display = 'block';
            setTimeout(() => {
                backToNowPlayingTopRef!.style.opacity = '1';
            }, 0);
        } else {
            backToNowPlayingTopRef!.style.opacity = '0';
            backToNowPlayingBottomRef!.style.opacity = '0';
            if (backToNowPlayingPosition() === BackToNowPlayingPosition.top) {
                backToNowPlayingTopTimeout = setTimeout(() => {
                    backToNowPlayingTopRef!.style.display = 'none';
                }, 300);
            } else if (
                backToNowPlayingPosition() === BackToNowPlayingPosition.bottom
            ) {
                backToNowPlayingBottomTimeout = setTimeout(() => {
                    backToNowPlayingBottomRef!.style.display = 'none';
                }, 300);
            }
            setBackToNowPlayingPosition(BackToNowPlayingPosition.none);
        }
    };

    onMount(() => {
        if (isServer) return;
        playlistSlideoutContentRef?.addEventListener('scroll', scrollListener);

        scrollListener();
    });

    onCleanup(() => {
        if (isServer) return;
        playlistSlideoutContentRef?.removeEventListener(
            'scroll',
            scrollListener,
        );
    });

    function getCurrentTrack(): Element | null {
        return (
            playlistSlideout?.querySelector('.playlist-tracks-track.current') ??
            null
        );
    }

    let animationStart: number | undefined;

    function progressAnimationFrame(ts: number): void {
        if (!animationStart) animationStart = ts;

        const elapsed = ts - animationStart;

        const duration = getTrackDuration();

        if (
            typeof currentSeek() !== 'undefined' &&
            typeof duration !== 'undefined'
        ) {
            const offset = (elapsed / 1000) * (1 / duration) * 100;

            updateVisualizationBarOpacity(offset);
        }

        if (!playing() || waitingForPlayback) {
            animationStart = undefined;
            console.debug('Stopping animation');

            return;
        }

        window.requestAnimationFrame(progressAnimationFrame);
    }

    function startAnimation() {
        window.requestAnimationFrame((ts) => {
            animationStart = ts;
            window.requestAnimationFrame(progressAnimationFrame);
        });
    }

    function updateVisualizationBarOpacity(offset: number = 0) {
        if (waitingForPlayback) {
            return;
        }

        const pastOpacity = 0.1;
        const width = getProgressBarWidth();
        const children = progressBarVisualizer?.children;

        progressBarCursor.style.left = `${width + offset}%`;

        if (children && children.length > 0) {
            for (let i = visualizationPos + 1; i < children.length; i++) {
                const child = children[i] as HTMLElement;
                if (child === progressBarCursor) continue;
                const pos = (i / children.length) * 100;

                if (pos <= width + offset) {
                    child.style.opacity = `${pastOpacity}`;
                    visualizationPos = i;
                    continue;
                }

                if (playing()) {
                    const sliceSize = Math.max(
                        0.5,
                        children.length / window.innerWidth,
                    );
                    if (pos <= width + offset + sliceSize) {
                        const percent = (pos - (width + offset)) / sliceSize;
                        child.style.opacity = `${pastOpacity + percent * (1 - pastOpacity)}`;
                        continue;
                    }
                }
                if (child.style.opacity) {
                    child.style.removeProperty('opacity');
                    continue;
                }

                break;
            }
        }
    }

    return (
        <>
            <div ref={containerRef!} class="visualization">
                <div class="visualization-media-controls-seeker-bar">
                    <div
                        ref={progressBarVisualizer!}
                        class="visualization-media-controls-seeker-bar-progress-trigger visualization-media-controls-seeker-bar-visualizer"
                        style={{
                            top: `-${Math.round(VIZ_HEIGHT / 2) - 2}px`,
                            height: `${VIZ_HEIGHT}px`,
                        }}
                        onClick={(e) => seekTo(e)}
                    >
                        <div
                            ref={progressBarCursor!}
                            class="visualization-media-controls-seeker-bar-cursor"
                            style={{
                                height: `${VIZ_HEIGHT}px`,
                            }}
                        ></div>
                        <For each={data()}>
                            {(point) => (
                                <div
                                    class="visualization-media-controls-seeker-bar-visualizer-bar"
                                    style={{
                                        height: `${point}px`,
                                    }}
                                ></div>
                            )}
                        </For>
                    </div>
                    <div
                        class="visualization-media-controls-seeker-bar-progress-tooltip"
                        style={{
                            left: `max(30px, min(100vw - 40px, ${
                                (getSeekPosition() / getTrackDuration()) * 100
                            }%))`,
                            display:
                                applyDrag() && dragging() ? 'block' : undefined,
                        }}
                    >
                        {toTime(Math.round(getSeekPosition()))}
                    </div>
                </div>
            </div>
        </>
    );
}
