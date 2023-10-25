import { A, Outlet } from 'solid-start';
import { onMount } from 'solid-js';
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
import {
    connectionName,
    createSession,
    setConnectionName,
} from '~/services/ws';
import Modal from '~/components/Modal/Modal';
import {
    isMasterPlayer,
    isPlayerActive,
    playerState,
    setVolume,
    volume,
} from '~/services/player';

export default function global() {
    onMount(async () => {
        await triggerStartup();
    });

    let apiUrlInput: HTMLInputElement;

    function saveApiUrl() {
        Api.setApiUrl(apiUrlInput.value);
    }

    let connectionNameInput: HTMLInputElement;

    function saveConnectionName() {
        setConnectionName(connectionNameInput.value);
    }

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

        setVolume(newVolume);
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
                        <input
                            ref={apiUrlInput!}
                            type="text"
                            value={Api.apiUrl()}
                            onKeyUp={(e) => e.key === 'Enter' && saveApiUrl()}
                        />
                        <button onClick={saveApiUrl}>save</button>
                    </li>
                    <li>
                        <input
                            ref={connectionNameInput!}
                            type="text"
                            value={connectionName()}
                            onKeyUp={(e) =>
                                e.key === 'Enter' && saveConnectionName()
                            }
                        />
                        <button onClick={saveConnectionName}>save</button>
                    </li>
                    <li>
                        <input
                            ref={volumeInput!}
                            type="number"
                            value={volume()}
                            min="0"
                            max="100"
                            onChange={(e) =>
                                saveVolume(parseInt(e.target.value))
                            }
                            onKeyUp={(e) =>
                                e.key === 'Enter' &&
                                saveVolume(parseInt(volumeInput.value))
                            }
                        />
                        <button
                            onClick={() =>
                                saveVolume(parseInt(volumeInput.value))
                            }
                        >
                            save
                        </button>
                    </li>
                </ul>
                {isMasterPlayer() ? 'master' : 'slave'}{' '}
                {isPlayerActive() ? 'active' : 'inactive'}
                <Outlet />
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
