"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetAccount = void 0;
const tslib_1 = require("tslib");
const assert_1 = tslib_1.__importDefault(require("assert"));
class AssetAccount {
    constructor(id, assetId, accountId, balance) {
        this.id = id;
        this.assetId = assetId;
        this.accountId = accountId;
        this.balance = balance;
    }
    get _name() {
        return 'AssetAccount';
    }
    async save() {
        let id = this.id;
        (0, assert_1.default)(id !== null, "Cannot save AssetAccount entity without an ID");
        await store.set('AssetAccount', id.toString(), this);
    }
    static async remove(id) {
        (0, assert_1.default)(id !== null, "Cannot remove AssetAccount entity without an ID");
        await store.remove('AssetAccount', id.toString());
    }
    static async get(id) {
        (0, assert_1.default)((id !== null && id !== undefined), "Cannot get AssetAccount entity without an ID");
        const record = await store.get('AssetAccount', id.toString());
        if (record) {
            return this.create(record);
        }
        else {
            return;
        }
    }
    static async getByAssetId(assetId) {
        const records = await store.getByField('AssetAccount', 'assetId', assetId);
        return records.map(record => this.create(record));
    }
    static async getByAccountId(accountId) {
        const records = await store.getByField('AssetAccount', 'accountId', accountId);
        return records.map(record => this.create(record));
    }
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter, options) {
        const records = await store.getByFields('AssetAccount', filter, options);
        return records.map(record => this.create(record));
    }
    static create(record) {
        (0, assert_1.default)(typeof record.id === 'string', "id must be provided");
        let entity = new this(record.id, record.assetId, record.accountId, record.balance);
        Object.assign(entity, record);
        return entity;
    }
}
exports.AssetAccount = AssetAccount;
