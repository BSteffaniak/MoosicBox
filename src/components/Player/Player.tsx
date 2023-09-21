import './Player.css';
import { nextTrack, pause, play, playing, playlist, playlistPosition, previousTrack, setPlaying, setPlaylistPosition, setSound, sound } from '~/services/player';

export default function Player() {

    return (
        <div class="player">
            <button
                class="media-button button"
                onClick={() => previousTrack()}
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
            <button class="media-button button" onClick={() => nextTrack()}>
                <img
                    class="next-track-button"
                    src="/img/next-button.svg"
                    alt="Pause"
                />
            </button>
        </div>
    );
}
