"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Psp22Allowance = void 0;
const tslib_1 = require("tslib");
const assert_1 = tslib_1.__importDefault(require("assert"));
class Psp22Allowance {
    constructor(id, tokenId, ownerId, spender, amount, blockNumber) {
        this.id = id;
        this.tokenId = tokenId;
        this.ownerId = ownerId;
        this.spender = spender;
        this.amount = amount;
        this.blockNumber = blockNumber;
    }
    get _name() {
        return 'Psp22Allowance';
    }
    async save() {
        let id = this.id;
        (0, assert_1.default)(id !== null, "Cannot save Psp22Allowance entity without an ID");
        await store.set('Psp22Allowance', id.toString(), this);
    }
    static async remove(id) {
        (0, assert_1.default)(id !== null, "Cannot remove Psp22Allowance entity without an ID");
        await store.remove('Psp22Allowance', id.toString());
    }
    static async get(id) {
        (0, assert_1.default)((id !== null && id !== undefined), "Cannot get Psp22Allowance entity without an ID");
        const record = await store.get('Psp22Allowance', id.toString());
        if (record) {
            return this.create(record);
        }
        else {
            return;
        }
    }
    static async getByTokenId(tokenId) {
        const records = await store.getByField('Psp22Allowance', 'tokenId', tokenId);
        return records.map(record => this.create(record));
    }
    static async getByOwnerId(ownerId) {
        const records = await store.getByField('Psp22Allowance', 'ownerId', ownerId);
        return records.map(record => this.create(record));
    }
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter, options) {
        const records = await store.getByFields('Psp22Allowance', filter, options);
        return records.map(record => this.create(record));
    }
    static create(record) {
        (0, assert_1.default)(typeof record.id === 'string', "id must be provided");
        let entity = new this(record.id, record.tokenId, record.ownerId, record.spender, record.amount, record.blockNumber);
        Object.assign(entity, record);
        return entity;
    }
}
exports.Psp22Allowance = Psp22Allowance;
