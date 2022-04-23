import Component from "../Component.js";
import ListMovieItem from "../list-movie-item/component.js";
import { createScrollObserver, CURRENT_PAGE } from "../../utils/scrollOberverFactory.js";
import { UNMOUNTED } from "../Component.js";

export const SELECT_MOVIE = 'ListMovieItem.selectMovie';

const APPEND = 'append';
const REPLACE = 'replace';

export default class ListMovies extends Component {
    static identifier = 'list-movies';
    static _rawTemplate;
    static _css;

    set rawTemplate(rawTemplate) {
        ListMovies._rawTemplate = rawTemplate;
    }
    get rawTemplate() {
        return ListMovies._rawTemplate;
    }

    set css(css) {
        ListMovies._css = css;
    }
    get css() {
        return ListMovies._css;
    }
    
    get identifier () {
        return ListMovies.identifier;
    }

    _isLoading;
    _isError;
    _shouldReset;
    _lastYearRendered;

    _meta = {};
    _data = [];
    _info = {};

    _movieIds = [];
    _boundElements = {};
    _scrollObserver;

    _onListItemClick;
    _onlistItemUnmounted;
    _onCurrentPageUpdate;

    constructor() {
        super();
        this._onListItemClick = this.onListItemCLick.bind(this);
        this._onlistItemUnmounted = this.onListItemUnmounted.bind(this);
        this._onCurrentPageUpdate = this.onCurrentPageUpdate.bind(this);
    }

    set loading(value) {
        this._isLoading = value;
        this.classList.remove('hide');
        const innerContainer = this.getChildBySelector('.inner-container');
        if (innerContainer) {
            if (value) {
                innerContainer.classList.add('loading');
            } else {
                innerContainer.classList.remove('loading');
            }
        }
        this.updateLoadingDisplay();
    }

    get meta () {
        const { page: _page, total: _total, pages: _pages, searchTerm: _searchTerm } = this._meta;
        return { _page, _total, _pages, _searchTerm };
    }

    set model (model) {
        let updateStrategy = REPLACE;
        const { data = [], meta, info } = model || {};

        if (meta) {
            const { page, searchTerm } = meta;
            const { page: _page, pages: _pages, searchTerm: _searchTerm } = this._meta || {};

            if (_searchTerm !== searchTerm) {
                updateStrategy = REPLACE;
            } else if (_page <= _pages && _page < page ) {
                updateStrategy = APPEND;
            }
        }

        this._meta = meta;
        this._info = info;
        this._isError = info && !info.success; 
        this._data = updateStrategy === REPLACE ? {...data} :{...this._data, ...data};
        this._shouldReset = updateStrategy === REPLACE;
        this._lastYearRendered = updateStrategy === REPLACE ? 0 : this._lastYearRendered;
        this.requestUpdateTemplate();
    }

    getErrorMessage(message) {
        let errorMessage = this.getChildBySelector('[data-errorResponse]');
        if (!message && errorMessage) {
            errorMessage.remove();
        }

        if (errorMessage) {
            this.getChildBySelector('[data-error]').innerHTML = message;
        } else {
            const container = document.createElement('div');
            container.insertAdjacentHTML('afterbegin',`
                <div class="error-message" data-errorResponse>
                    <h3>Error</h3>
                    <p data-error>${message}</p>
                </div>`
                );
            errorMessage = container.firstChild;
        }
        return message ? errorMessage : null;
    }

    updateStatusMessage(meta) {
        const resultInfo = this.getChildBySelector('[data-resultInfo]');
        if(!meta && resultInfo) {
            resultInfo.remove();
            return null;
        }
        const { page, total, pages } = meta || {};
        const pluralMovies = total > 1;
        const pluralPages = pages > 1;
        const message = `Displaying page ${page} of ${pages} page${ pluralPages ? `s` : `` } with ${total} movie${ pluralMovies ? `s` : ``} in results`;
        
        const container = resultInfo || document.createElement('div');
        container.innerHTML = `<div class="result-info" data-resultInfo>${message}</div>`;
        return meta ? (resultInfo ||container.firstChild) : null;
    }

    onListItemCLick(event) {
        const model = event.target.model;
        if (model) {
            const { id } = model;
            this.dispatchEvent(new CustomEvent(SELECT_MOVIE, { detail: id}));
            event.stopPropagation();
            event.preventDefault();
        }
    }

    onListItemUnmounted({ target }){
        if (target) {
            target.removeEventListener('click', this._onListItemClick );
            target.removeEventListener(UNMOUNTED, this._onlistItemUnmounted);
        }
    }

    onCurrentPageUpdate({detail}) {
        const { currentPage } = detail || {};
        if (this._meta) {
            const currentMeta = Object.assign(this._meta, { page: currentPage })
    
            requestAnimationFrame(() => {
                this.updateStatusMessageTemplate(currentMeta);
            });
        }
    }


    reset(){
        this._shouldReset = true;
        this._data.length = 0;
        this._meta = null;
        this._info = null;
        if (this._scrollObserver) {
            this._scrollObserver.reset();
        }
        this.requestUpdateTemplate();
    }

    updateStatusMessageTemplate(meta) {
        const listContainer = this.getChildBySelector('[data-data]');
        const newResultInfo = this.updateStatusMessage(meta);
        if (newResultInfo && listContainer){
            newResultInfo.remove();
            listContainer.insertAdjacentHTML('beforebegin', newResultInfo.outerHTML);
        }
    }

    createYearDisplayNode(year, lastYearRendered) {
        let continued = '';
        if (lastYearRendered === year) {
            continued = '(continued)';
        }

        const yearDisplay = document.createElement('h4');
        yearDisplay.innerText = `Movies released in ${year} ${continued}`;
        yearDisplay.class= 'year-title';
        return yearDisplay;
    }


    createPage(listContainer) {
        const {
            yearStart,
            yearEnd
        } = this._meta || {};
        const data = this._data || [];

        if (yearStart && yearEnd) {
            for (let year = yearStart; year >= yearEnd; year--) {
                const movies = data[year];
                if (movies) {
                    listContainer.appendChild(this.createYearDisplayNode(year, this._lastYearRendered));
                    this._lastYearRendered = year;
                    Object.keys(movies).forEach((id, index) => {
                        const item = movies[id];
                        const listItem = new ListMovieItem(item);
                        if (index < 5) {
                            listItem.eager = true;
                        }
                        listItem.classList.add('movie-item');
                        this._movieIds.push(item.id);
                        listContainer.appendChild(listItem);
                        listItem.addEventListener('click', this._onListItemClick );
                        listItem.addEventListener(UNMOUNTED, this._onlistItemUnmounted);
                    })
                }
            }
        }
    }

    updateLoadingDisplay() {
        const loadingIcon = this.getChildBySelector('.loading-icon-container');
        if (loadingIcon) {
            if (this._isLoading) {
                loadingIcon.classList.remove('hidden');
            } else {
                loadingIcon.classList.add('hidden');
            }
        }

    }

    updateErrorMessage() {
        const errorContainer = this.getChildBySelector('.error-container');

        if (errorContainer) {
            if (this._info && this._isError) {
                if (this._info.success) {
                    errorContainer.classList.add('hidden');
                } else {
                    errorContainer.classList.remove('hidden');
                }
                const message = this.getChildBySelector('[data-bind=errorMessage]');
                if (message) {
                    message.innerText = this._info.error || 'An unknown error occured';
                }
            } else {
                errorContainer.classList.add('hidden');
            }
        }
    }

    updateTemplate() {
        if (this._hasHydrated) {
            const listContainer = this.getChildBySelector('[data-data]');

            if (this._shouldReset && listContainer) {
                listContainer.innerHTML = '';
                this._movieIds.length = 0;
                this._shouldReset  = false;
            }

            if (this._scrollObserver) {
                this._scrollObserver.meta = this._meta;
            }

            if (listContainer && this._data) {
                this.createPage(listContainer);
            }
            this.updateLoadingDisplay();
            this.updateErrorMessage();
        }
    }

    didMount() {
        this.requestUpdateTemplate();
        this.addEventListener(CURRENT_PAGE, this._onCurrentPageUpdate);

        if (!this._scrollObserver) {
            const listContainer = this.getChildBySelector('[data-data]');
            this._scrollObserver = createScrollObserver(listContainer, this._meta);
        } else {
            this._scrollObserver.meta = this._meta;
        }
    }

    didUnmount() {
        if (this._scrollObserver) {
            this._scrollObserver.unwatch();
        }
        this.removeEventListener(CURRENT_PAGE, this._onCurrentPageUpdate);
    }
}