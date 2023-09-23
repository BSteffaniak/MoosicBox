import { Show } from 'solid-js';
import './Player.css';
import {
    currentAlbum,
    currentTrack,
    nextTrack,
    pause,
    play,
    playing,
    previousTrack,
} from '~/services/player';
import { A } from '@solidjs/router';
import { getAlbumArtwork } from '~/services/api';

export default function Player() {
    return (
        <div class="player">
            <div class="player-now-playing">
                <Show when={currentTrack()}>
                    {(currentTrack) => (
                        <>
                            <A href={`/albums/${currentTrack().albumId}`}>
                                <img
                                    class="player-album-icon"
                                    style={{ width: '70px', height: '70px' }}
                                    src={getAlbumArtwork(currentTrack())}
                                />
                            </A>
                            {currentTrack().title}
                        </>
                    )}
                </Show>
            </div>
            <div class="player-media-controls">
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
                    <button class="media-button button" onClick={() => pause()}>
                        <img
                            class="pause-button"
                            src="/img/pause-button-white.svg"
                            alt="Pause"
                        />
                    </button>
                ) : (
                    <button class="media-button button" onClick={() => play()}>
                        <img
                            class="play-button"
                            src="/img/play-button-white.svg"
                            alt="Play"
                        />
                    </button>
                )}
                <button class="media-button button" onClick={() => nextTrack()}>
                    <img
                        class="next-track-button"
                        src="/img/next-button-white.svg"
                        alt="Next Track"
                    />
                </button>
            </div>
            <div class="player-track-options"></div>
        </div>
    );
}
