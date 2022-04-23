import { SEARCH, CLEAR } from '../../src/components/search-bar/Search.js.js';
import { wait } from '../../src/utils/async.js';

import Test from './Test.js';

export default class TestSearchInput extends Test{
    constructor() {
        super(...arguments, 'Test Search Component');
        this.setTests(this, [
            this.testShowSearch,
            this.testClearSearchTerm
        ]);
    }

    async testShowSearch() {
        const { deferred, done } = super.beginAssertions('It renders the search input component and dispatches SEARCH on input change');
        const SEARCH_TERM = 'idiocracy';

        const searchInput = document.createElement('search-bar');
        this._currentTestNode.appendChild(searchInput);

        const handleSearch = (event) => {
            this.assertEqual(SEARCH, event.type, 'The search event was dispatched when the input changed');
            this.assertEqual(SEARCH_TERM, event.detail, 'The search term was passed when the input changed');

            searchInput.removeEventListener(SEARCH, handleSearch);

            done();
            searchInput.remove();
        }

        searchInput.addEventListener(SEARCH, handleSearch);

        const inputElement = searchInput.element.querySelector('input');
        inputElement.value = SEARCH_TERM;
        inputElement.dispatchEvent(new Event('change'));
        return await deferred;
    }

    async testClearSearchTerm() {
        const { deferred, done } = super.beginAssertions('It clears the search input when the clear button is pushed');
        const SEARCH_TERM = 'Star Wars';

        const searchInput = document.createElement('search-bar');
        this._currentTestNode.appendChild(searchInput);


        const handleSearch = (event) => {
            this.assertEqual(SEARCH, event.type, 'The search event was dispatched when the input changed');
            this.assertEqual(SEARCH_TERM, event.detail, 'The search term was passed when the input changed');
            this.assertEqual(SEARCH_TERM, searchInput.searchTerm, 'The search input term was set');

            searchInput.removeEventListener(SEARCH, handleSearch);
        }

        const handleClear = async () => {
            this.assertEqual('', searchInput.searchTerm, 'The search term was cleared');
            
            await wait(1);
            const inputElement = searchInput.element.querySelector('input');
            this.assertEqual('', inputElement.value, 'After rerender the input value is unbound');

            done();
            searchInput.remove();
        }

        searchInput.addEventListener(CLEAR, handleClear);
        searchInput.addEventListener(SEARCH, handleSearch);
        const inputElement = searchInput.element.querySelector('input');
        inputElement.value = SEARCH_TERM;
        inputElement.dispatchEvent(new Event('change'));

        const clearButton = searchInput.element.querySelector('.clear-btn');
        clearButton.dispatchEvent(new MouseEvent('click'));
        return await deferred;
    }
}