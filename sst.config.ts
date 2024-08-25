import { SSMClient } from '@aws-sdk/client-ssm';
import type { SSTConfig } from 'sst';
import { fetchSstSecret } from 'sst-secrets';
import { AstroSite, type StackContext } from 'sst/constructs';
import { exec } from 'node:child_process';

async function getHostedZoneId(domain: string): Promise<string> {
    return new Promise((resolve, reject) => {
        exec(
            `aws route53 list-hosted-zones-by-name --query "HostedZones[?Name=='${domain}.'].Id"  --output text | sed s#/hostedzone/##`,
            (error, stdout, stderr) => {
                if (error) {
                    console.error(stderr);
                    return reject(error);
                }
                resolve(stdout.trim());
            },
        );
    });
}

export default {
    config(_input) {
        return {
            name: 'moosicbox-app',
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
            const slug = 'app';
            const subdomain = isProd ? slug : `${slug}-${stack.stage}`;
            const domainName = `${subdomain}.${DOMAIN}`;

            const hostedZoneId = await getHostedZoneId(DOMAIN);
            console.log(`HostedZone ID: '${hostedZoneId}'`);

            const site = new AstroSite(stack, 'MoosicBox', {
                buildCommand: 'pnpm build --config astro.config.sst.mjs',
                customDomain: {
                    hostedZone: DOMAIN,
                    domainName,
                },
            });

            stack.addOutputs({
                url: site.url,
                host: `https://${domainName}`,
            });
        });
    },
} satisfies SSTConfig;
