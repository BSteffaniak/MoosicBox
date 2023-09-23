import { Show, createSignal, onMount } from 'solid-js';
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

function seekTo(event: MouseEvent): void {
    const element = event.target as HTMLElement;
    const pos = element.getBoundingClientRect()!;
    const mouseX = event.clientX - pos.left;
    const percentage = mouseX / pos.width;
    const seekPosition = currentTrackLength() * percentage;
    seek(Math.round(seekPosition));
}

export default function Player() {
    onMount(() => {
        setCurrentTrackLength(currentTrackLength());
        setCurrentAlbum(currentAlbum());
        setCurrentTrack(currentTrack());
        setCurrentSeek(currentSeek());
    });
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
                            class="player-media-controls-seeker-bar-progress"
                            style={{
                                width: `${Math.min(
                                    ((currentSeek() ?? 0) /
                                        currentTrackLength()) *
                                        100,
                                    100,
                                )}%`,
                            }}
                        ></div>
                        <div
                            class="player-media-controls-seeker-bar-progress-trigger"
                            onClick={(e) => seekTo(e)}
                        ></div>
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
