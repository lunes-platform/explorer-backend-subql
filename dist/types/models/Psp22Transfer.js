"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Psp22Transfer = void 0;
const tslib_1 = require("tslib");
const assert_1 = tslib_1.__importDefault(require("assert"));
class Psp22Transfer {
    constructor(id, tokenId, fromId, toId, amount, blockNumber, eventIndex) {
        this.id = id;
        this.tokenId = tokenId;
        this.fromId = fromId;
        this.toId = toId;
        this.amount = amount;
        this.blockNumber = blockNumber;
        this.eventIndex = eventIndex;
    }
    get _name() {
        return 'Psp22Transfer';
    }
    async save() {
        let id = this.id;
        (0, assert_1.default)(id !== null, "Cannot save Psp22Transfer entity without an ID");
        await store.set('Psp22Transfer', id.toString(), this);
    }
    static async remove(id) {
        (0, assert_1.default)(id !== null, "Cannot remove Psp22Transfer entity without an ID");
        await store.remove('Psp22Transfer', id.toString());
    }
    static async get(id) {
        (0, assert_1.default)((id !== null && id !== undefined), "Cannot get Psp22Transfer entity without an ID");
        const record = await store.get('Psp22Transfer', id.toString());
        if (record) {
            return this.create(record);
        }
        else {
            return;
        }
    }
    static async getByTokenId(tokenId) {
        const records = await store.getByField('Psp22Transfer', 'tokenId', tokenId);
        return records.map(record => this.create(record));
    }
    static async getByFromId(fromId) {
        const records = await store.getByField('Psp22Transfer', 'fromId', fromId);
        return records.map(record => this.create(record));
    }
    static async getByToId(toId) {
        const records = await store.getByField('Psp22Transfer', 'toId', toId);
        return records.map(record => this.create(record));
    }
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter, options) {
        const records = await store.getByFields('Psp22Transfer', filter, options);
        return records.map(record => this.create(record));
    }
    static create(record) {
        (0, assert_1.default)(typeof record.id === 'string', "id must be provided");
        let entity = new this(record.id, record.tokenId, record.fromId, record.toId, record.amount, record.blockNumber, record.eventIndex);
        Object.assign(entity, record);
        return entity;
    }
}
exports.Psp22Transfer = Psp22Transfer;
