"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Psp37Account = void 0;
const tslib_1 = require("tslib");
const assert_1 = tslib_1.__importDefault(require("assert"));
class Psp37Account {
    constructor(id, contractId, tokenId, accountId, balance) {
        this.id = id;
        this.contractId = contractId;
        this.tokenId = tokenId;
        this.accountId = accountId;
        this.balance = balance;
    }
    get _name() {
        return 'Psp37Account';
    }
    async save() {
        let id = this.id;
        (0, assert_1.default)(id !== null, "Cannot save Psp37Account entity without an ID");
        await store.set('Psp37Account', id.toString(), this);
    }
    static async remove(id) {
        (0, assert_1.default)(id !== null, "Cannot remove Psp37Account entity without an ID");
        await store.remove('Psp37Account', id.toString());
    }
    static async get(id) {
        (0, assert_1.default)((id !== null && id !== undefined), "Cannot get Psp37Account entity without an ID");
        const record = await store.get('Psp37Account', id.toString());
        if (record) {
            return this.create(record);
        }
        else {
            return;
        }
    }
    static async getByContractId(contractId) {
        const records = await store.getByField('Psp37Account', 'contractId', contractId);
        return records.map(record => this.create(record));
    }
    static async getByTokenId(tokenId) {
        const records = await store.getByField('Psp37Account', 'tokenId', tokenId);
        return records.map(record => this.create(record));
    }
    static async getByAccountId(accountId) {
        const records = await store.getByField('Psp37Account', 'accountId', accountId);
        return records.map(record => this.create(record));
    }
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter, options) {
        const records = await store.getByFields('Psp37Account', filter, options);
        return records.map(record => this.create(record));
    }
    static create(record) {
        (0, assert_1.default)(typeof record.id === 'string', "id must be provided");
        let entity = new this(record.id, record.contractId, record.tokenId, record.accountId, record.balance);
        Object.assign(entity, record);
        return entity;
    }
}
exports.Psp37Account = Psp37Account;
