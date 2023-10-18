import { A, Outlet } from 'solid-start';
import { Show, onMount } from 'solid-js';
import Player from '~/components/Player';
import './(global)/global.css';
import {
    setShowPlaybackSessions,
    showPlaybackSessions,
    triggerStartup,
} from '~/services/app';
import { Api } from '~/services/api';
import '~/services/ws';
import PlaybackSessions from '~/components/PlaybackSessions';

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
                <Show when={showPlaybackSessions()}>
                    <div
                        class="playback-sessions-modal-container"
                        onClick={() => setShowPlaybackSessions(false)}
                    >
                        <div
                            class="playback-sessions-modal"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div class="playback-sessions-modal-header">
                                <h1>Playback Sessions</h1>
                                <div
                                    class="playback-sessions-modal-close"
                                    onClick={(e) => {
                                        setShowPlaybackSessions(false);
                                        e.stopImmediatePropagation();
                                    }}
                                >
                                    <img
                                        class="cross-icon"
                                        src="/img/cross-white.svg"
                                        alt="Close playlist sessions modal"
                                    />
                                </div>
                            </div>
                            <div class="playback-sessions-modal-content">
                                <PlaybackSessions />
                            </div>
                        </div>
                    </div>
                </Show>
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
