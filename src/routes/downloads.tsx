import Album from '~/components/Album';
import './downloads.css';
import { For, Show } from 'solid-js';
import type { JSXElement } from 'solid-js';
import { Api } from '~/services/api';
import type { ApiSource } from '~/services/api';
import { downloadsState } from '~/services/downloads';
import {
    displayApiSource,
    displayDownloadTaskState,
} from '~/services/formatting';
import Artist from '~/components/Artist';

function downloadTaskProgress(task: Api.DownloadTask): JSXElement {
    return (
        <>
            <div class="downloads-download-task-progress-details">
                {typeof task.bytes === 'number' &&
                typeof task.totalBytes === 'number'
                    ? `${(task.bytes / 1024 / 1024).toFixed(2)}/${(
                          task.totalBytes /
                          1024 /
                          1024
                      ).toFixed(2)} MiB - `
                    : ''}
                {~~task.progress}%
                {task.speed ? ` - ${(task.speed / 1024).toFixed(2)} KiB/s` : ''}
            </div>
            <div class="downloads-download-task-progress-bar">
                <div
                    class="downloads-download-task-progress-bar-progress"
                    style={{
                        width: `${task.progress}%`,
                    }}
                ></div>
                <div class="downloads-download-task-progress-bar-progress-trigger"></div>
            </div>
        </>
    );
}

function downloadTask(task: Api.DownloadTask): JSXElement {
    const item = task.item;
    const taskType = item.type;

    switch (taskType) {
        case 'TRACK': {
            return (
                <>
                    <div class="downloads-download-task-cover">
                        <Album
                            album={
                                {
                                    ...task.item,
                                    type: 'LIBRARY',
                                } as unknown as Api.Track
                            }
                            size={80}
                        />
                    </div>
                    <div class="downloads-download-task-details">
                        <div class="downloads-download-task-header-details">
                            Track ({item.trackId}) - {item.title} -{' '}
                            {displayDownloadTaskState(task.state)} -{' '}
                            {displayApiSource(item.source as ApiSource)}
                        </div>
                        <div class="downloads-download-task-location-details">
                            {task.filePath}
                        </div>
                        <div class="downloads-download-task-progress">
                            <Show when={task.state === 'STARTED'}>
                                {downloadTaskProgress(task)}
                            </Show>
                        </div>
                    </div>
                </>
            );
        }
        case 'ALBUM_COVER': {
            return (
                <>
                    <div class="downloads-download-task-cover">
                        <Album
                            album={
                                {
                                    ...task.item,
                                    type: 'LIBRARY',
                                } as unknown as Api.Track
                            }
                            size={80}
                        />
                    </div>
                    <div class="downloads-download-task-details">
                        <div class="downloads-download-task-header-details">
                            Album ({item.albumId}) cover - {item.title} -{' '}
                            {displayDownloadTaskState(task.state)}
                        </div>
                        <div class="downloads-download-task-location-details">
                            {task.filePath}
                        </div>
                        <div class="downloads-download-task-progress">
                            <Show when={task.state === 'STARTED'}>
                                {downloadTaskProgress(task)}
                            </Show>
                        </div>
                    </div>
                </>
            );
        }
        case 'ARTIST_COVER': {
            return (
                <>
                    <div class="downloads-download-task-cover">
                        <Artist
                            artist={
                                {
                                    ...task.item,
                                    type: 'LIBRARY',
                                } as unknown as Api.Artist
                            }
                            size={80}
                        />
                    </div>
                    <div class="downloads-download-task-details">
                        <div class="downloads-download-task-header-details">
                            Artist ({item.artistId}) (album_id: {item.albumId})
                            cover - {item.title} -{' '}
                            {displayDownloadTaskState(task.state)}
                        </div>
                        <div class="downloads-download-task-location-details">
                            {task.filePath}
                        </div>
                        <div class="downloads-download-task-progress">
                            <Show when={task.state === 'STARTED'}>
                                {downloadTaskProgress(task)}
                            </Show>
                        </div>
                    </div>
                </>
            );
        }
        default:
            taskType satisfies never;
            throw new Error(`Invalid taskType: '${taskType}'`);
    }
}

export default function downloadsPage() {
    return (
        <div class="downloads-page">
            <div class="downloads-header-text-container">
                <h1 class="downloads-header-text">Downloads</h1>
            </div>
            <Show when={downloadsState.currentTasks.length > 0}>
                <div class="downloads-download-tasks downloads-download-tasks-current">
                    <h2 class="downloads-header-text">Queue</h2>
                    <For each={downloadsState.currentTasks}>
                        {(task) => (
                            <div
                                class={`downloads-download-task${
                                    task.state === 'PENDING' ? ' pending' : ''
                                }${task.state === 'PAUSED' ? ' paused' : ''}${
                                    task.state === 'STARTED' ? ' started' : ''
                                }`}
                            >
                                {downloadTask(task)}
                            </div>
                        )}
                    </For>
                </div>
            </Show>
            <Show when={downloadsState.historyTasks.length > 0}>
                <div class="downloads-download-tasks downloads-download-tasks-history">
                    <h2 class="downloads-header-text">History</h2>
                    <For each={downloadsState.historyTasks}>
                        {(task) => (
                            <div
                                class={`downloads-download-task${
                                    task.state === 'CANCELLED'
                                        ? ' cancelled'
                                        : ''
                                }${
                                    task.state === 'FINISHED' ? ' finished' : ''
                                }${task.state === 'ERROR' ? ' error' : ''}`}
                            >
                                {downloadTask(task)}
                            </div>
                        )}
                    </For>
                </div>
            </Show>
        </div>
    );
}
