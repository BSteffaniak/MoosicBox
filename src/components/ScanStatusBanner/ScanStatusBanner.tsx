import './scan-status-banner.css';
import { showScanStatusBanner } from '~/services/app';
import { clientSignal, deepEqual } from '~/services/util';
import { scanState, ScanTask } from '~/services/scan';
import { createEffect, createSignal, For, on, Show } from 'solid-js';

const responsePromiseResolves: ((yes: boolean) => void)[] = [];

export async function responsePromise(): Promise<boolean> {
    return new Promise((resolve) => {
        responsePromiseResolves.push(resolve);
    });
}

export default function scanStatusBannerFunc() {
    const [$showScanStatusBanner] = clientSignal(showScanStatusBanner);

    const [hiddenTasks, setHiddenTasks] = createSignal<ScanTask[]>([]);

    createEffect(
        on(
            () => scanState.tasks,
            (tasks) => {
                setHiddenTasks(
                    hiddenTasks().filter((task) => {
                        return tasks.some((x) => deepEqual(task, x.task));
                    }),
                );
            },
        ),
    );

    return (
        <div data-turbo-permanent id="scan-status-banner">
            <Show when={$showScanStatusBanner()}>
                <For each={scanState.tasks}>
                    {(task) => (
                        <Show
                            when={hiddenTasks().every(
                                (x) => !deepEqual(x, task.task),
                            )}
                        >
                            <div class="scan-status-banner-scan-task">
                                {task.scanned.toLocaleString()} of{' '}
                                {task.total.toLocaleString()} track
                                {task.total === 1 ? '' : 's'} scanned
                                <button
                                    class="remove-button-styles"
                                    onClick={() =>
                                        setHiddenTasks([
                                            ...hiddenTasks(),
                                            task.task,
                                        ])
                                    }
                                >
                                    <img
                                        class="cross-icon"
                                        src="/img/cross-white.svg"
                                        alt="Dismiss banner"
                                    />
                                </button>
                            </div>
                        </Show>
                    )}
                </For>
            </Show>
        </div>
    );
}
