"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetTransfer = void 0;
const tslib_1 = require("tslib");
const assert_1 = tslib_1.__importDefault(require("assert"));
class AssetTransfer {
    constructor(id, assetId, fromId, toId, amount, blockNumber, eventIndex) {
        this.id = id;
        this.assetId = assetId;
        this.fromId = fromId;
        this.toId = toId;
        this.amount = amount;
        this.blockNumber = blockNumber;
        this.eventIndex = eventIndex;
    }
    get _name() {
        return 'AssetTransfer';
    }
    async save() {
        let id = this.id;
        (0, assert_1.default)(id !== null, "Cannot save AssetTransfer entity without an ID");
        await store.set('AssetTransfer', id.toString(), this);
    }
    static async remove(id) {
        (0, assert_1.default)(id !== null, "Cannot remove AssetTransfer entity without an ID");
        await store.remove('AssetTransfer', id.toString());
    }
    static async get(id) {
        (0, assert_1.default)((id !== null && id !== undefined), "Cannot get AssetTransfer entity without an ID");
        const record = await store.get('AssetTransfer', id.toString());
        if (record) {
            return this.create(record);
        }
        else {
            return;
        }
    }
    static async getByAssetId(assetId) {
        const records = await store.getByField('AssetTransfer', 'assetId', assetId);
        return records.map(record => this.create(record));
    }
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter, options) {
        const records = await store.getByFields('AssetTransfer', filter, options);
        return records.map(record => this.create(record));
    }
    static create(record) {
        (0, assert_1.default)(typeof record.id === 'string', "id must be provided");
        let entity = new this(record.id, record.assetId, record.fromId, record.toId, record.amount, record.blockNumber, record.eventIndex);
        Object.assign(entity, record);
        return entity;
    }
}
exports.AssetTransfer = AssetTransfer;
