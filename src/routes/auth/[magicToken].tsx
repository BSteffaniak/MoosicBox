import { Show, createSignal } from 'solid-js';
import { isServer } from 'solid-js/web';
import { Api, api } from '~/services/api';

export default function authPage(props: {
    magicToken: string;
    search: Record<string, string>;
}) {
    const [loading, setLoading] = createSignal(true);
    const [error, setError] = createSignal<string>();

    (async () => {
        if (isServer) return;
        const { apiUrl } = props.search;
        if (apiUrl) {
            Api.setApiUrl(apiUrl);
        }
        const resp = await api.magicToken(props.magicToken);
        setLoading(false);

        if (resp) {
            const { clientId, accessToken } = resp;
            Api.setClientId(clientId);
            Api.setToken(accessToken);
            window.location.href = '/';
        } else {
            setError('Failed to authenticate with magic token');
        }
    })();

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
