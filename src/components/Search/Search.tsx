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
            <div class="search-label-container">
                <label class="search-label">
                    <input
                        class="search-input"
                        title="Search..."
                        type="text"
                        onFocus={(e) => e.target.select()}
                        value={searchFilterValue()}
                        onInput={debounce(async (e) => {
                            await search(e.target.value ?? '');
                        }, 200)}
                    />
                    <div class="search-backdrop"></div>
                </label>
            </div>
        </div>
    );
}
