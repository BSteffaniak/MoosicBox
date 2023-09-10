import { onMount } from "solid-js";
import { initConnection } from "~/services/player";
import Player from "~/components/Player";
import "./index.css";

export default function Home() {
    onMount(initConnection);
    return (
        <main>
            <h1>Music Player</h1>
            <Player />
        </main>
    );
}
