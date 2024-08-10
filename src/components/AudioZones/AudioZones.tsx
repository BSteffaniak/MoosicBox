import './audio-zones.css';
import { produce } from 'solid-js/store';
import { Index, createComputed, createSignal } from 'solid-js';
import { api, Api } from '~/services/api';
import {
    playerState,
    setCurrentAudioZoneId,
    setPlayerState,
} from '~/services/player';
import { appState } from '~/services/app';

type AudioZoneWithConnections = Omit<Api.AudioZone, 'players'> & {
    players: (Api.Player & {
        connection: Api.Connection | undefined;
    })[];
};

export default function audioZonesFunc() {
    let audioZoneNameRef: HTMLInputElement | undefined;

    const [audioZones, setAudioZones] = createSignal<
        AudioZoneWithConnections[]
    >([]);
    const [activeAudioZone, setActiveAudioZone] = createSignal(
        playerState.currentAudioZone,
    );
    const [editingAudioZoneName, setEditingAudioZoneName] =
        createSignal<Api.UpdateAudioZone>();

    createComputed(() => {
        const connections = appState.connections;
        setAudioZones(
            playerState.audioZones.map((zone) => {
                const zoneWithConnections: AudioZoneWithConnections = {
                    ...zone,
                    players: zone.players.map((player) => {
                        return {
                            ...player,
                            connection: connections.find((c) => {
                                return c.players?.find(
                                    (p) => p.playerId === player.playerId,
                                );
                            }),
                        };
                    }),
                };
                return zoneWithConnections;
            }),
        );
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

    async function updateAudioZone(update: Api.UpdateAudioZone) {
        setPlayerState(
            produce((state) => {
                if (state.currentAudioZone?.id === update.id) {
                    Object.assign(state.currentAudioZone, update);
                }

                const zone = state.audioZones.find((z) => z.id === update.id);

                if (zone) {
                    Object.assign(zone, update);
                }
            }),
        );

        await api.updateAudioZone(update);
    }

    async function deleteAudioZone(zone: Api.AudioZone) {
        let index: number | undefined;

        setPlayerState(
            produce((state) => {
                if (zone.id === state.currentAudioZone?.id) {
                    const newZone = state.audioZones[0];
                    state.currentAudioZone = newZone;
                    setCurrentAudioZoneId(newZone?.id);
                }

                index = state.audioZones.findIndex((x) => x.id === zone.id);
                state.audioZones.splice(index, 1);
            }),
        );

        await api.deleteAudioZone(zone.id);
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
                                {editingAudioZoneName()?.id ===
                                audioZone().id ? (
                                    <>
                                        <input
                                            ref={audioZoneNameRef!}
                                            autofocus
                                            onClick={(e) =>
                                                e.stopImmediatePropagation()
                                            }
                                            type="text"
                                            value={
                                                editingAudioZoneName()!.name ??
                                                ''
                                            }
                                            onKeyUp={async (e) => {
                                                if (e.key !== 'Enter') return;

                                                e.stopImmediatePropagation();
                                                editingAudioZoneName()!.name =
                                                    audioZoneNameRef!.value;
                                                await updateAudioZone(
                                                    editingAudioZoneName()!,
                                                );
                                                setEditingAudioZoneName(
                                                    undefined,
                                                );
                                            }}
                                        />
                                        <button
                                            class="remove-button-styles audio-zones-list-zone-header-submit-edit-name"
                                            onClick={async (e) => {
                                                e.stopImmediatePropagation();
                                                editingAudioZoneName()!.name =
                                                    audioZoneNameRef!.value;
                                                await updateAudioZone(
                                                    editingAudioZoneName()!,
                                                );
                                                setEditingAudioZoneName(
                                                    undefined,
                                                );
                                            }}
                                        >
                                            <img
                                                class="audio-zones-list-zone-header-submit-edit-name-icon"
                                                src="/img/checkmark-white.svg"
                                                alt="Submit audio zone name"
                                            />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {audioZone().name}
                                        <button
                                            class="remove-button-styles audio-zones-list-zone-header-edit-name"
                                            onClick={(e) => {
                                                e.stopImmediatePropagation();
                                                setEditingAudioZoneName({
                                                    id: audioZone().id,
                                                    name: audioZone().name,
                                                });
                                            }}
                                        >
                                            <img
                                                class="audio-zones-list-zone-header-edit-name-icon"
                                                src="/img/pencil-white.svg"
                                                alt="Edit audio zone name"
                                            />
                                        </button>
                                    </>
                                )}
                                <div class="audio-zones-list-zone-header-right">
                                    <div
                                        class="audio-zones-list-zone-header-delete-zone"
                                        onClick={async (e) => {
                                            e.stopImmediatePropagation();
                                            await deleteAudioZone(audioZone());
                                        }}
                                    >
                                        <img
                                            class="trash-icon"
                                            src="/img/trash-white.svg"
                                            alt="Delete playback session"
                                        />
                                    </div>
                                </div>
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
                                        {player().connection?.name} -{' '}
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
