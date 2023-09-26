import { createSignal, onMount } from 'solid-js';
import { Howl, HowlCallback } from 'howler';
import { makePersisted } from '@solid-primitives/storage';
import { Album, Track, apiUrl, getAlbumTracks } from './api';
import { isServer } from 'solid-js/web';

export const [currentPlayerId, setCurrentPlayerId] = createSignal<string>();
export const [sound, setSound] = createSignal<Howl>();
export const [playing, setPlaying] = makePersisted(
    createSignal(false, { equals: false }),
    {
        name: `player.v1.playing`,
    },
);
export const [currentSeek, setCurrentSeek] = makePersisted(
    createSignal<number | undefined>(undefined, { equals: false }),
    {
        name: `player.v1.currentSeek`,
    },
);
export const [currentTrackLength, setCurrentTrackLength] = makePersisted(
    createSignal<number>(0, { equals: false }),
    {
        name: `player.v1.currentTrackLength`,
    },
);
export const [currentAlbum, setCurrentAlbum] = makePersisted(
    createSignal<Album | Track | undefined>(undefined, { equals: false }),
    {
        name: `player.v2.currentAlbum`,
    },
);
export const [currentTrack, setCurrentTrack] = makePersisted(
    createSignal<Track | undefined>(undefined, { equals: false }),
    {
        name: `player.v2.currentTrack`,
    },
);
export const [playlistPosition, setPlaylistPosition] = makePersisted(
    createSignal<number>(0, { equals: false }),
    { name: `player.v1.playlistPosition` },
);
export const [playlist, setPlaylist] = makePersisted(
    createSignal<Track[]>([], { equals: false }),
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
        if (currentSeek() !== roundedSeek) {
            console.debug(`Setting currentSeek to ${roundedSeek}`);
            setCurrentSeek(roundedSeek);
        }
    }
}

let seekHandle: NodeJS.Timeout;
let endHandle: HowlCallback;
let loadHandle: HowlCallback;

function setTrack() {
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
}

export function play() {
    setTrack();

    sound()!.on(
        'end',
        (endHandle = (id: number) => {
            console.debug('Track ended', sound(), id);
            setCurrentSeek(undefined);
            clearInterval(seekHandle);
            nextTrack();
        }),
    );
    sound()!.on(
        'load',
        (loadHandle = () => {
            console.debug('Track loaded', sound(), sound()!.duration());
            setCurrentTrackLength(Math.round(sound()!.duration()));
        }),
    );

    sound()!.play();

    if (typeof currentSeek() === 'number') {
        console.debug(`Setting initial seek to ${currentSeek()}`);
        sound()!.seek(currentSeek());
    }

    seekHandle = setInterval(() => {
        refreshCurrentSeek();
    }, 200);

    setPlaying(true);
    console.debug('Playing', sound());
}

export function seek(seek: number) {
    console.debug('Track seeked');
    if (typeof seek === 'number') {
        console.debug(`Setting seek to ${seek}`);
        setCurrentSeek(seek);
        sound()?.seek(seek);
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
        const shouldPlay = playing();
        stop();
        if (shouldPlay) play();
        else setTrack();
    } else {
        console.debug('Setting track position to 0');
        sound()!.seek(0);
    }
}

export async function nextTrack() {
    if (playlistPosition() < playlist()!.length - 1) {
        console.debug('Playing next track');
        setPlaylistPosition((value) => value + 1);
        const shouldPlay = playing();
        stop();
        if (shouldPlay) play();
        else setTrack();
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

export async function playAlbum(album: Album | Track) {
    setCurrentAlbum(album);

    const tracks = await getAlbumTracks(album.albumId);

    setPlaylistPosition(0);
    setPlaylist(tracks);
    stop();
    play();
}

export async function playPlaylist(tracks: Track[]) {
    const firstTrack = tracks[0];
    setCurrentAlbum(firstTrack);

    setPlaylistPosition(0);
    setPlaylist(tracks);
    stop();
    play();
}

export async function addAlbumToQueue(album: Album | Track) {
    const tracks = await getAlbumTracks(album.albumId);

    setPlaylist([...playlist()!, ...tracks]);
}

export function removeTrackFromPlaylist(index: number) {
    console.debug('Removing track from playlist', index);
    if (index < playlistPosition()) {
        setPlaylistPosition(playlistPosition() - 1);
    }
    setPlaylist([...playlist()!.filter((_, i) => i !== index)]);
}

export function playFromPlaylistPosition(index: number) {
    console.debug('Playing from playlist position', index);
    setPlaylistPosition(index);
    const shouldPlay = playing();
    stop();
    if (shouldPlay) play();
    else setTrack();
}

if (!isServer) {
    document.body.onkeydown = function (e) {
        const target = e.target as HTMLElement;

        if (
            !(target instanceof HTMLInputElement) &&
            (e.key == ' ' || e.code == 'Space')
        ) {
            if (playing()) {
                pause();
            } else {
                play();
            }
            e.preventDefault();
        }
    };
}
