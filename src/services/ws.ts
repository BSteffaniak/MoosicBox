import * as player from './player';
import { produce } from 'solid-js/store';
import { Api } from './api';
import { onStartup, setAppState } from './app';
import { PartialUpdateSession } from './types';
import { createListener } from './util';
import { makePersisted } from '@solid-primitives/storage';
import { createSignal } from 'solid-js';

Api.onApiUrlUpdated((url) => {
    wsUrl = `ws${url.slice(4)}/ws`;
    reconnect();
});

let ws: WebSocket;
let wsUrl: string;
export let connectionPromise: Promise<WebSocket>;

export const [connectionId, setConnectionId] = makePersisted(
    createSignal<string | undefined>(undefined, { equals: false }),
    {
        name: `ws.v1.connectionId`,
    },
);

export const [_connectionName, _setConnectionName] = makePersisted(
    createSignal<string>('New Connection', { equals: false }),
    {
        name: `ws.v1.connectionName`,
    },
);
const onConnectionNameChangedListener =
    createListener<(value: string) => boolean | void>();
export const onConnectionNameChanged = onConnectionNameChangedListener.on;
export const offConnectionNameChanged = onConnectionNameChangedListener.off;
export const connectionName = _connectionName;
export const setConnectionName = (name: string) => {
    _setConnectionName(name);
    onConnectionNameChangedListener.trigger(name);
};

const onConnectListener = createListener<(value: string) => boolean | void>();
export const onConnect = onConnectListener.on;
export const offConnect = onConnectListener.off;

onConnect((id) => {
    if (!connectionId()) {
        setConnectionId(id);
    }
    getSessions();
});

export enum InboundMessageType {
    CONNECTION_ID = 'CONNECTION_ID',
    SESSIONS = 'SESSIONS',
    SESSION_UPDATED = 'SESSION_UPDATED',
    CONNECTIONS = 'CONNECTIONS',
    SET_SEEK = 'SET_SEEK',
}

export enum OutboundMessageType {
    PING = 'PING',
    SYNC_CONNECTION_DATA = 'SYNC_CONNECTION_DATA',
    PLAYBACK_ACTION = 'PLAYBACK_ACTION',
    GET_SESSIONS = 'GET_SESSIONS',
    CREATE_SESSION = 'CREATE_SESSION',
    UPDATE_SESSION = 'UPDATE_SESSION',
    DELETE_SESSION = 'DELETE_SESSION',
    REGISTER_CONNECTION = 'REGISTER_CONNECTION',
    REGISTER_PLAYERS = 'REGISTER_PLAYERS',
    SET_ACTIVE_PLAYERS = 'SET_ACTIVE_PLAYERS',
    SET_SEEK = 'SET_SEEK',
}

interface ConnectionIdMessage extends InboundMessage {
    connectionId: string;
    type: InboundMessageType.CONNECTION_ID;
}

interface SessionsMessage extends InboundMessage {
    type: InboundMessageType.SESSIONS;
    payload: Api.PlaybackSession[];
}

interface ConnectionsMessage extends InboundMessage {
    type: InboundMessageType.CONNECTIONS;
    payload: Api.Connection[];
}

interface SessionUpdatedMessage extends InboundMessage {
    type: InboundMessageType.SESSION_UPDATED;
    payload: PartialUpdateSession;
}

interface SetSeek {
    sessionId: number;
    seek: number;
}

interface SetSeekInboundMessage extends InboundMessage {
    type: InboundMessageType.SET_SEEK;
    payload: SetSeek;
}

interface SetSeekOutboundMessage extends OutboundMessage {
    type: OutboundMessageType.SET_SEEK;
    payload: SetSeek;
}

interface PingMessage extends OutboundMessage {
    type: OutboundMessageType.PING;
}

export type RegisterConnection = Omit<Api.Connection, 'players'> & {
    players: RegisterPlayer[];
};
interface RegisterConnectionMessage extends OutboundMessage {
    type: OutboundMessageType.REGISTER_CONNECTION;
    payload: RegisterConnection;
}

export type RegisterPlayer = Omit<Api.Player, 'playerId'>;
interface RegisterPlayersMessage extends OutboundMessage {
    type: OutboundMessageType.REGISTER_PLAYERS;
    payload: RegisterPlayer[];
}

export enum PlaybackAction {
    PLAY = 'PLAY',
    PAUSE = 'PAUSE',
    STOP = 'STOP',
    NEXT_TRACK = 'NEXT_TRACK',
    PREVIOUS_TRACK = 'PREVIOUS_TRACK',
}

interface PlaybackActionMessage extends OutboundMessage {
    type: OutboundMessageType.PLAYBACK_ACTION;
    payload: {
        action: PlaybackAction;
    };
}

interface GetSessionsMessage extends OutboundMessage {
    type: OutboundMessageType.GET_SESSIONS;
}

export interface SetActivePlayers {
    sessionId: number;
    players: number[];
}

interface SetActivePlayersMessage extends OutboundMessage {
    type: OutboundMessageType.SET_ACTIVE_PLAYERS;
    payload: SetActivePlayers;
}

export interface CreateSessionRequest {
    name: string;
    playlist: CreateSessionPlaylistRequest;
    activePlayers: number[];
}

export interface CreateSessionPlaylistRequest {
    tracks: Api.Track[];
}

export interface CreateSession {
    name: string;
    playlist: CreateSessionPlaylist;
}

export interface CreateSessionPlaylist {
    tracks: number[];
}

export interface UpdateSession {
    sessionId: number;
    name?: string;
    active?: boolean;
    playing?: boolean;
    position?: number;
    seek?: number;
    playlist?: UpdateSessionPlaylist;
}

interface UpdateSessionPlaylist {
    sessionPlaylistId: number;
    tracks: number[];
}

interface CreateSessionMessage extends OutboundMessage {
    type: OutboundMessageType.CREATE_SESSION;
    payload: CreateSession;
}

interface UpdateSessionMessage extends OutboundMessage {
    type: OutboundMessageType.UPDATE_SESSION;
    payload: UpdateSession;
}

interface DeleteSessionMessage extends OutboundMessage {
    type: OutboundMessageType.DELETE_SESSION;
    payload: { sessionId: number };
}

interface InboundMessage {
    type: InboundMessageType;
}

interface OutboundMessage {
    type: OutboundMessageType;
}

function ping() {
    send<PingMessage>({ type: OutboundMessageType.PING });
}

export function registerConnection(connection: RegisterConnection) {
    send<RegisterConnectionMessage>({
        type: OutboundMessageType.REGISTER_CONNECTION,
        payload: connection,
    });
}

export function registerPlayers(players: RegisterPlayer[]) {
    send<RegisterPlayersMessage>({
        type: OutboundMessageType.REGISTER_PLAYERS,
        payload: players,
    });
}

export function playbackAction(action: PlaybackAction) {
    send<PlaybackActionMessage>({
        type: OutboundMessageType.PLAYBACK_ACTION,
        payload: {
            action,
        },
    });
}

export function setActivePlayers(sessionId: number, players: number[]) {
    send<SetActivePlayersMessage>({
        type: OutboundMessageType.SET_ACTIVE_PLAYERS,
        payload: {
            sessionId,
            players,
        },
    });
}

function getSessions() {
    send<GetSessionsMessage>({
        type: OutboundMessageType.GET_SESSIONS,
    });
}

export function activateSession(sessionId: number) {
    updateSession({ sessionId, active: true });
}

export function createSession(session: CreateSessionRequest) {
    send<CreateSessionMessage>({
        type: OutboundMessageType.CREATE_SESSION,
        payload: {
            ...session,
            playlist: {
                ...session.playlist,
                tracks: session.playlist.tracks.map((t) => t.trackId),
            },
        },
    });
}

export function updateSession(session: PartialUpdateSession) {
    send<UpdateSessionMessage>({
        type: OutboundMessageType.UPDATE_SESSION,
        payload: {
            ...session,
            playlist: session.playlist
                ? {
                      ...session.playlist,
                      tracks: session.playlist.tracks.map((t) => t.trackId),
                  }
                : undefined,
        },
    });
}

export function deleteSession(sessionId: number) {
    send<DeleteSessionMessage>({
        type: OutboundMessageType.DELETE_SESSION,
        payload: {
            sessionId,
        },
    });
}

export function setSeek(sessionId: number, seek: number) {
    send<SetSeekOutboundMessage>({
        type: OutboundMessageType.SET_SEEK,
        payload: {
            sessionId,
            seek,
        },
    });
}

function send<T extends OutboundMessage>(value: T) {
    ws.send(JSON.stringify(value));
}

const onMessageListener =
    createListener<(message: InboundMessage) => boolean | void>();
export const onMessage = onMessageListener.on;
export const offMessage = onMessageListener.off;

function newClient(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
        const client = new WebSocket(wsUrl);

        let pingInterval: NodeJS.Timeout | undefined;
        let opened = false;

        client.addEventListener('error', (e: Event) => {
            console.error('WebSocket client error', e);
            if (!opened) {
                client.close();
                reject();
            }
        });

        client.addEventListener('open', (_e: Event) => {
            const wasOpened = opened;
            opened = true;
            if (!wasOpened) {
                pingInterval = setInterval(
                    () => {
                        if (!opened) return clearInterval(pingInterval);

                        ping();
                    },
                    9 * 60 * 1000,
                );

                ws = client;
                resolve(client);
            }
        });

        client.addEventListener('message', (event: MessageEvent<string>) => {
            const data = JSON.parse(event.data) as InboundMessage;
            onMessageListener.trigger(data);
        });

        client.addEventListener('close', async () => {
            if (opened) {
                console.debug('Closed WebSocket connection');
                opened = false;
                client.close();
                clearInterval(pingInterval);

                const now = Date.now();
                if (lastConnectionAttemptTime + 5000 > now) {
                    console.debug(
                        `Debouncing connection retry attempt. Waiting ${CONNECTION_RETRY_DEBOUNCE}ms`,
                    );
                    await sleep(CONNECTION_RETRY_DEBOUNCE);
                }
                lastConnectionAttemptTime = now;
                await attemptConnection();
            } else {
                reject();
            }
        });
    });
}

onMessage((data) => {
    switch (data.type) {
        case InboundMessageType.CONNECTION_ID: {
            const message = data as ConnectionIdMessage;
            console.debug('Client connected', message);
            onConnectListener.trigger(message.connectionId);
            break;
        }
        case InboundMessageType.SESSIONS: {
            const message = data as SessionsMessage;
            console.debug('Received sessions', message.payload);
            player.setPlayerState(
                produce((state) => {
                    state.playbackSessions = message.payload;
                    const existing = message.payload.find(
                        (p) =>
                            p.sessionId ===
                            state.currentPlaybackSession?.sessionId,
                    );
                    if (existing) {
                        player.updateSession(state, existing);
                    } else if (
                        typeof player.currentPlaybackSessionId() === 'number'
                    ) {
                        const session =
                            message.payload.find(
                                (s) =>
                                    s.sessionId ===
                                    player.currentPlaybackSessionId(),
                            ) ?? message.payload[0];
                        if (session) {
                            player.updateSession(state, session, true);
                        }
                    } else {
                        player.updateSession(state, message.payload[0], true);
                    }
                }),
            );
            break;
        }
        case InboundMessageType.CONNECTIONS: {
            const message = data as ConnectionsMessage;
            console.debug('Received connections', message.payload);
            setAppState(
                produce((state) => {
                    state.connections = message.payload;
                }),
            );
            break;
        }
        case InboundMessageType.SET_SEEK: {
            const message = data as SetSeekInboundMessage;
            console.debug('Received seek', message.payload);
            if (
                message.payload.sessionId ===
                player.playerState.currentPlaybackSession?.sessionId
            ) {
                player.seek(message.payload.seek);
            }
            break;
        }
        case InboundMessageType.SESSION_UPDATED: {
            const message = data as SessionUpdatedMessage;
            console.debug('Received session update', message.payload);

            const session = message.payload;

            player.setPlayerState(
                produce((state) => {
                    player.updateSessionPartial(state, message.payload);
                }),
            );

            if (
                session.sessionId ===
                player.playerState.currentPlaybackSession?.sessionId
            ) {
                if (typeof session.position !== 'undefined') {
                    if (player.playing()) {
                        player.stop();
                        player.play();
                    }
                }
                if (
                    typeof session.seek !== 'undefined' &&
                    !player.isPlayerActive()
                ) {
                    player.seek(session.seek);
                }
                if (
                    typeof session.playing !== 'undefined' &&
                    player.isPlayerActive()
                ) {
                    if (!session.playing && player.playing()) {
                        player.pause();
                    } else if (session.playing && !player.playing()) {
                        player.play();
                    }
                }
            }

            break;
        }
    }
});

let lastConnectionAttemptTime: number;
const MAX_CONNECTION_RETRY_COUNT: number = -1;
const CONNECTION_RETRY_DEBOUNCE = 5000;

async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function attemptConnection(): Promise<WebSocket> {
    let attemptNumber = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
        console.debug(
            `Attempting connection${
                attemptNumber > 0 ? `, Attempt ${attemptNumber + 1}` : ''
            }`,
        );

        try {
            const ws = await newClient();

            console.debug('Successfully connected client');

            return ws;
        } catch (e: unknown) {
            if (
                attemptNumber++ === MAX_CONNECTION_RETRY_COUNT &&
                MAX_CONNECTION_RETRY_COUNT !== -1
            ) {
                break;
            }

            console.error('WebSocket connection failed', e);
            console.debug(
                `Failed to connect. Waiting ${CONNECTION_RETRY_DEBOUNCE}ms`,
            );
            await sleep(CONNECTION_RETRY_DEBOUNCE);
        }
    }

    throw new Error('Failed to establish connection to websocket server');
}

function reconnect(): Promise<WebSocket> {
    if (ws) ws.close();

    return attemptConnection();
}

onStartup(async () => {
    wsUrl = `ws${Api.apiUrl().slice(4)}/ws`;
    connectionPromise = attemptConnection();
});
