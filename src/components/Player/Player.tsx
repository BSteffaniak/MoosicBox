import * as api from '~/services/api';
import { playing, setPlaying } from '~/services/player';
import './Player.css';

export default function Player() {
    async function play() {
        await api.play();
        setPlaying(true);
    }

    async function pause() {
        await api.pause();
        setPlaying(false);
    }

    return (
        <div class="player">
            <button
                class="media-button button"
                onClick={() => api.previousTrack()}
            >
                <img
                    class="previous-track-button"
                    src="/img/next-button.svg"
                    alt="Pause"
                />
            </button>
            {playing() ? (
                <button class="media-button button" onClick={() => pause()}>
                    <img
                        class="pause-button"
                        src="/img/pause-button.svg"
                        alt="Pause"
                    />
                </button>
            ) : (
                <button class="media-button button" onClick={() => play()}>
                    <img
                        class="play-button"
                        src="/img/play-button.svg"
                        alt="Play"
                    />
                </button>
            )}
            <button class="media-button button" onClick={() => api.nextTrack()}>
                <img
                    class="next-track-button"
                    src="/img/next-button.svg"
                    alt="Pause"
                />
            </button>
        </div>
    );
}
