"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Psp34Transfer = void 0;
const tslib_1 = require("tslib");
const assert_1 = tslib_1.__importDefault(require("assert"));
class Psp34Transfer {
    constructor(id, collectionId, toId, blockNumber, eventIndex) {
        this.id = id;
        this.collectionId = collectionId;
        this.toId = toId;
        this.blockNumber = blockNumber;
        this.eventIndex = eventIndex;
    }
    get _name() {
        return 'Psp34Transfer';
    }
    async save() {
        let id = this.id;
        (0, assert_1.default)(id !== null, "Cannot save Psp34Transfer entity without an ID");
        await store.set('Psp34Transfer', id.toString(), this);
    }
    static async remove(id) {
        (0, assert_1.default)(id !== null, "Cannot remove Psp34Transfer entity without an ID");
        await store.remove('Psp34Transfer', id.toString());
    }
    static async get(id) {
        (0, assert_1.default)((id !== null && id !== undefined), "Cannot get Psp34Transfer entity without an ID");
        const record = await store.get('Psp34Transfer', id.toString());
        if (record) {
            return this.create(record);
        }
        else {
            return;
        }
    }
    static async getByCollectionId(collectionId) {
        const records = await store.getByField('Psp34Transfer', 'collectionId', collectionId);
        return records.map(record => this.create(record));
    }
    static async getByTokenId(tokenId) {
        const records = await store.getByField('Psp34Transfer', 'tokenId', tokenId);
        return records.map(record => this.create(record));
    }
    static async getByFromId(fromId) {
        const records = await store.getByField('Psp34Transfer', 'fromId', fromId);
        return records.map(record => this.create(record));
    }
    static async getByToId(toId) {
        const records = await store.getByField('Psp34Transfer', 'toId', toId);
        return records.map(record => this.create(record));
    }
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter, options) {
        const records = await store.getByFields('Psp34Transfer', filter, options);
        return records.map(record => this.create(record));
    }
    static create(record) {
        (0, assert_1.default)(typeof record.id === 'string', "id must be provided");
        let entity = new this(record.id, record.collectionId, record.toId, record.blockNumber, record.eventIndex);
        Object.assign(entity, record);
        return entity;
    }
}
exports.Psp34Transfer = Psp34Transfer;
