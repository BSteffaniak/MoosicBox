import { isServer } from "solid-js/web";
import Player from "~/components/Player";
import { connect } from "~/services/api";
import { setCurrentPlayerId } from "~/services/player";
import "./index.css";

(async () => {
    if (isServer) return;
    const connection = await connect();
    setCurrentPlayerId(connection.players[0]);
})();

export default function Home() {
    return (
        <main>
            <h1>Music Player</h1>
            <Player />
        </main>
    );
}
