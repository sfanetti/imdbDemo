import MovieProvider from "./services/MovieProvider.js";
import { debounce } from './utils/async.js';
import { MOUNTED, UNMOUNTED } from "./components/Component.js";
import { GET_NEXT_PAGE } from "./utils/scrollOberverFactory.js";

import AppSettings, { SET_API_KEY } from "./components/app-settings/component.js";
import ListMovies, { SELECT_MOVIE } from './components/list-movies/component.js';
import MovieDetails from './components/movie-details/component.js';
import ListMovieItem from "./components/list-movie-item/component.js";
import SearchBar, {SEARCH, CLEAR} from './components/search-bar/component.js';

customElements.define(AppSettings.identifier, AppSettings);
customElements.define(ListMovies.identifier, ListMovies);
customElements.define(MovieDetails.identifier, MovieDetails);
customElements.define(SearchBar.identifier, SearchBar);
customElements.define(ListMovieItem.identifier, ListMovieItem);


class Main {
    searchMovies;
    loadMovie;

    currentMovie;
    searchBar;
    appSettings;
    
    listMovies;
    listScrollContainer;
    
    movieDetails;
    detailsScrollContainer;

    _sortedMoviePages = [];
    _currentSearchTerm = '';

    constructor(rootSelector) {
        this.init(rootSelector);
        this.searchMovies = debounce(MovieProvider.instance, MovieProvider.instance.loadSortableMovieSet, 1000);
        this.loadMovie = debounce(MovieProvider.instance, MovieProvider.instance.getMovie, 500);

    }

    async onSearch({ detail }) {
        const { searchTerm, page } = detail;

        if (!this.listMovies.loading) {
            try {
                this.listMovies.loading = true;
                this.listMovies.model = await this.getMovieListPage(searchTerm, page);
            } catch(e) {
                console.log(`ERROR:  ${e.message}`);
            }
            this.listMovies.loading = false;
        }
    }

    async getMovieListPage( searchTerm, page = 1 ) {
        if (this._currentSearchTerm !== searchTerm) {
            this.onClearSearch();
            this._currentSearchTerm = searchTerm;
        }
        let pageInfo;
        if (!this._sortedMoviePages.length) {
            try {
                const result = await this.searchMovies(searchTerm);
                this._sortedMoviePages = result.data;
            } catch(result) {
                this._sortedMoviePages.length = 0;
                const {info} = result;
                pageInfo = info;
            } 
        }
        const pageIndex = page - 1;
        const pages = this._sortedMoviePages.length;
        const hasPage = pageIndex < pages;
        const pageData = hasPage ? this._sortedMoviePages[pageIndex] : {};

        const { yearEnd, yearStart, count, movies } = pageData;

        return {
            meta: {
                page,
                pages,
                searchTerm,
                pageSize: count,
                yearStart,
                yearEnd
            },
            data: movies,
            info: pageInfo
        }
    }

    onClearSearch() {
        this._sortedMoviePages.length = 0;
        this._currentSearchTerm = '';
        this.listMovies.reset();
    }

    onSetApiKy({detail}) {
        const { apiKey } = detail;
        MovieProvider.instance.apiKey = apiKey;
    }

    async onSelectMovie({ detail: imdbId }) {
        console.log(imdbId);
        this.movieDetails.loading = true;
        try {
            this.movieDetails.model = await this.loadMovie(imdbId);
        } catch(e) {
            this.movieDetails.error = true;
            console.log(`ERROR:  ${e.message}`);
        }
        this.movieDetails.loading = false;
    }

    init(rootSelector) {
        const root = document.querySelector(rootSelector);
        if (root) {
            root.addEventListener(MOUNTED, (event) => {
                const { detail: element } = event;

                switch(element.identifier) {
                    case AppSettings.identifier:
                        this.appSettings = element;
                        this.appSettings.addEventListener(SET_API_KEY, event => { this.onSetApiKy(event)});
                    break;
                    case ListMovies.identifier:
                        this.listMovies = element;
                        this.listMovies.addEventListener(SELECT_MOVIE, event => { this.onSelectMovie(event) });
                        this.listMovies.addEventListener(GET_NEXT_PAGE, event => { this.onSearch(event) })
                    break;
                    case MovieDetails.identifier:
                        this.movieDetails = element;
                    break;
                    case SearchBar.identifier:
                        this.searchBar = element;
                        this.searchBar.addEventListener(SEARCH, event => { this.onSearch(event)})
                        this.searchBar.addEventListener(CLEAR, event => { this.onClearSearch()})
                    break;
                }
            });

            root.addEventListener(UNMOUNTED, (event) => {
            })

            root.addEventListener(SELECT_MOVIE, event => {this.onSelectMovie(event) });
        }
    }
}

document.onreadystatechange = async function () {
    if (document.readyState === 'complete') {
        const main = new Main('body');
    }
}
