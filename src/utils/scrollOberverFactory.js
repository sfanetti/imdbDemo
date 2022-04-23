import { debounce } from './async.js';
export const GET_NEXT_PAGE = 'ScrollObserver.getNextPage';
export const CURRENT_PAGE = 'ScrollObserver.currentPage';


/**
 * Returns an object that is convigured to watch the scroll events coming from the passed 
 * in element.  When the scroll point reaches a threshold 
 * @param {htmlElement} element - the scroll container that will be watched
 * @param {object} meta Object with page number, page count, and total pages
 * @param {number} threshold the 0-1 value that represents the scroll position at another 
 * @param {number} deboundLImit the debounce time for the scroll events 
 * page should be requested
 */
const DEBOUNCE_LIMIT = 500;
export function createScrollObserver(element, meta, threshold = 0.9, deboundLImit = DEBOUNCE_LIMIT) {

    class ScrollObserver {
        _parent;
        _element;
        _threshold;
        _deboundLImit;

        _meta;

        _onScroll;
        _pagingCallback;
        _currentPageCallback;

        _watching = false;
        _pageBoundaries = [];
        _currentPageIndex = 0;
        _dispatcher;

        constructor(element, meta, threshold, deboundLImit) {
            this._element = element;
            this.meta = meta;
            this.threshold = threshold;

            let par = element.parentNode;
            while(par && !par.host) {
                par = par.parentNode;
            }

            this._dispatcher = par ? par.host : element.parentElement;

            this._onScroll = this.onScroll.bind(this);
            this._pagingCallback = debounce(this, this.updateScrollRatio, deboundLImit);
            this._currentPageCallback = debounce(this, this.updateCurrentPage, deboundLImit/5);

            this.watch();
        }

        set meta(meta) {
            this._meta = meta;
            if (this._meta && this._element) {
                const { page } = this._meta;
                this.updatePageBoundaries(page, { top: this._element.scrollTop });
            }
        }

        set threshold(value) {
            this._threshold = value;
        }

        set dispatcher(eventDispatcher) {
            this._dispatcher = eventDispatcher;
        }

        get currentPage () {

            const { scrollTop } = this._element || {};
            if (!isNaN(scrollTop)) {
                const pages = this._pageBoundaries.length;
                if (pages === 1) return 1;
                for (let i = 0; i < pages; i++ ) {
                    const { pageNumber, top, bottom } = this._pageBoundaries[i];
                    const scrollTopIsUnderTopOfPage = scrollTop > top;

                    console.log(scrollTop, this._pageBoundaries.length );

                    if (scrollTopIsUnderTopOfPage && !bottom) {
                        this._currentPageIndex = i;
                        return pageNumber;
                        
                    }
                    const scrollTopIsAboveBottomOfPage = scrollTop < bottom;
                    if (scrollTopIsUnderTopOfPage && scrollTopIsAboveBottomOfPage ) {
                        this._currentPageIndex = i;
                        return pageNumber;
                    }
                }
            }
            const { pageNumber } = this._pageBoundaries[this._currentPageIndex] || {};

            return pageNumber || 1;
        }

        get dispatcher() {
            const { parentNode } = this._element || {};
            const { host } = parentNode || {}
            const parent = host;
            if (parent) {
                return parent;
            }
        }

        reset(){
            this._pageBoundaries.length = 0;
            this._currentPageIndex = 0;
        }

        updatePageBoundaries(pageNumber, options) {
            const { top, bottom } = options;
            const index = this._pageBoundaries.findIndex(boundary => boundary.pageNumber === pageNumber );

            if (index === -1) {
                this._pageBoundaries.push({ pageNumber, top, bottom });
            } else {
                const boundary = this._pageBoundaries[index];
                const updated = Object.assign(boundary, options);
                this._pageBoundaries.splice(index, updated);
            }
        }

        updateScrollRatio(ratio, scrollTop, target, parent) {
            console.log(`Scrolling ratio is at: ${ratio}`);
            if (ratio > this._threshold && this._element === target) {
                const { page, pages, searchTerm } = this._meta;
                if ( page < pages) {
                    this.updatePageBoundaries(page, { bottom: scrollTop});

                    const payload = { ratio, scrollTop, target, parent, page: page + 1, searchTerm };
                    const eventDispatcher = this._dispatcher || parent;
                    eventDispatcher.dispatchEvent(new CustomEvent(GET_NEXT_PAGE, {detail: payload}));
                }

            }       
        }

        updateCurrentPage() {
            console.log( `currentPage = ${this.currentPage}`);

            const eventDispatcher = this.dispatcher;
            if (eventDispatcher) {
                const detail = { currentPage: this.currentPage };
                const eventData = { detail };
                eventDispatcher.dispatchEvent(new CustomEvent(CURRENT_PAGE, eventData));
            }
        }

        onScroll(e) {
            const { target } = e;
            const { parentNode } = target;
            const { host } = parentNode;
            const parent = host || parentNode;
            const { offsetHeight: parentOffsetHeight } = parent;
            const { scrollTop, scrollHeight } = target;
            const range = scrollHeight - parentOffsetHeight;
            const ratio = range ? scrollTop/range : 0;

            this._currentPageCallback();
            this._pagingCallback(ratio, scrollTop, target, parent);

        }

        watch() {
            if (this._element) {
                this._element.addEventListener('scroll', this._onScroll);
            }
        }


        unwatch() {
            if (this._element) {
                this._element.removeEventListener('scroll', this._onScroll);
            }
        }
    }
    return new ScrollObserver(element, meta, threshold, deboundLImit);
}