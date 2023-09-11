import {
    nextTrack,
    pause,
    play,
    previousTrack,
    restartPlayer,
    startPlayer,
    stopPlayer,
} from "~/services/api";
import { currentPlayerId, playing, setPlaying } from "~/services/player";
import "./Player.css";

export default function Player() {
    async function togglePlay() {
        if (playing()) {
            await pause(currentPlayerId()!);
        } else {
            await play(currentPlayerId()!);
        }
        setPlaying(!playing());
    }

    return (
        <div class="player">
            <button
                class="media-button button"
                onClick={() => previousTrack(currentPlayerId()!)}
            >
                <img
                    class="previous-track-button"
                    src="/img/next-button.svg"
                    alt="Pause"
                />
            </button>
            <button class="media-button button" onClick={() => togglePlay()}>
                {playing() ? (
                    <img
                        class="pause-button"
                        src="/img/pause-button.svg"
                        alt="Pause"
                    />
                ) : (
                    <img
                        class="play-button"
                        src="/img/play-button.svg"
                        alt="Play"
                    />
                )}
            </button>
            <button
                class="media-button button"
                onClick={() => nextTrack(currentPlayerId()!)}
            >
                <img
                    class="next-track-button"
                    src="/img/next-button.svg"
                    alt="Pause"
                />
            </button>
        </div>
    );
}
