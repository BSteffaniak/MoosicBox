import { A, Outlet } from 'solid-start';
import { onMount } from 'solid-js';
import Player from '../components/Player';
import './(global)/global.css';
import { triggerStartup } from '../services/app';

export default function global() {
    onMount(async () => {
        await triggerStartup();
    });
    return (
        <div id="root" class="dark">
            <main>
                <ul>
                    <li>
                        <A href="/">Home</A>
                    </li>
                    <li>
                        <A href="/albums">Albums</A>
                    </li>
                </ul>
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
