import { createSignal } from 'solid-js';
import { Howl } from 'howler';
import { makePersisted } from '@solid-primitives/storage';
import { Album, Track, apiUrl, getAlbumTracks } from './api';
import { isServer } from 'solid-js/web';

export const [currentPlayerId, setCurrentPlayerId] = createSignal<string>();
export const [sound, setSound] = createSignal<Howl>();
export const [playing, setPlaying] = makePersisted(createSignal(false), {
    name: `player.v1.playing`,
});
export const [currentSeek, setCurrentSeek] = makePersisted(
    createSignal<number>(),
    {
        name: `player.v1.currentSeek`,
    },
);
export const [currentAlbum, setCurrentAlbum] = makePersisted(
    createSignal<Album>(),
    {
        name: `player.v2.currentAlbum`,
    },
);
export const [currentTrack, setCurrentTrack] = makePersisted(
    createSignal<Track>(),
    {
        name: `player.v2.currentTrack`,
    },
);
export const [playlistPosition, setPlaylistPosition] = makePersisted(
    createSignal<number>(0),
    { name: `player.v1.playlistPosition` },
);
export const [playlist, setPlaylist] = makePersisted(
    createSignal<Track[]>([]),
    { name: `player.v1.playlist` },
);

if (!isServer) {
    window.onbeforeunload = () => {
        refreshCurrentSeek();
    };

    if (import.meta.hot) {
        import.meta.hot.on('vite:beforeUpdate', () => {
            refreshCurrentSeek();
        });
    }
}

function getTrackUrl(track: Track): string {
    return `${apiUrl()}/track?trackId=${track.trackId}`;
}

function refreshCurrentSeek() {
    const seek = sound()?.seek();
    if (typeof seek === 'number') {
        const roundedSeek = Math.round(seek);
        console.debug(`Setting currentSeek to ${roundedSeek}`);
        setCurrentSeek(roundedSeek);
    }
}

let seekHandle: NodeJS.Timeout;

export function play() {
    if (!sound()) {
        const track = playlist()![playlistPosition()];
        setSound(
            new Howl({
                src: [getTrackUrl(track)],
                html5: true,
            }),
        );
        if (navigator && navigator.mediaSession) {
            navigator.mediaSession.setActionHandler('play', () => play());
            navigator.mediaSession.setActionHandler('pause', () => pause());
            navigator.mediaSession.setActionHandler('stop', () => stop());
            navigator.mediaSession.setActionHandler('nexttrack', () =>
                nextTrack(),
            );
            navigator.mediaSession.setActionHandler('previoustrack', () =>
                previousTrack(),
            );
        }
        sound()!.pannerAttr({ panningModel: 'equalpower' });
        setCurrentTrack(track);
    }

    sound()!.on('end', () => {
        console.debug('Track ended');
        setCurrentSeek(undefined);
        clearInterval(seekHandle);
        nextTrack();
    });

    sound()!.play();

    if (typeof currentSeek() === 'number') {
        console.debug(`Setting initial seek to ${currentSeek()}`);
        sound()!.seek(currentSeek());
    } else {
        setCurrentSeek(Math.round(sound()!.seek()));
    }

    seekHandle = setInterval(() => {
        refreshCurrentSeek();
    }, 1000);

    setPlaying(true);
    console.debug('Playing', sound());
}

export function seek(seek: number) {
    console.debug('Track seeked');
    if (typeof seek === 'number') {
        console.debug(`Setting seek to ${seek}`);
        setCurrentSeek(seek);
    }
}

export function pause() {
    sound()?.pause();
    setPlaying(false);
    clearInterval(seekHandle);
    console.debug('Paused');
}

export async function previousTrack() {
    if ((sound()?.seek() ?? 0) < 5) {
        console.debug('Playing previous track');
        setPlaylistPosition((value) => (value > 0 ? value - 1 : value));
        stop();
        play();
    } else {
        console.debug('Setting track position to 0');
        sound()!.seek(0);
    }
}

export async function nextTrack() {
    stop();

    if (playlistPosition() < playlist()!.length - 1) {
        console.debug('Playing next track');
        setPlaylistPosition((value) => value + 1);
        play();
    } else {
        console.debug('No next track to play');
        stop();
    }
}

export function stop() {
    sound()?.stop();
    sound()?.unload();
    setSound(undefined);
    setCurrentSeek(undefined);
    clearInterval(seekHandle);
    setPlaying(false);
    console.debug('Track stopped');
}

export async function playAlbum(album: Album) {
    setCurrentAlbum(album);

    const tracks = await getAlbumTracks(album.albumId);

    setPlaylistPosition(0);
    setPlaylist(tracks);
    stop();
    play();
}

export async function addAlbumToQueue(album: Album) {
    const tracks = await getAlbumTracks(album.albumId);

    setPlaylist([...playlist()!, ...tracks]);
}

if (!isServer) {
    document.body.onkeydown = function (e) {
        if (e.key == ' ' || e.code == 'Space') {
            if (playing()) {
                pause();
            } else {
                play();
            }
            e.preventDefault();
        }
    };
}
