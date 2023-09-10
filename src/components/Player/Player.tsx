import { Show } from "solid-js";
import {
    pause,
    play,
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
        <Show
            when={currentPlayerId()}
            fallback={<div>Connecting...</div>}
            keyed
        >
            {(playerId) => (
                <>
                    <button class="button" onClick={() => togglePlay()}>
                        {playing() ? "Pause" : "Play"}
                    </button>
                    <button class="button" onClick={() => stopPlayer(playerId)}>
                        Stop player
                    </button>
                    <button
                        class="button"
                        onClick={() => startPlayer(playerId)}
                    >
                        Start player
                    </button>
                    <button
                        class="button"
                        onClick={() => restartPlayer(playerId)}
                    >
                        Restart player
                    </button>
                </>
            )}
        </Show>
    );
}
