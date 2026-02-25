"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Asset = void 0;
const tslib_1 = require("tslib");
const assert_1 = tslib_1.__importDefault(require("assert"));
class Asset {
    constructor(id, assetType) {
        this.id = id;
        this.assetType = assetType;
    }
    get _name() {
        return 'Asset';
    }
    async save() {
        let id = this.id;
        (0, assert_1.default)(id !== null, "Cannot save Asset entity without an ID");
        await store.set('Asset', id.toString(), this);
    }
    static async remove(id) {
        (0, assert_1.default)(id !== null, "Cannot remove Asset entity without an ID");
        await store.remove('Asset', id.toString());
    }
    static async get(id) {
        (0, assert_1.default)((id !== null && id !== undefined), "Cannot get Asset entity without an ID");
        const record = await store.get('Asset', id.toString());
        if (record) {
            return this.create(record);
        }
        else {
            return;
        }
    }
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter, options) {
        const records = await store.getByFields('Asset', filter, options);
        return records.map(record => this.create(record));
    }
    static create(record) {
        (0, assert_1.default)(typeof record.id === 'string', "id must be provided");
        let entity = new this(record.id, record.assetType);
        Object.assign(entity, record);
        return entity;
    }
}
exports.Asset = Asset;
