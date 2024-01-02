import { A, Outlet } from 'solid-start';
import { onMount } from 'solid-js';
import Player from '~/components/Player';
import './(global)/global.css';
import {
    setShowPlaybackQuality,
    setShowPlaybackSessions,
    showPlaybackQuality,
    showPlaybackSessions,
    triggerStartup,
} from '~/services/app';
import '~/services/ws';
import PlaybackSessions from '~/components/PlaybackSessions';
import { createSession } from '~/services/ws';
import Modal from '~/components/Modal/Modal';
import { playerState } from '~/services/player';
import PlaybackQuality from '~/components/PlaybackQuality';

export default function global() {
    onMount(async () => {
        await triggerStartup();
    });

    function createNewSession() {
        createSession({
            name: 'New Session',
            playlist: {
                tracks: [],
            },
            activePlayers:
                playerState.currentPlaybackSession?.activePlayers.map(
                    (p) => p.playerId,
                ) ?? [],
        });
    }

    return (
        <div id="root" class="dark">
            <section class="navigation-bar-and-main-content">
                <aside class="navigation-bar-container">
                    <div class="navigation-bar">
                        <div class="navigation-bar-header">
                            <h1>MoosicBox</h1>
                            <A class="settings-link" href="/settings">
                                <img
                                    class="settings-gear-icon"
                                    src="/img/settings-gear-white.svg"
                                />
                            </A>
                        </div>
                        <ul>
                            <li>
                                <A href="/">Home</A>
                            </li>
                        </ul>
                        <h1 class="my-collection-header">My Collection</h1>
                        <ul>
                            <li>
                                <A href="/albums">Albums</A>
                            </li>
                            <li>
                                <A href="/artists">Artists</A>
                            </li>
                        </ul>
                    </div>
                </aside>
                <main class="main-content">
                    <Outlet />
                    <Modal
                        show={() => showPlaybackQuality()}
                        onClose={() => setShowPlaybackQuality(false)}
                    >
                        <div class="playback-quality-modal-container">
                            <div class="playback-quality-modal-header">
                                <h1>Playback Quality</h1>
                                <div
                                    class="playback-quality-modal-close"
                                    onClick={(e) => {
                                        setShowPlaybackQuality(false);
                                        e.stopImmediatePropagation();
                                    }}
                                >
                                    <img
                                        class="cross-icon"
                                        src="/img/cross-white.svg"
                                        alt="Close playlist quality modal"
                                    />
                                </div>
                            </div>
                            <div class="playback-quality-modal-content">
                                <PlaybackQuality />
                            </div>
                        </div>
                    </Modal>
                    <Modal
                        show={() => showPlaybackSessions()}
                        onClose={() => setShowPlaybackSessions(false)}
                    >
                        <div class="playback-sessions-modal-container">
                            <div class="playback-sessions-modal-header">
                                <h1>Playback Sessions</h1>
                                <button
                                    class="playback-sessions-modal-header-new-button"
                                    onClick={() => createNewSession()}
                                >
                                    New
                                </button>
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
                    </Modal>
                </main>
            </section>
            <footer class="footer-player-footer">
                <div class="footer-player-container">
                    <div class="footer-player">
                        <Player />
                    </div>
                </div>
            </footer>
        </div>
    );
}
