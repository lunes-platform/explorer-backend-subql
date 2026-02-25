"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NftAccount = void 0;
const tslib_1 = require("tslib");
const assert_1 = tslib_1.__importDefault(require("assert"));
class NftAccount {
    constructor(id, collectionId, accountId, tokenCount) {
        this.id = id;
        this.collectionId = collectionId;
        this.accountId = accountId;
        this.tokenCount = tokenCount;
    }
    get _name() {
        return 'NftAccount';
    }
    async save() {
        let id = this.id;
        (0, assert_1.default)(id !== null, "Cannot save NftAccount entity without an ID");
        await store.set('NftAccount', id.toString(), this);
    }
    static async remove(id) {
        (0, assert_1.default)(id !== null, "Cannot remove NftAccount entity without an ID");
        await store.remove('NftAccount', id.toString());
    }
    static async get(id) {
        (0, assert_1.default)((id !== null && id !== undefined), "Cannot get NftAccount entity without an ID");
        const record = await store.get('NftAccount', id.toString());
        if (record) {
            return this.create(record);
        }
        else {
            return;
        }
    }
    static async getByCollectionId(collectionId) {
        const records = await store.getByField('NftAccount', 'collectionId', collectionId);
        return records.map(record => this.create(record));
    }
    static async getByAccountId(accountId) {
        const records = await store.getByField('NftAccount', 'accountId', accountId);
        return records.map(record => this.create(record));
    }
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter, options) {
        const records = await store.getByFields('NftAccount', filter, options);
        return records.map(record => this.create(record));
    }
    static create(record) {
        (0, assert_1.default)(typeof record.id === 'string', "id must be provided");
        let entity = new this(record.id, record.collectionId, record.accountId, record.tokenCount);
        Object.assign(entity, record);
        return entity;
    }
}
exports.NftAccount = NftAccount;
