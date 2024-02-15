import { Show, createSignal, onMount } from 'solid-js';
import { api, apiUrl, clientId, token } from '~/services/api';

export default function authPage(props: {
    magicToken: string;
    search: Record<string, string>;
}) {
    const [loading, setLoading] = createSignal(true);
    const [error, setError] = createSignal<string>();

    onMount(async () => {
        if (props.search.apiUrl) {
            apiUrl.set(props.search.apiUrl);
        }
        const resp = await api.magicToken(props.magicToken);
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
