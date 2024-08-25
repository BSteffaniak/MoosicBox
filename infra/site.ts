/// <reference path="../.sst/platform/config.d.ts" />

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

const defaultStageName = 'prod';
const isDefaultStage = $app.stage === defaultStageName;
const domain = process.env.DOMAIN ?? 'moosicbox.com';
const slug = 'app';
const subdomain = isDefaultStage ? slug : `${slug}-${$app.stage}`;
const domainName = `${subdomain}.${domain}`;

function getCustomDomain(hostedZoneId: string) {
    return {
        name: domainName,
        dns: sst.aws.dns({
            zone: hostedZoneId,
        }),
    };
}

const hostedZoneId = await getHostedZoneId(domain);
const customDomain = getCustomDomain(hostedZoneId);

const site = new sst.aws.Astro('MoosicBox', {
    buildCommand: 'pnpm build --config astro.config.sst.mjs',
    domain: customDomain,
});

export const outputs = {
    url: site.url,
    host: `https://${domainName}`,
};
