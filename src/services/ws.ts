import * as player from './player';
import { produce } from 'solid-js/store';
import { Api, Track, toSessionPlaylistTrack } from './api';
import { onStartup, setAppState } from './app';
import { PartialUpdateSession } from './types';
import { createListener } from './util';
import { makePersisted } from '@solid-primitives/storage';
import { createSignal } from 'solid-js';

Api.onApiUrlUpdated((url) => {
    updateWsUrl(url, Api.clientId(), Api.signatureToken());
    if (Api.token() && !Api.signatureToken()) {
        console.debug('Waiting for signature token');
        return;
    }
    reconnect();
});
Api.onClientIdUpdated((clientId) => {
    updateWsUrl(Api.apiUrl(), clientId, Api.signatureToken());
    if (Api.token() && !Api.signatureToken()) {
        console.debug('Waiting for signature token');
        return;
    }
    reconnect();
});
Api.onSignatureTokenUpdated((signatureToken) => {
    updateWsUrl(Api.apiUrl(), Api.clientId(), signatureToken);
    if (Api.token() && !Api.signatureToken()) {
        console.debug('Waiting for signature token');
        return;
    }
    reconnect();
});

function updateWsUrl(
    apiUrl: string,
    clientId: string | undefined,
    signatureToken: string | undefined,
) {
    const params = [];
    if (clientId) {
        params.push(`clientId=${encodeURIComponent(clientId)}`);
    }
    if (signatureToken) {
        params.push(`signature=${encodeURIComponent(signatureToken)}`);
    }
    wsUrl = `ws${apiUrl.slice(4)}/ws${
        params.length > 0 ? `?${params.join('&')}` : ''
    }`;
}

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
    GET_CONNECTION_ID = 'GET_CONNECTION_ID',
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

interface GetConnectionIdMessage extends OutboundMessage {
    type: OutboundMessageType.GET_CONNECTION_ID;
}

interface SetSeekOutboundMessage extends OutboundMessage {
    type: OutboundMessageType.SET_SEEK;
    payload: SetSeek;
}

interface PingMessage extends OutboundMessage {
    type: OutboundMessageType.PING;
}

export type RegisterConnection = Omit<Api.Connection, 'players' | 'alive'> & {
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
    tracks: Track[];
}

export interface CreateSession {
    name: string;
    playlist: CreateSessionPlaylist;
}

export interface CreateSessionPlaylist {
    tracks: Api.UpdateSessionPlaylistTrack[];
}

interface CreateSessionMessage extends OutboundMessage {
    type: OutboundMessageType.CREATE_SESSION;
    payload: CreateSession;
}

interface UpdateSessionMessage extends OutboundMessage {
    type: OutboundMessageType.UPDATE_SESSION;
    payload: Api.UpdatePlaybackSession;
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

function getConnectionId() {
    send<GetConnectionIdMessage>({
        type: OutboundMessageType.GET_CONNECTION_ID,
    });
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
                tracks: session.playlist.tracks.map(toSessionPlaylistTrack),
            },
        },
    });
}

export function updateSession(session: Api.UpdatePlaybackSession) {
    const payload: Api.UpdatePlaybackSession = {
        ...session,
        playlist: undefined,
    };

    if (session.playlist) {
        payload.playlist = {
            ...session.playlist,
        };
    } else {
        delete payload.playlist;
    }

    send<UpdateSessionMessage>({
        type: OutboundMessageType.UPDATE_SESSION,
        payload,
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
    console.debug('Sending WebSocket message', value);
    ws.send(JSON.stringify(value));
}

const onMessageListener =
    createListener<(message: InboundMessage) => boolean | void>();
export const onMessage = onMessageListener.on;
export const onMessageFirst = onMessageListener.onFirst;
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
                getConnectionId();
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

onMessageFirst((data) => {
    console.debug('Received ws message', data);
    switch (data.type) {
        case InboundMessageType.CONNECTION_ID: {
            const message = data as ConnectionIdMessage;
            onConnectListener.trigger(message.connectionId);
            break;
        }
        case InboundMessageType.SESSIONS: {
            const message = data as SessionsMessage;
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
            setAppState(
                produce((state) => {
                    state.connections = message.payload;
                }),
            );
            break;
        }
        case InboundMessageType.SET_SEEK: {
            const message = data as SetSeekInboundMessage;
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

            const session = message.payload;

            player.setPlayerState(
                produce((state) => {
                    player.updateSessionPartial(state, session);
                }),
            );
            player.sessionUpdated(session);

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
    updateWsUrl(Api.apiUrl(), Api.clientId(), Api.signatureToken());
    if (Api.token() && !Api.signatureToken()) {
        console.debug('Waiting for signature token');
        return;
    }
    connectionPromise = attemptConnection();
});
