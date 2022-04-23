import { createId } from '../utils/rand.js';

/**
 * Basic store singleton
 */

const createEntry = ( type, data ) => {
    return {
        id: createId(),
        type,
        data,
        active: true
    }
}

export default class Store {
    // store items 
    static _ledger = []
    static _instance;
    static get instance() {
        if (!Store._instance) {
            Store._instance = new Store();
        }
        return Store._instance;
    }

    pushData(type, list) {
        list.forEach(entryData => {
            this.createRecord(type, entryData);
        });
    }

    createRecord(type, data) {
        const entry = createEntry(type, data);
        Store._ledger.push(entry);
        return entry
    }

    listRecordsBy(type) {
        return Store._ledger.filter(entry => entry.type === type);
    }

    getRecordById(id) {
        const entry = Store._ledger.find(entry => entry.id === id);
    }
}