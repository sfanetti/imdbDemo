import { API_STORAGE_KEY } from "../components/app-settings/component.js";

const BASE_URL = 'https://www.omdbapi.com';
const TYPE = 'movie';
const PAGE_SIZE = 10;
const NOT_APPLICABLE = 'N/A';

export default class MovieProvider {
    static _instance;
    static _apiKey = localStorage.getItem(API_STORAGE_KEY) || '';
    static get instance() {
        if (!MovieProvider._instance) {
            MovieProvider._instance = new MovieProvider();
        }
        return MovieProvider._instance;
    }

    _fullMovieList = [];

    get hasApiKey() {
        return !!this._apiKey;
    }

    set apiKey(value) {
        this._apiKey = value;
    }

    _getBaseUrl() {
        return `${BASE_URL}/?type=${TYPE}&apiKey=${MovieProvider._apiKey}`;
    }

    _normallizeListResponse (item) {
        const { imdbID: id, Title: title, Year: year, Poster, Type: type } = item;
        const imageSrcSet = this._getImageSet(Poster);
        const imageUrlDefault = Poster;
        const imageUrl = imageUrlDefault;
        return { id, title, year, type, imageUrl, imageSrcSet, imageUrlDefault};
    }

    _getImageSet(imageUrl) {
        if (imageUrl === NOT_APPLICABLE) {
            return "";
        }
        const CAPTURE_RES = /(^.+SX)([0-9]+)(.+$)/;
        const srcSet = [];
        try {
            const [, baseUrl, resolution, type] = CAPTURE_RES.exec(imageUrl);
            for ( let i = 1; i < 1200; i += 100) {
                srcSet.push(`${baseUrl}${i}${type} ${i}w`);
                // the api will allow me to get a single pixel poster so I can set the images that are 
                // well offscreen to be 1x1 px and the browser will dump the live sized image;
                if (i==1) {
                    i = 100;
                }
            }
        } catch(e){
            // ignore this failure
        }
        return srcSet.join(',');
    }

    _normalizeDetailResponse (item) {
        const { 
            imdbID: id, 
            Title: title, 
            Year: year, 
            Poster: imageUrl,
            Type: type,
            Rated: rated,
            Released: released,
            Runtime: runTime,
            Genre: genre,
            Director: director,
            Writer: writer,
            Actors: actors,
            Plot: plot,
            Language: language,
            Country: country,
            Awards: awards,
            Metascore: metasScore,
            Ratings: ratings,
            imdbRating,
            imdbVotes,
            DVD: dvd,
            BoxOffice: boxOffice,
            Production: production,
            Website: website
        } = item;

        const imageUrlDefault = imageUrl;
        const collection = {};
        ratings.forEach((rating, index) => {
            const { Source, Value } = rating;
            collection[`ratingsSource${index}`] = Source;
            collection[`ratingsValue${index}`] = Value;
        });
        const imageSrcSet = this._getImageSet(imageUrl);
        const model = {
            id, title, year, type, rated, released, runTime,
            genre, director, writer, actors, plot, language,
            country, awards, metasScore, imdbRating, imdbVotes,
            dvd, boxOffice, production, website, imageSrcSet, 
            imageUrl, imageUrlDefault, ...collection
        }
        return model;
    }

    _normalizeResponse(result, searchTerm = '', page = 1) {
        const { Response: response, Error: error, Search = [], totalResults } = result;
        let data, meta = {};
        data = Search.map(this._normallizeListResponse.bind(this));
        const total = Number(totalResults || 0);
        const pages = Math.ceil(total/PAGE_SIZE);
        meta = {
            page,
            total,
            pages,
            searchTerm
        };
        const info = {
            success: response === 'True',
            error
        };
        return {
            info,
            data,
            meta
        }
    }

    async _resolveResponse (response) {
        return response.then(async res => {
            if (res.ok) {
                const result = await res.json();
                console.log(result);
                return result;
            } else {
                const Error = res.status === 401 ? 'You must enter a valid API key to search' : 'An error occured - please try again later';
                return { Response: 'False', Error, Search: [], totalResults: 0 };
            }
        });
    }

    _createGetMoviesPromise(searchTerm, page, moviesByYear) {
         return new Promise(async (resolve, reject) => {
            const result = await this.getMovies(searchTerm, page);
            if (result.info.success) {
                const { data } = result;
                data.forEach(movie => {
                    const { year } = movie;
                    moviesByYear[year] = moviesByYear[year] || [];
                    moviesByYear[year].push(movie);
                })

                resolve(result);
            } else {
                reject(result);
            }
        })
    }

    async loadSortableMovieSet(searchTerm) {
        return new Promise( async (resolve, reject) => {
            const moviesByYear = [];
            const promises = [];
    
            const initialPromise = this._createGetMoviesPromise(searchTerm, 1, moviesByYear)
                .then(result => {
                    const { meta, info } = result;
                    if (info.success) {
                        const { page, pages } = meta;
                        if (page < pages) {
                            for (let _page = page + 1; _page <= pages; _page++ ) {
                                promises.push(this._createGetMoviesPromise( searchTerm, _page, moviesByYear ));
                            }
                        }
                    }
                })
                .catch( result => {
                    const { info } = result;
                    reject({
                        data: [],
                        meta: {
                            pages: 0,
                            page: 1,
                            total: 0,
                            searchTerm,
                            size: PAGE_SIZE
                        },
                        info
                    });
                })
                .finally(() => {
                    promises.push(initialPromise);
                });
    
            await initialPromise;

            if (moviesByYear.length > 0 ) {
                return Promise.allSettled(promises).finally(() => {
                    let lowestYearIndex = 0;
                    let highestMovieIndex = 0;
                    // apparently first movie ever made was made in 1872
                    for (let yearIndex = 1872; yearIndex < moviesByYear.length; yearIndex++) {
                        const movies = moviesByYear[yearIndex];
                        if (movies) {
                            lowestYearIndex = !!lowestYearIndex ? lowestYearIndex : yearIndex;
                            movies.length > 1 ? movies.sort((a, b) => a.title > b.title ? 1 : -1) : movies;
                            highestMovieIndex = highestMovieIndex < yearIndex ? yearIndex : highestMovieIndex;
                        }
                    }
                    const pageObjects = [];
                    let currentPage;
                    let total = 0;
                    let yearIndex = highestMovieIndex;
                    for(; yearIndex >= lowestYearIndex; yearIndex-- ) {
                        const yearArray = moviesByYear[yearIndex];
                        if (yearArray && yearArray.length) {
                            if (!currentPage) {
                                currentPage = { yearStart: yearIndex, movies: {}, count: 0, yearEnd: -1 };
                                pageObjects.push(currentPage);
                            }
                            currentPage.movies[ yearIndex ] = currentPage.movies[ yearIndex ] || {};
                            while(yearArray.length) {
                                const movieInfo = yearArray.shift();
                                if (movieInfo) {
                                    const { id } = movieInfo;
                                    if (!currentPage.movies[ yearIndex ][id]) {
                                        currentPage.movies[ yearIndex ][id] = movieInfo;
                                        currentPage.count++;
                                        total++;
                                    } else {
                                        console.log(movieInfo, currentPage.movies[ yearIndex ][id]);
                                    }
                                    currentPage.yearEnd = yearIndex;
                                }
                            }
                            if (currentPage.count > PAGE_SIZE) {
                                currentPage = null;
                            }
                        }
                    }
                    if(currentPage && currentPage.yearEnd === -1) {
                        currentPage.yearEnd = yearIndex
                    }
        
                    resolve({
                        data: pageObjects,
                        meta: {
                            pages: pageObjects.length,
                            page: 1,
                            total,
                            searchTerm,
                            size: PAGE_SIZE
                        }
                    });
                });
            }
        });
    } 


    async getMovies(searchTerm, page = 1) {
        if (!searchTerm || page < 1) {
            throw new Error('Illegal search term or page number');
        }
        const url = `${this._getBaseUrl()}&s=${searchTerm}&page=${page}`;
        const result = await this._resolveResponse(fetch(url));
        return this._normalizeResponse(result, searchTerm, page);

    }

    async getMovie(id) {
        const url = `${this._getBaseUrl()}&i=${id}`;
        const result = await this._resolveResponse(fetch(url));
        return this._normalizeDetailResponse(result);
    }

    set apiKey (value) {
        MovieProvider._apiKey = value;
    }

    reset() {
        MovieProvider._apiKey = API_KEY;
    }
}


