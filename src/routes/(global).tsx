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
import { playerState, setVolume } from '~/services/player';
import PlaybackQuality from '~/components/PlaybackQuality';

export default function global() {
    onMount(async () => {
        await triggerStartup();
    });

    let volumeInput: HTMLInputElement;

    function saveVolume(value: number) {
        if (isNaN(value)) {
            volumeInput.value = '100';
            return;
        }
        let newVolume = value;
        if (value > 100) {
            newVolume = 100;
        } else if (value < 0) {
            newVolume = 0;
        }
        if (newVolume !== value) {
            volumeInput.value = `${newVolume}`;
        }

        setVolume(newVolume / 100);
    }

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
                        <A href="/settings">Settings</A>
                    </li>
                    <li>
                        Volume:{' '}
                        <input
                            ref={volumeInput!}
                            type="number"
                            value={Math.round(
                                Math.max(
                                    0,
                                    Math.min(
                                        100,
                                        (playerState.currentPlaybackSession
                                            ?.volume ?? 1) * 100,
                                    ),
                                ),
                            )}
                            min="0"
                            max="100"
                            onChange={(e) =>
                                saveVolume(parseInt(e.target.value))
                            }
                        />
                    </li>
                </ul>
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
