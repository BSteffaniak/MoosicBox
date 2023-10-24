// @refresh reload
import { Routes } from '@solidjs/router';
import { Suspense } from 'solid-js';
import {
    Body,
    FileRoutes,
    Head,
    Html,
    Meta,
    Scripts,
    Title,
} from 'solid-start';
import { ErrorBoundary } from 'solid-start/error-boundary';
import { PlayerType, player } from './services/player';
import {
    InboundMessageType,
    connectionId,
    connectionName,
    onConnect,
    onConnectionNameChanged,
    onMessage,
    registerConnection,
} from './services/ws';
import { Api } from './services/api';
import { createPlayer as createHowlerPlayer } from './services/howler-player';
import { appState } from './services/app';

let currentPlayer: PlayerType | undefined;

function updatePlayer() {
    const connection = appState.connections.find(
        (c) => c.connectionId === connectionId(),
    );

    const newPlayer = connection?.players[0];

    if (newPlayer && currentPlayer?.id !== newPlayer.playerId) {
        currentPlayer = createHowlerPlayer(newPlayer.playerId);
    }

    Object.assign(player, currentPlayer);

    console.debug('Set player to', currentPlayer);
}

onMessage((data) => {
    if (data.type === InboundMessageType.CONNECTIONS) {
        updatePlayer();
    }
});

function updateConnection(connectionId: string, name: string) {
    registerConnection({
        connectionId,
        name,
        players: [
            {
                type: Api.PlayerType.HOWLER,
                name: 'Web Player',
            },
        ],
    });
}

onConnect(() => {
    updateConnection(connectionId()!, connectionName());
});
onConnectionNameChanged((name) => {
    updateConnection(connectionId()!, name);
});

export default function rootPage() {
    return (
        <Html lang="en">
            <Head>
                <Title>MoosicBox</Title>
                <Meta charset="utf-8" />
                <Meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
            </Head>
            <Body>
                <Suspense>
                    <ErrorBoundary>
                        <Routes>
                            <FileRoutes />
                        </Routes>
                    </ErrorBoundary>
                </Suspense>
                <Scripts />
            </Body>
        </Html>
    );
}
