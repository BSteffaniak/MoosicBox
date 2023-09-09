import { pause, play, restartPlayer, startPlayer, stopPlayer } from "~/services/api";
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
        <>
            {currentPlayerId() ? (
                <>
                    <button class="increment" onClick={() => togglePlay()}>
                        {playing() ? "Pause" : "Play"}
                    </button>
                    <button
                        class="increment"
                        onClick={() => stopPlayer(currentPlayerId()!)}
                    >
                        Stop player
                    </button>
                    <button
                        class="increment"
                        onClick={() => startPlayer(currentPlayerId()!)}
                    >
                        Start player
                    </button>
                    <button
                        class="increment"
                        onClick={() => restartPlayer(currentPlayerId()!)}
                    >
                        Restart player
                    </button>
                </>
            ) : (
                <div>loading... {currentPlayerId()}</div>
            )}
        </>
    );
}
