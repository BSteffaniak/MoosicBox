import './main.css';
import { onMount } from 'solid-js';
import type { JSXElement } from 'solid-js';
import { clientSignal, isMobile } from '~/services/util';
import { isServer } from 'solid-js/web';
import PlaybackQualityModal from '~/components/PlaybackQualityModal';
import PlaybackSessionsModal from '~/components/PlaybackSessionsModal';
import Search from '~/components/Search';
import { navigationBarExpanded, triggerStartup } from '~/services/app';

export type MainFuncProps = {
    children: JSXElement;
};

export default function mainFunc(props: MainFuncProps) {
    const [$navigationBarExpanded, setNavigationBarExpanded] = clientSignal(
        navigationBarExpanded,
    );

    onMount(async () => {
        if (isServer) return;

        if (isMobile()) {
            setNavigationBarExpanded(false);
        }

        await triggerStartup();
    });

    return (
        <main
            id="swup"
            class={`transition-fade main-content${
                $navigationBarExpanded() ? ' normal' : ' wide'
            }`}
        >
            <Search />
            {props.children}
            <PlaybackQualityModal />
            <PlaybackSessionsModal />
        </main>
    );
}
