import MovieProvider from '../../src/services/MovieProvider.js';
import Test from './Test.js';

const IDIOCRACY = {
    "title": "Idiocracy",
    "year": "2006",
    "rated": "R",
    "released": "25 Jan 2007",
    "runtime": "84 min",
    "genre": "Adventure, Comedy, Sci-Fi",
    "director": "Mike Judge",
    "writer": "Mike Judge, Etan Cohen",
    "actors": "Luke Wilson, Maya Rudolph, Dax Shepard",
    "plot": "Private Joe Bauers, a decisively average American, is selected as a guinea pig for a top-secret hibernation program but is forgotten, awakening to a future so incredibly moronic he's easily the most intelligent person alive.",
    "language": "English",
    "country": "United States",
    "awards": "1 nomination",
    "poster": "https://m.media-amazon.com/images/M/MV5BMWQ4MzI2ZDQtYjk3MS00ODdjLTkwN2QtOTBjYzIwM2RmNzgyXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_SX300.jpg",
    "ratings": [
      {
        "source": "Internet Movie Database",
        "value": "6.5/10"
      },
      {
        "source": "Rotten Tomatoes",
        "value": "73%"
      },
      {
        "source": "Metacritic",
        "value": "66/100"
      }
    ],
    "metascore": "66",
    "imdbRating": "6.5",
    "imdbVotes": "158,675",
    "imdbID": "tt0387808",
    "type": "movie",
    "dVD": "09 Jan 2007",
    "boxOffice": "$444,093",
    "production": "N/A",
    "website": "N/A",
    "response": "True"
  };

export default class TestMovieProvider extends Test {
    constructor() {
        super(...arguments, 'Test Movie Provider');
        this.setTests(this,[
                this.testLoadMovies, 
                this.testLoadMoviePages,
                this.testLoadMovie,
                this.testBadApiKey,
                this.testTooManyMovies
            ]);
    }

    async testLoadMovies() {
        super.beginAssertions('It will load a list of movies based on search term');
        const { data, meta } = await MovieProvider.instance.getMovies('idi');
        super.assertEqual(meta.page, 1, 'The first page was requested');
        super.assertEqual(data.length, 10, 'The first page of results was returned with 10 items');
        super.assertEqual(meta.pages, 3, 'three pages of results were returned');
    }

    async testLoadMoviePages() {
        super.beginAssertions('It will page through movie list');
        const { data: pageOne } = await MovieProvider.instance.getMovies('idi');
        const { data: pageTwo } = await MovieProvider.instance.getMovies('idi', 2);
        const { data: pageThree } = await MovieProvider.instance.getMovies('idi', 3);
        const { data: pageFour } = await MovieProvider.instance.getMovies('idi', 4);

        this.assertEqual(pageOne.length, 10, '10 pages were returned for page 1');
        this.assertEqual(pageTwo.length, 10, '10 pages were returned for page 2');
        this.assertEqual(pageThree.length, 3, '3 pages were returned for page 3');
        this.assertEqual(pageFour.length, 0, '0 pages were returned for page 4');
    }

    async testLoadMovie() {
        super.beginAssertions('It will load a single movie based on search term');

        const ID = 'tt0387808';
        const TITLE = 'Idiocracy';
        const YEAR = '2006';
        const POSTER_IMG = 'https://m.media-amazon.com/images/M/MV5BMWQ4MzI2ZDQtYjk3MS00ODdjLTkwN2QtOTBjYzIwM2RmNzgyXkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_SX300.jpg';
        const { data: pageOne } = await MovieProvider.instance.getMovies('idiocracy');
        const { id, title, year, imageUrl } = pageOne.shift();

        this.assertEqual(id, ID, 'The id was passed');
        this.assertEqual(TITLE, title, 'The title was passed');
        this.assertEqual(YEAR, year, 'The year was passed');
        this.assertEqual(POSTER_IMG, imageUrl, 'The poster location was passed');

        const { data: details } = await MovieProvider.instance.getMovie(id);
        const self = this;
        Object.keys(IDIOCRACY).forEach(key => {
            const expected = IDIOCRACY[key];
            const actual = details[key];
            if (!Array.isArray(expected)) {
                self.assertEqual(expected, actual, `The value for ${key} was ${actual}`)
            }
        }); 

    }

    async testTooManyMovies () {
        super.beginAssertions('It will properly handle too many movies to list result');
        const ERROR_TOO_MANY = 'Too many results.';
        const { data: pageOne, info: { success, error } } = await MovieProvider.instance.getMovies('i');

        this.assertEqual(0, pageOne.length, 'Too many responses - error');
        this.assertFalse(success, 'the service responded with an error flag');
        this.assertEqual(ERROR_TOO_MANY, error, 'The error message was passed');
    }

    async testBadApiKey () {
        super.beginAssertions('It will properly handle bad apiKey response');
        const ID = 'tt0387808';
        const ERROR_TOO_MANY = 'Too many results.';
        MovieProvider.instance.apiKey = 'willFail';
        try {
            const { data: details, info: { success, error } } = await MovieProvider.instance.getMovie(ID);
        } catch(e) {
            this.assertTrue(true, 'a bad api key causes a thrown error');
        }
        MovieProvider.instance.reset();
    }
}