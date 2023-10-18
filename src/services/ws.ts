import { Api } from './api';
import { onStartup } from './app';
import * as player from './player';

Api.onApiUrlUpdated((url) => {
    wsUrl = `ws${url.slice(4)}/ws`;
    reconnect();
});

let ws: WebSocket;
let wsUrl: string;
let connectionId: string;
export let connectionPromise: Promise<WebSocket>;

enum InboundMessageType {
    CONNECT = 'CONNECT',
    CONNECTION_ID = 'CONNECTION_ID',
    CONNECTIONS_DATA = 'CONNECTIONS_DATA',
    SESSIONS = 'SESSIONS',
    SESSION_UPDATED = 'SESSION_UPDATED',
}

enum OutboundMessageType {
    PING = 'PING',
    SYNC_CONNECTION_DATA = 'SYNC_CONNECTION_DATA',
    PLAYBACK_ACTION = 'PLAYBACK_ACTION',
    GET_SESSIONS = 'GET_SESSIONS',
    UPDATE_SESSION = 'UPDATE_SESSION',
    DELETE_SESSION = 'DELETE_SESSION',
}

interface ConnectMessage extends InboundMessage {
    connectionId?: string;
    type: InboundMessageType.CONNECT;
}

interface ConnectionIdMessage extends InboundMessage {
    connectionId: string;
    type: InboundMessageType.CONNECT;
}

interface ConnectionsDataMessage extends InboundMessage {
    type: InboundMessageType.CONNECTIONS_DATA;
    payload: {
        playing: boolean;
    };
}

interface SessionsMessage extends InboundMessage {
    type: InboundMessageType.SESSIONS;
    payload: Api.PlaybackSession[];
}

interface SessionUpdatedMessage extends InboundMessage {
    type: InboundMessageType.SESSION_UPDATED;
    payload: PartialUpdateSession;
}

interface PingMessage extends OutboundMessage {
    connectionId: string;
    type: OutboundMessageType.PING;
}

interface SyncConnectionDataMessage extends OutboundMessage {
    type: OutboundMessageType.SYNC_CONNECTION_DATA;
    payload: {
        playing: boolean;
    };
}

export enum PlaybackAction {
    PLAY = 'PLAY',
    PAUSE = 'PAUSE',
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

export interface UpdateSession {
    id: number;
    name?: string;
    active?: boolean;
    playing?: boolean;
    position?: number;
    seek?: number;
    playlist?: UpdateSessionPlaylist;
}

interface UpdateSessionPlaylist {
    id: number;
    tracks: number[];
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

function syncConnectionData() {
    send<SyncConnectionDataMessage>({
        type: OutboundMessageType.SYNC_CONNECTION_DATA,
        payload: {
            playing: player.playing(),
        },
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

function getSessions() {
    send<GetSessionsMessage>({
        type: OutboundMessageType.GET_SESSIONS,
    });
}

export function activateSession(sessionId: number) {
    updateSession({ id: sessionId, active: true });
}

export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type PartialUpdateSession = PartialBy<
    Api.PlaybackSession,
    'name' | 'active' | 'playing' | 'position' | 'seek' | 'playlist'
>;
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

function send<T extends OutboundMessage>(value: T) {
    ws.send(JSON.stringify(value));
}

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
            console.debug('Received message', data);
            switch (data.type) {
                case InboundMessageType.CONNECT: {
                    const message = data as ConnectMessage;
                    console.debug('Client connected', message);
                    if (message.connectionId) {
                        connectionId = message.connectionId;
                    }
                    break;
                }
                case InboundMessageType.CONNECTION_ID: {
                    const message = data as ConnectionIdMessage;
                    connectionId = message.connectionId;
                    syncConnectionData();
                    console.debug('received connection id', connectionId);
                    break;
                }
                case InboundMessageType.CONNECTIONS_DATA: {
                    const message = data as ConnectionsDataMessage;
                    console.debug('received connections data', message.payload);
                    break;
                }
                case InboundMessageType.SESSIONS: {
                    const message = data as SessionsMessage;
                    console.debug('received sessions', message.payload);
                    player.setPlaybackSessions(message.payload);
                    const existing = message.payload.find(
                        (p) => p.id === player.currentPlaybackSession()?.id,
                    );
                    if (existing) {
                        player.setCurrentPlaybackSession(existing);
                    } else {
                        player.setCurrentPlaybackSession(message.payload[0]);
                    }
                    break;
                }
                case InboundMessageType.SESSION_UPDATED: {
                    const message = data as SessionUpdatedMessage;
                    console.debug('received session update', message.payload);
                    player
                        .playbackSessions()
                        ?.filter((s) => s.id === message.payload.id)
                        ?.forEach((s) => Object.assign(s, message.payload));

                    player.setPlaybackSessions(player.playbackSessions());
                    player.setCurrentPlaybackSession(
                        player.currentPlaybackSession(),
                    );
                    break;
                }
            }
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
            getSessions();

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
