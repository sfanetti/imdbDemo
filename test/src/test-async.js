import { debounce } from '../../src/utils/async.js';
import Test from './Test.js';

const PARAM = 'my-param';
const RESULT = 'my-result';
const TIMEOUT = 1000;

const take = (from, count) => {
    return from.substring(0, !count ?  from.length : count);
}

export default class extends Test{
    constructor() {
        super(...arguments, 'Test Async');
        this.setTests(this, [this.testDebounce, this.testInitDebounce]);
    }

    async testDebounce() {
        super.beginAssertions('It will call a the deferred function only after a given time');
        let callCount = 0
        const callBack = function (a) {
            callCount++;
            this.assertEqual(a, PARAM, 'The debounce function was called');
            return RESULT;
        }
        const deferredFunction = debounce(this, callBack, TIMEOUT);
        deferredFunction(take(PARAM, 1));
        deferredFunction(take(PARAM, 2));
        deferredFunction(take(PARAM, 3));
        deferredFunction(take(PARAM, 4));
        deferredFunction(take(PARAM, 5));
        deferredFunction(take(PARAM, 6));
        deferredFunction(take(PARAM, 7));
        deferredFunction(take(PARAM, 8));
        deferredFunction(take(PARAM, 9));

        const result = await deferredFunction(take(PARAM));

        this.assertEqual(RESULT, result, 'The function was effectively deferred');
        this.assertEqual(callCount, 1, 'The function was called only once');

        return result;
    }

    async testInitDebounce () {
        super.beginAssertions('It will call a the deferred function once then only after a given time');
        let callCount = 0
        const callBack = function (a) {
            if (callCount === 0) {
                this.assertEqual(a, take(PARAM, 1), 'The initial debounce function was called');
            } else {
                this.assertEqual(a, PARAM, 'The deferred debounce function was called');
            }
            callCount++;
            return RESULT;
        }
        const deferredFunction = debounce(this, callBack, TIMEOUT, true);
        deferredFunction(take(PARAM, 1));
        deferredFunction(take(PARAM, 2));
        deferredFunction(take(PARAM, 3));
        deferredFunction(take(PARAM, 4));
        deferredFunction(take(PARAM, 5));
        deferredFunction(take(PARAM, 6));
        deferredFunction(take(PARAM, 7));
        deferredFunction(take(PARAM, 8));
        deferredFunction(take(PARAM, 9));

        const result = await deferredFunction(take(PARAM));

        this.assertEqual(RESULT, result, 'The function was effectively deferred');
        this.assertEqual(callCount, 2, 'The function was called twice');

        return result;
    }
}