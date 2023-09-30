import { A, Outlet } from 'solid-start';
import { onMount } from 'solid-js';
import Player from '~/components/Player';
import './(global)/global.css';
import { triggerStartup } from '~/services/app';
import { Api } from '~/services/api';

export default function global() {
    onMount(async () => {
        await triggerStartup();
    });

    let apiUrlInput: HTMLInputElement;

    function saveApiUrl() {
        console.log(apiUrlInput.value);
        Api.setApiUrl(apiUrlInput.value);
    }

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
                    <li>
                        <A href="/artists">Artists</A>
                    </li>
                    <li>
                        <input
                            ref={apiUrlInput!}
                            type="text"
                            value={Api.apiUrl()}
                            onKeyUp={(e) => e.key === 'Enter' && saveApiUrl()}
                        />
                        <button onClick={saveApiUrl}>save</button>
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
