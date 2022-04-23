import TestAsync from './src/test-async.js';
import TestMovieProvider from './src/test-movie-provider.js';
import TestSearchComponent from './src/test-search-component.js';

class Runner {
    constructor(rootSelector, tests) {
        this.init(rootSelector, tests);
    }

    async init(rootSelector, tests) {
        const root = document.querySelector(rootSelector);
        if (root) {
            for (let i = 0; i < tests.length; i++) {
                const runContainer = document.createElement('p');
                const Test = tests[i];
                const testInstance = new Test(runContainer);
                root.append(runContainer);
                await testInstance.run();
            }
        }
    }
}

const tests = [
    TestAsync,
    TestMovieProvider,
    TestSearchComponent
];

document.onreadystatechange = function () {
    if (document.readyState === 'complete') {
        const runner = new Runner('body', tests);
    }
}

