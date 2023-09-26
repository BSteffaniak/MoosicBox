import { onMount } from 'solid-js';
import { Outlet } from 'solid-start';
import { initConnection } from '~/services/api';
import Player from '~/components/Player';
import './(global)/global.css';

export default function global() {
    onMount(initConnection);
    return (
        <div id="root" class="dark">
            <main>
                <Outlet />
            </main>
            <footer>
                <div class="footer-player-container">
                    <div class="footer-player">
                        <Player />
                    </div>
                </div>
            </footer>
        </div>
    );
}
