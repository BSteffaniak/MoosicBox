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

enum InputMessageType {
    CONNECT = 'CONNECT',
    CONNECTION_ID = 'CONNECTION_ID',
}

enum OutputMessageType {
    GET_CONNECTION_ID = 'GET_CONNECTION_ID',
    PING = 'PING',
}

interface ConnectMessage extends InputMessage {
    connectionId?: string;
    type: InputMessageType.CONNECT;
}

interface ConnectionIdMessage extends InputMessage {
    connectionId: string;
    type: InputMessageType.CONNECT;
}

interface PingMessage extends OutputMessage {
    connectionId: string;
    type: OutputMessageType.PING;
}

interface GetConnectionIdMessage extends OutputMessage {
    connectionId?: string;
    type: OutputMessageType.GET_CONNECTION_ID;
}

interface InputMessage {
    type: InputMessageType;
}

interface OutputMessage {
    type: OutputMessageType;
}

function ping() {
    console.log('Sending ping');
    send<PingMessage>({type: OutputMessageType.PING});
}

function getConnectionId() {
    const message: GetConnectionIdMessage = {
        connectionId,
        type: OutputMessageType.GET_CONNECTION_ID,
    };
    ws.send(JSON.stringify(message));
}

function send<T extends OutputMessage>(value: Omit<T, 'connectionId'>) {
    if (!connectionId) throw new Error('No connectionId');
    ws.send(JSON.stringify({ connectionId, ...value }));
}

function newClient(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
        const client = new WebSocket(wsUrl);

        let pingInterval: NodeJS.Timeout | undefined;
        let opened = false;

        client.addEventListener('error', (e: Event) => {
            console.error("WebSocket client error", e);
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

                getConnectionId();
            }
        });

        client.addEventListener('message', (event: MessageEvent<string>) => {
            const data = JSON.parse(event.data) as InputMessage;
            console.log('Received message', data);
            switch (data.type) {
                case InputMessageType.CONNECT: {
                    const message = data as ConnectMessage;
                    if (message.connectionId) {
                        connectionId = message.connectionId;
                    }
                    break;
                }
                case InputMessageType.CONNECTION_ID: {
                    const message = data as ConnectionIdMessage;
                    connectionId = message.connectionId;
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
                    console.log(`Debouncing connection retry attempt. Waiting ${CONNECTION_RETRY_DEBOUNCE}ms`);
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
        console.log(`Attempting connection${attemptNumber > 0 ? `, Attempt ${attemptNumber + 1}` : ''}`);

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
