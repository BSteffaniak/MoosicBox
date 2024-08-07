import './audio-zones.css';
import { produce } from 'solid-js/store';
import { Index, createComputed, createSignal } from 'solid-js';
import { Api } from '~/services/api';
import {
    playerState,
    setCurrentAudioZoneId,
    setPlayerState,
} from '~/services/player';

export default function audioZonesFunc() {
    const [audioZones, setAudioZones] = createSignal<Api.AudioZone[]>(
        playerState.audioZones,
    );
    const [activeAudioZone, setActiveAudioZone] = createSignal(
        playerState.currentAudioZone,
    );

    createComputed(() => {
        setAudioZones(playerState.audioZones);
        setActiveAudioZone(playerState.currentAudioZone);
    });

    function activateAudioZone(zone: Api.AudioZone) {
        setPlayerState(
            produce((state) => {
                state.currentAudioZone = zone;
                setCurrentAudioZoneId(zone.id);
            }),
        );
    }

    return (
        <div class="audio-zones">
            <div class="audio-zones-list-modal-content">
                <Index each={audioZones()}>
                    {(audioZone) => (
                        <div
                            class={`audio-zones-list-zone${
                                audioZone().id === activeAudioZone()?.id
                                    ? ' active'
                                    : ''
                            }`}
                        >
                            <h2
                                onClick={() => activateAudioZone(audioZone())}
                                class="audio-zones-list-zone-header"
                            >
                                {audioZone().name}
                            </h2>
                            <Index each={audioZone().players}>
                                {(player) => (
                                    <div
                                        class={`audio-zone-audio-zone-modal-audio-zone-player`}
                                    >
                                        <img
                                            class="audio-icon"
                                            src="/img/audio-white.svg"
                                            alt="Zone Player"
                                        />{' '}
                                        {player().name}
                                    </div>
                                )}
                            </Index>
                        </div>
                    )}
                </Index>
            </div>
        </div>
    );
}
