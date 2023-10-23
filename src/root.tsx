// @refresh reload
import { Routes } from '@solidjs/router';
import { Suspense } from 'solid-js';
import {
    Body,
    FileRoutes,
    Head,
    Html,
    Link,
    Meta,
    Scripts,
    Title,
} from 'solid-start';
import { ErrorBoundary } from 'solid-start/error-boundary';
import { player as howlerPlayer } from '~/services/howler-player';
import { player } from './services/player';
import {
    connectionId,
    connectionName,
    onConnect,
    onConnectionNameChanged,
    registerConnection,
} from './services/ws';
import { Api } from './services/api';

Object.assign(player, howlerPlayer);

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
