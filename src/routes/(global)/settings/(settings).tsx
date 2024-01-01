import { Api } from '~/services/api';
import './settings.css';
import { connectionName, setConnectionName } from '~/services/ws';

export default function settingsPage() {
    let clientIdInput: HTMLInputElement;

    let apiUrlInput: HTMLInputElement;

    function saveApiUrl() {
        Api.setApiUrl(apiUrlInput.value);
    }

    let connectionNameInput: HTMLInputElement;

    function saveConnectionName() {
        setConnectionName(connectionNameInput.value);
    }

    function saveClientId() {
        Api.setClientId(clientIdInput.value);
    }

    let tokenInput: HTMLInputElement;

    function saveToken() {
        Api.setToken(tokenInput.value);
    }

    return (
        <div>
            <ul>
                <li>
                    API Url:{' '}
                    <input
                        ref={apiUrlInput!}
                        type="text"
                        value={Api.apiUrl()}
                        onKeyUp={(e) => e.key === 'Enter' && saveApiUrl()}
                    />
                    <button onClick={saveApiUrl}>save</button>
                </li>
                <li>
                    Name:{' '}
                    <input
                        ref={connectionNameInput!}
                        type="text"
                        value={connectionName()}
                        onKeyUp={(e) =>
                            e.key === 'Enter' && saveConnectionName()
                        }
                    />
                    <button onClick={saveConnectionName}>save</button>
                </li>
                <li>
                    Client ID:{' '}
                    <input
                        ref={clientIdInput!}
                        type="text"
                        value={Api.clientId()}
                        onKeyUp={(e) => e.key === 'Enter' && saveClientId()}
                    />
                    <button onClick={saveClientId}>save</button>
                </li>
                <li>
                    Token:{' '}
                    <input
                        ref={tokenInput!}
                        type="text"
                        value={Api.token()}
                        onKeyUp={(e) => e.key === 'Enter' && saveToken()}
                    />
                    <button onClick={saveToken}>save</button>
                </li>
            </ul>
        </div>
    );
}
