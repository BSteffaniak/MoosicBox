import htmx from 'htmx.org';
import type { HtmxRequestConfig } from 'htmx.org';
import { isServer } from 'solid-js/web';
import { getConnection } from '~/services/api';

type MutableConfig = {
    -readonly [K in keyof typeof htmx.config]: (typeof htmx.config)[K];
};

if (!isServer) {
    const config: MutableConfig = htmx.config;
    config.selfRequestsOnly = false;

    document.addEventListener('htmx:configRequest', (event) => {
        if (!('detail' in event))
            throw new Error(`Invalid htmx event: ${JSON.stringify(event)}`);

        const con = getConnection();
        const detail = event.detail as HtmxRequestConfig;

        const clientId = con.clientId;

        if (clientId) {
            detail.parameters.clientId = clientId;
        }

        const token = con.staticToken || con.token;

        if (token && !detail.headers.Authorization) {
            detail.headers.Authorization = token;
        }

        detail.path = `${con.apiUrl}${detail.path}`;
    });
}

export { htmx };
