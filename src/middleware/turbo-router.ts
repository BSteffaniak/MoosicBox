// @ts-ignore
import * as Turbo from '@hotwired/turbo'; // eslint-disable-line

addEventListener('turbo:before-render', (_event) => {});

Turbo.start();
