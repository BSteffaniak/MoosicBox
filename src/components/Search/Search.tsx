import './search.css';
import { createSignal } from 'solid-js';
import { debounce } from '@solid-primitives/scheduled';

export default function searchInput() {
    const [searchFilterValue, setSearchFilterValue] = createSignal('');

    async function search(searchString: string) {
        setSearchFilterValue(searchString);
    }

    return (
        <div class="search-container">
            <input
                class="search-albums"
                type="text"
                placeholder="Search..."
                value={searchFilterValue()}
                onInput={debounce(async (e) => {
                    await search(e.target.value ?? '');
                }, 200)}
            />
            <div class="search-backdrop"></div>
        </div>
    );
}
