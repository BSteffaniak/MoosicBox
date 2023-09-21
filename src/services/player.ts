import { createSignal } from 'solid-js';
import { Howl } from 'howler';
import { makePersisted } from '@solid-primitives/storage';

export const [currentPlayerId, setCurrentPlayerId] = createSignal<string>();
export const [sound, setSound] = createSignal<Howl>();
export const [playing, setPlaying] = makePersisted(createSignal(false), {
    name: 'player.playing',
});
export const [playlistPosition, setPlaylistPosition] = makePersisted(
    createSignal<number>(0),
    { name: 'player.playlistPosition' },
);
export const [playlist, setPlaylist] = makePersisted(
    createSignal<string[]>([]),
    { name: 'player.playlist' },
);

export async function play() {
    if (!sound()) {
        setSound(
            new Howl({
                src: [playlist()![playlistPosition()]],
                html5: true,
            }),
        );
        sound()!.pannerAttr({ panningModel: 'equalpower' });
    }
    sound()!.play();
    sound()!.on('end', () => {
        nextTrack();
    });
    setPlaying(true);
}

export async function pause() {
    sound()?.pause();
    setPlaying(false);
}

export async function previousTrack() {
    if ((sound()?.seek() ?? 0) < 5) {
        setPlaylistPosition((value) => (value > 0 ? value - 1 : value));
        sound()?.stop();
        sound()?.unload();
        setSound(undefined);
    } else {
        sound()!.seek(0);
    }
    play();
}

export async function nextTrack() {
    sound()?.stop();
    sound()?.unload();
    setSound(undefined);

    if (playlistPosition() < playlist()!.length - 1) {
        setPlaylistPosition((value) => value + 1);
        play();
    }
}
