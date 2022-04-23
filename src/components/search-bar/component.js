import Component from "../Component.js";
export const SEARCH = 'SearchComponent.search';
export const CLEAR = 'SearchComponent.clear';

const generateEvent = (type, searchTerm = '') => {
    return new CustomEvent(type, {bubbles: true , detail: { searchTerm }});
}

export default class SearchBar extends Component {
    static identifier = 'search-bar';
    static _rawTemplate;
    static _css;

    set rawTemplate(rawTemplate) {
        SearchBar._rawTemplate = rawTemplate;
    }
    get rawTemplate() {
        return SearchBar._rawTemplate;
    }

    set css(css) {
        SearchBar._css = css;
    }
    get css() {
        return SearchBar._css;
    }
    
    get identifier () {
        return SearchBar.identifier;
    }
    get identifier () {
        return SearchBar.identifier;
    }

    _searchTerm = '';
    _inputElement;

    set searchTerm(value) {
        this._isDirty = this._searchTerm !== value;
        this._searchTerm = value;
        this._inputElement.value = value;
    }

    get searchTerm() {
        return this._searchTerm;
    }

    onInputChange(event) {
        const newSearchTerm = event ? event.target.value.trim() : this._searchTerm;

        if (this._searchTerm === newSearchTerm) {
            return;
        }

        if (newSearchTerm.indexOf(this._searchTerm) !== 0) {
            // we started search over
            // clear and then issue new search
            const newEvent = generateEvent(CLEAR, this._searchTerm);
            this.dispatchEvent(newEvent);
        }

        this._searchTerm = newSearchTerm;
        const newEvent = generateEvent(SEARCH, this._searchTerm);
        this.dispatchEvent(newEvent);
    }

    onClickClear() {
        this.searchTerm = '';
        const newEvent = generateEvent(CLEAR, this._searchTerm);
        this.dispatchEvent(newEvent);
    }

    onSubmit(event) {
        event.preventDefault();
        this.onInputChange();
    }

    didMount() {
        this.addBoundEventMapping('change', 'input', this.onInputChange);
        this.addBoundEventMapping('input', 'input', this.onInputChange);
        this.addBoundEventMapping('click', `button`, this.onClickClear);
        this.addBoundEventMapping('submit', `form`, this.onSubmit);
        this._inputElement = this._shadow.querySelector(`input`);
    }
}

