import { defineConfig } from 'astro/config';
import aws from 'astro-sst';
import solidJs from '@astrojs/solid-js';
// import node from '@astrojs/node';
import render from './render-directive/register';
import customElements from 'custom-elements-ssr/astro';

// https://astro.build/config
export default defineConfig({
    integrations: [solidJs(), render(), customElements()],
    // adapter: node({ mode: 'standalone' }),
    adapter: aws({ deploymentStrategy: 'regional', responseMode: 'stream' }),
});
