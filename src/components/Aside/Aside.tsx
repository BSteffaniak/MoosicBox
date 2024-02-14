import './aside.css';
import { clientSignal } from '~/services/util';
import { navigationBarExpanded } from '~/services/app';

export default function asideFunc() {
    const [$navigationBarExpanded, setNavigationBarExpanded] = clientSignal(
        navigationBarExpanded,
    );

    return (
        <aside
            data-turbo-permanent
            id="navigation-sidebar"
            class={`navigation-bar-container${
                $navigationBarExpanded() ? ' expanded' : ' collapsed'
            }`}
        >
            <div class="navigation-bar">
                <div class="navigation-bar-header">
                    <h1>MoosicBox</h1>
                    <a class="settings-link" href="/settings">
                        <img
                            class="settings-gear-icon"
                            src="/img/settings-gear-white.svg"
                        />
                    </a>
                    <div
                        class={`${$navigationBarExpanded() ? 'collapse-navigation-bar' : 'expand-navigation-bar'}`}
                    >
                        <img
                            src={
                                $navigationBarExpanded()
                                    ? `/img/chevron-left-white.svg`
                                    : `/img/chevron-right-white.svg`
                            }
                            onClick={() =>
                                setNavigationBarExpanded(
                                    !$navigationBarExpanded(),
                                )
                            }
                        />
                    </div>
                </div>
                <ul>
                    <li>
                        <a href="/">Home</a>
                    </li>
                    <li>
                        <a href="/downloads">Downloads</a>
                    </li>
                </ul>
                <h1 class="my-collection-header">My Collection</h1>
                <ul>
                    <li>
                        <a href="/albums">Albums</a>
                    </li>
                    <li>
                        <a href="/artists">Artists</a>
                    </li>
                </ul>
            </div>
        </aside>
    );
}
