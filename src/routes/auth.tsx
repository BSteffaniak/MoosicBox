import { Show, createSignal, onMount } from 'solid-js';
import { api, apiUrl, clientId, token } from '~/services/api';
import { getQueryParam } from '~/services/util';

export default function authPage() {
    const magicTokenParam = getQueryParam('magicToken');
    const apiUrlParam = getQueryParam('apiUrl');

    const [loading, setLoading] = createSignal(true);
    const [error, setError] = createSignal<string>();

    onMount(async () => {
        if (!magicTokenParam) {
            setLoading(false);
            setError('No magic token');
            return;
        }

        if (apiUrlParam) {
            apiUrl.set(apiUrlParam);
        }

        const resp = await api.magicToken(magicTokenParam);
        setLoading(false);

        if (resp) {
            clientId.set(resp.clientId);
            token.set(resp.accessToken);
            window.location.href = '/';
        } else {
            setError('Failed to authenticate with magic token');
        }
    });

    return (
        <div>
            {loading() ? (
                <>Loading...</>
            ) : (
                <>
                    <Show when={error()}>{error()}</Show>
                </>
            )}
        </div>
    );
}
