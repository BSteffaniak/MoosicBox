import './scan-status-banner.css';
import { showScanStatusBanner } from '~/services/app';
import { clientSignal } from '~/services/util';
import { scanState } from '~/services/scan';
import { For, Show } from 'solid-js';

const responsePromiseResolves: ((yes: boolean) => void)[] = [];

export async function responsePromise(): Promise<boolean> {
    return new Promise((resolve) => {
        responsePromiseResolves.push(resolve);
    });
}

export default function scanStatusBannerFunc() {
    const [$showScanStatusBanner] = clientSignal(showScanStatusBanner);

    return (
        <div data-turbo-permanent id="scan-status-banner">
            <Show when={$showScanStatusBanner()}>
                <For each={scanState.tasks}>
                    {(task) => (
                        <div class="scan-status-banner-scan-task">
                            {task.scanned.toLocaleString()} of{' '}
                            {task.total.toLocaleString()} track
                            {task.total === 1 ? '' : 's'} scanned
                        </div>
                    )}
                </For>
            </Show>
        </div>
    );
}
