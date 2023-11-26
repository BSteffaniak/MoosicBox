import { createSignal } from 'solid-js';
import { isServer } from 'solid-js/web';
import { useNavigate, useParams } from 'solid-start';
import { Api, api } from '~/services/api';

export default function authPage() {
    const params = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = createSignal(true);

    (async () => {
        if (isServer) return;
        const { clientId, accessToken } = await api.magicToken(
            params.magicToken,
        );
        console.log(clientId, accessToken);
        Api.setClientId(clientId);
        Api.setToken(accessToken);
        setLoading(false);
        navigate('/');
    })();

    return <div>{loading() ? <>Loading...</> : <>Loaded</>}</div>;
}
