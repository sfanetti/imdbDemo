import testTemplate from './test-template.html'


/**
 * Dirt simple test base class that contains some rudimentary assertion handlers
 * and logging to output the results.
 */
export default class Test {
    _testRoot;
    _currentTestNode;
    _testList;

    /**
     * @param {htmlNode} element The parent element
     * @param {string} testName The name of this set of tests 
     */
    constructor(element, testName) {
        if (element && testName) {
            this._testRoot = element;
            this._testRoot.append(
                this.createNode(`
                <div class="test-title">
                    <h2>${testName}</h2>
                </div>`));
        }
    }

    /**
     * Creates a title and assertions container to house the
     * set of assertions used in the test
     * @param {string} assertionTitle The title for a set of assertions
     * @returns 
     */
    beginAssertions(assertionTitle) {
        let done, deferred;
        deferred = new Promise((res) => {
            done = res;
        });
        const assertionContainer = `
        <div class="assertion-set">
            <h4>${assertionTitle}</h4>
            <div class="assertions"></div>
        </div>`;
        const assertionNodes = this.createNode(assertionContainer);
        this._currentTestNode = assertionNodes.lastElementChild;
        this._testRoot.append(assertionNodes);
        return { deferred, done };
    }

    /**
     * This should be self explanatory :)
     * @param {*} actual actual result
     * @param {*} expect expected result
     * @param {*} msg message to identify the assertion
     */
    assertEqual(actual, expect, msg) {
        this.createLog(this._currentTestNode, expect === actual, msg);
    }

    /**
     * Boolean true assertion
     * @param {boolean} expect 
     * @param {*} msg message to identify the assertion
     */
    assertTrue(expect, msg) {
        this.assertEqual(true, expect, msg);
    }

    /**
     * Boolean false assertion
     * @param {*} expect 
     * @param {*} msg message to identify the assertion
     */
    assertFalse(expect, msg) {
        this.assertEqual(false, expect, msg);
    }

    /**
     * Runs the tests set in the set tests method
     */
    async run() {
        const testList = this._testList ? this._testList.concat() : [];
        for (let i = 0; i < testList.length; i++) {
            const testFunc = testList[i];
            await testFunc();
        }
    }


    /**
     * Sets tests and binds them to the passed in execution context
     * @param {*} context 
     * @param {Array} testList 
     */
    setTests(context, testList) {
        this._testList = testList.map(t => t.bind(context));
    }

    /**
     * Adds the assertion result to the parent node for the assertion set
     * @param {htmlNode} parentNode 
     * @param {boolean} pass if true the assertion was confirmed 
     * @param {string} msg message to identify the assertion
     */
    createLog(parentNode, pass, msg) {
        if (parentNode) {
            parentNode.append(
                this.createNode(`
                <div class="test-${pass ? 'pass' : 'fail'}">
                    ${msg}
                </div>`));
        }
    }

    /**
     * Coinvenience method to wrap a given template in a node
     * @param {string} fromString 
     * @returns 
     */
    createNode(fromString, elementType = 'div') {
        const placeholder = document.createElement(elementType);
        placeholder.innerHTML = fromString;
        return placeholder.firstElementChild;
    }
}