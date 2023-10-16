import { Api } from './api';
import { onStartup } from './app';

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
}

enum OutboundMessageType {
    PING = 'PING',
    SYNC_CONNECTION_DATA = 'SYNC_CONNECTION_DATA',
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

interface PingMessage extends OutboundMessage {
    connectionId: string;
    type: OutboundMessageType.PING;
}

interface SyncConnectionDataMessage extends OutboundMessage {
    type: OutboundMessageType.SYNC_CONNECTION_DATA;
    connectionId: string;
    payload: {
        playing: boolean;
    };
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
        payload: { playing: true },
    });
}

function send<T extends OutboundMessage>(value: Omit<T, 'connectionId'>) {
    if (!connectionId) throw new Error('No connectionId');
    ws.send(JSON.stringify({ connectionId, ...value }));
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
                    break;
                }
                case InboundMessageType.CONNECTIONS_DATA: {
                    const message = data as ConnectionsDataMessage;
                    console.log(message.payload);
                    break;
                }
            }
        });

        client.addEventListener('close', async () => {
            if (opened) {
                console.log('Closed');
                opened = false;
                client.close();
                clearInterval(pingInterval);

                const now = Date.now();
                if (lastConnectionAttemptTime + 5000 > now) {
                    console.log(
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
        console.log(
            `Attempting connection${
                attemptNumber > 0 ? `, Attempt ${attemptNumber + 1}` : ''
            }`,
        );

        try {
            const ws = await newClient();

            console.log('Successfully connected client');

            return ws;
        } catch (e: unknown) {
            if (
                attemptNumber++ === MAX_CONNECTION_RETRY_COUNT &&
                MAX_CONNECTION_RETRY_COUNT !== -1
            ) {
                break;
            }

            console.log(
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
