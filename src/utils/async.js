/**
 * Simple debouncer for hitting the api on type
 * @param {self} context sets the execution context for the callback
 * @param {function} callback The function that will be debounced
 * @param {number} timeOut the time in which subsequent calls witll reset the internal timer
 * @param {boolean} init if true the callback will be executed immediately then function as a debounce for future calls
 * @returns {Object} the debounced function 
 */
 export function debounce(context, callback, timeOut = 500, init = false ) {
    let timeoutId, initCalled, resolve, reject;
    const getNewDeferred = (...args) => {
        return setTimeout(() => {
            clearTimeout(timeoutId);
            resolve(callback.call(context, ...args));
        }, timeOut);
    }
    return (...args) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = getNewDeferred(...args);
        return new Promise((res, rej) => {
            resolve = res;
            reject = rej;

            if (init && !initCalled) {
                initCalled = true;
                resolve(callback.call(context, ...args));
            }
        });
    }
}

/**
 * Simple wait function that holds context to wait on renders to complete
 * @param {number} timeout 
 * @returns 
 */
export function wait(timeout) {
    let done;
    const deferred = new Promise((res) => {
        done = res;
    });
    const timeoutId = setTimeout(() => {
        done();
    }, timeout);
    return deferred;
}