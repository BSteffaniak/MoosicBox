import { onMount } from 'solid-js';
import { Outlet } from 'solid-start';
import { initConnection } from '~/services/player';
import Player from '~/components/Player';
import './(home)/home.css';

export default function Home() {
    onMount(initConnection);
    return (
        <div id="root">
            <main>
                <h1>Music Player</h1>
                <Outlet />
            </main>
            <footer>
                <div class="footer-player">
                    <Player />
                </div>
            </footer>
        </div>
    );
}
