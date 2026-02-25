"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Psp22Account = void 0;
const tslib_1 = require("tslib");
const assert_1 = tslib_1.__importDefault(require("assert"));
class Psp22Account {
    constructor(id, tokenId, accountId, balance) {
        this.id = id;
        this.tokenId = tokenId;
        this.accountId = accountId;
        this.balance = balance;
    }
    get _name() {
        return 'Psp22Account';
    }
    async save() {
        let id = this.id;
        (0, assert_1.default)(id !== null, "Cannot save Psp22Account entity without an ID");
        await store.set('Psp22Account', id.toString(), this);
    }
    static async remove(id) {
        (0, assert_1.default)(id !== null, "Cannot remove Psp22Account entity without an ID");
        await store.remove('Psp22Account', id.toString());
    }
    static async get(id) {
        (0, assert_1.default)((id !== null && id !== undefined), "Cannot get Psp22Account entity without an ID");
        const record = await store.get('Psp22Account', id.toString());
        if (record) {
            return this.create(record);
        }
        else {
            return;
        }
    }
    static async getByTokenId(tokenId) {
        const records = await store.getByField('Psp22Account', 'tokenId', tokenId);
        return records.map(record => this.create(record));
    }
    static async getByAccountId(accountId) {
        const records = await store.getByField('Psp22Account', 'accountId', accountId);
        return records.map(record => this.create(record));
    }
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter, options) {
        const records = await store.getByFields('Psp22Account', filter, options);
        return records.map(record => this.create(record));
    }
    static create(record) {
        (0, assert_1.default)(typeof record.id === 'string', "id must be provided");
        let entity = new this(record.id, record.tokenId, record.accountId, record.balance);
        Object.assign(entity, record);
        return entity;
    }
}
exports.Psp22Account = Psp22Account;
