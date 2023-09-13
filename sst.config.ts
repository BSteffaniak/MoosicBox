import { SSMClient } from '@aws-sdk/client-ssm';
import type { SSTConfig } from 'sst';
import { fetchSstSecret } from 'sst-secrets';
import { SolidStartSite, StackContext } from 'sst/constructs';

export default {
    config(_input) {
        return {
            name: 'moosicbox',
            region: 'us-east-1',
        };
    },
    async stacks(app) {
        await app.stack(async ({ stack }: StackContext): Promise<void> => {
            const ssm = new SSMClient({ region: stack.region });
            const isProd = stack.stage === 'prod';
            const DOMAIN = await fetchSstSecret(
                ssm,
                app.name,
                'DOMAIN',
                stack.stage,
            );
            const subdomain = isProd ? '' : `${stack.stage}.`;
            const domainName = `${subdomain}${DOMAIN}`;

            const site = new SolidStartSite(stack, 'MoosicBox', {
                customDomain: {
                    hostedZone: DOMAIN,
                    domainName,
                },
            });

            stack.addOutputs({
                url: site.url,
                host: domainName,
            });
        });
    },
} satisfies SSTConfig;
