import { init, setProperty } from '@free-log/node-client';
import { appState } from '~/services/app';
import { registerPlayer } from '~/services/player';
import {
    InboundMessageType,
    connectionId,
    connectionName,
    onConnect,
    onMessage,
    wsService,
} from '~/services/ws';
import { createPlayer as createHowlerPlayer } from '~/services/howler-player';

init({
    logWriterApiUrl: 'https://logs.moosicbox.com',
    shimConsole: true,
    logLevel: 'WARN',
});
setProperty('connectionId', connectionId.get());
setProperty('connectionName', connectionName.get());

function updatePlayer() {
    appState.connection?.players
        .filter((player) => player.audioOutputId === 'HOWLER')
        .forEach((player) => {
            registerPlayer(createHowlerPlayer(player.playerId));
        });
}

onMessage((data) => {
    if (data.type === InboundMessageType.CONNECTIONS) {
        updatePlayer();
    }
});

function updateConnection(connectionId: string, name: string) {
    wsService.registerConnection({
        connectionId,
        name,
        players: [
            {
                audioOutputId: 'HOWLER',
                name: 'Web Player',
            },
        ],
    });
}

onConnect(() => {
    updateConnection(connectionId.get()!, connectionName.get());

    setProperty('connectionId', connectionId.get());
});
connectionName.listen((connectionName) => {
    updateConnection(connectionId.get()!, connectionName);
    setProperty('connectionName', connectionName);
});
