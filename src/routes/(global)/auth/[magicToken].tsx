import { createSignal } from 'solid-js';
import { isServer } from 'solid-js/web';
import { useNavigate, useParams } from 'solid-start';
import { Api, api } from '~/services/api';
import { QueryParams } from '~/services/util';

export default function authPage() {
    const params = useParams();
    const navigate = useNavigate();

    const searchParams = new QueryParams(
        isServer ? {} : window.location.search,
    );

    const [loading, setLoading] = createSignal(true);

    (async () => {
        if (isServer) return;
        const apiUrl = searchParams.get('apiUrl');
        if (apiUrl) {
            Api.setApiUrl(apiUrl);
        }
        const { clientId, accessToken } = await api.magicToken(
            params.magicToken,
        );
        Api.setClientId(clientId);
        Api.setToken(accessToken);
        setLoading(false);
        navigate('/');
    })();

    return <div>{loading() ? <>Loading...</> : <>Loaded</>}</div>;
}
