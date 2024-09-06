import { createSignal, For, Show } from 'solid-js';
import './settings.css';
import {
    api,
    connection,
    type Connection,
    setConnection as apiSetConnection,
    getNewConnectionId,
    connections,
    setActiveConnection,
} from '~/services/api';
import { clientSignal } from '~/services/util';
import { connectionName } from '~/services/ws';

export default function settingsPage() {
    const [$connections, _setConnections] = clientSignal(connections);
    const [$connection, setConnection] = clientSignal(connection);
    const [$connectionName, setConnectionName] = clientSignal(connectionName);

    const [status, setStatus] = createSignal<string>();
    const [loading, setLoading] = createSignal(false);

    let clientIdInput: HTMLInputElement;
    let apiUrlInput: HTMLInputElement;
    let nameInput: HTMLInputElement;

    function newConnection() {
        const id = getNewConnectionId();
        setConnection({
            id,
            name: 'New connection',
            apiUrl: '',
            clientId: '',
            token: '',
            staticToken: '',
        });
        apiSetConnection(id, { name: 'New connection' });
    }

    function saveConnection(values: Partial<Connection>) {
        const con = $connection();
        const id = con?.id ?? getNewConnectionId();
        setConnection({
            id,
            name: values.name ?? con?.name ?? '',
            apiUrl: values.apiUrl ?? con?.apiUrl ?? '',
            clientId: values.clientId ?? con?.clientId ?? '',
            token: values.token ?? con?.token ?? '',
            staticToken: values.staticToken ?? con?.staticToken ?? '',
        });
        apiSetConnection(id, values);
    }

    function saveName() {
        saveConnection({
            name: nameInput.value,
        });
    }

    function saveApiUrl() {
        const con = $connection();
        saveConnection({
            apiUrl: apiUrlInput.value,
            staticToken: con?.staticToken ?? '',
        });
    }

    let connectionNameInput: HTMLInputElement;

    function saveConnectionName() {
        setConnectionName(connectionNameInput.value);
    }

    function saveClientId() {
        saveConnection({
            clientId: clientIdInput.value,
        });
    }

    let tokenInput: HTMLInputElement;

    function saveToken() {
        saveConnection({
            token: tokenInput.value,
        });
    }

    let staticTokenInput: HTMLInputElement;

    function saveStaticToken() {
        saveConnection({
            staticToken: staticTokenInput.value,
        });
    }

    let magicTokenInput: HTMLInputElement;

    async function saveMagicToken() {
        const resp = await api.magicToken(magicTokenInput.value);
        setLoading(false);

        if (resp) {
            const con = $connection();
            saveConnection({
                name: con?.name ?? 'New connection',
                apiUrl: con?.apiUrl ?? '',
                clientId: resp.clientId,
                token: resp.accessToken,
            });
            magicTokenInput.value = '';
            setStatus('Successfully set values');
        } else {
            setStatus('Failed to authenticate with magic token');
        }
    }

    return (
        <div>
            <section>
                <ul>
                    <li>
                        Name:{' '}
                        <input
                            ref={connectionNameInput!}
                            type="text"
                            value={$connectionName()}
                            onKeyUp={(e) =>
                                e.key === 'Enter' && saveConnectionName()
                            }
                        />
                        <button onClick={saveConnectionName}>save</button>
                    </li>
                </ul>

                <Show when={$connections()}>
                    {(connections) => (
                        <select
                            name="connections"
                            id="connections-dropdown"
                            onChange={(e) => {
                                setActiveConnection(
                                    parseInt(e.currentTarget.value),
                                );
                            }}
                        >
                            <For each={connections()}>
                                {(con) => (
                                    <option
                                        value={con.id}
                                        selected={con.id === $connection()?.id}
                                    >
                                        {con.name}
                                    </option>
                                )}
                            </For>
                        </select>
                    )}
                </Show>

                <button type="button" onClick={newConnection}>
                    New connection
                </button>

                <ul>
                    <li>
                        Name:{' '}
                        <input
                            ref={nameInput!}
                            type="text"
                            value={$connection()?.name ?? 'New connection'}
                            onKeyUp={(e) => e.key === 'Enter' && saveName()}
                        />
                        <button onClick={saveName}>save</button>
                    </li>
                    <li>
                        API Url:{' '}
                        <input
                            ref={apiUrlInput!}
                            type="text"
                            value={$connection()?.apiUrl ?? ''}
                            onKeyUp={(e) => e.key === 'Enter' && saveApiUrl()}
                        />
                        <button onClick={saveApiUrl}>save</button>
                    </li>
                    <li>
                        Client ID:{' '}
                        <input
                            ref={clientIdInput!}
                            type="text"
                            value={$connection()?.clientId ?? ''}
                            onKeyUp={(e) => e.key === 'Enter' && saveClientId()}
                        />
                        <button onClick={saveClientId}>save</button>
                    </li>
                    <li>
                        Token:{' '}
                        <input
                            ref={tokenInput!}
                            type="text"
                            value={$connection()?.token ?? ''}
                            onKeyUp={(e) => e.key === 'Enter' && saveToken()}
                        />
                        <button onClick={saveToken}>save</button>
                    </li>
                    <li>
                        Static Token:{' '}
                        <input
                            ref={staticTokenInput!}
                            type="text"
                            value={$connection()?.staticToken ?? ''}
                            onKeyUp={(e) =>
                                e.key === 'Enter' && saveStaticToken()
                            }
                        />
                        <button onClick={saveStaticToken}>save</button>
                    </li>
                    <li>
                        Magic Token:{' '}
                        <input
                            ref={magicTokenInput!}
                            type="text"
                            onKeyUp={(e) =>
                                e.key === 'Enter' && saveMagicToken()
                            }
                        />
                        <button onClick={saveMagicToken}>save</button>
                    </li>
                </ul>
                {status() && status()}
                {loading() && 'loading...'}
            </section>
            <hr />
            <section>
                <button
                    onClick={async () => api.startScan(['LOCAL'])}
                    type="button"
                    class="remove-button-styles moosicbox-button"
                >
                    Scan
                </button>
            </section>
        </div>
    );
}
