import { Api } from '~/services/api';
import './settings.css';

export default function settingsPage() {
    let clientIdInput: HTMLInputElement;

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
