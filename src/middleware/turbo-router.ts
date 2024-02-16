// @ts-ignore
import * as Turbo from '@hotwired/turbo'; // eslint-disable-line
import type { TurboEvent } from './turbo-types';

function defaultEventHandler(_event: TurboEvent) {}

addEventListener('turbo:click', defaultEventHandler);
addEventListener('turbo:before-visit', defaultEventHandler);
addEventListener('turbo:visit', defaultEventHandler);
addEventListener('turbo:before-cache', defaultEventHandler);
addEventListener('turbo:before-render', defaultEventHandler);
addEventListener('turbo:render', defaultEventHandler);
addEventListener('turbo:load', defaultEventHandler);
addEventListener('turbo:morph', defaultEventHandler);
addEventListener('turbo:before-morph-element', defaultEventHandler);
addEventListener('turbo:before-morph-attribute', defaultEventHandler);
addEventListener('turbo:morph-element', defaultEventHandler);
addEventListener('turbo:submit-start', defaultEventHandler);
addEventListener('turbo:submit-end', defaultEventHandler);
addEventListener('turbo:before-frame-render', defaultEventHandler);
addEventListener('turbo:frame-render', defaultEventHandler);
addEventListener('turbo:frame-load', defaultEventHandler);
addEventListener('turbo:frame-missing', defaultEventHandler);
addEventListener('turbo:before-stream-render', defaultEventHandler);
addEventListener('turbo:before-fetch-request', defaultEventHandler);
addEventListener('turbo:before-fetch-response', defaultEventHandler);
addEventListener('turbo:before-prefetch', defaultEventHandler);
addEventListener('turbo:fetch-request-error', defaultEventHandler);

Turbo.start();
