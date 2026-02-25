"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Block = void 0;
const tslib_1 = require("tslib");
const assert_1 = tslib_1.__importDefault(require("assert"));
class Block {
    constructor(id, number, hash, parentHash) {
        this.id = id;
        this.number = number;
        this.hash = hash;
        this.parentHash = parentHash;
    }
    get _name() {
        return 'Block';
    }
    async save() {
        let id = this.id;
        (0, assert_1.default)(id !== null, "Cannot save Block entity without an ID");
        await store.set('Block', id.toString(), this);
    }
    static async remove(id) {
        (0, assert_1.default)(id !== null, "Cannot remove Block entity without an ID");
        await store.remove('Block', id.toString());
    }
    static async get(id) {
        (0, assert_1.default)((id !== null && id !== undefined), "Cannot get Block entity without an ID");
        const record = await store.get('Block', id.toString());
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
        const records = await store.getByFields('Block', filter, options);
        return records.map(record => this.create(record));
    }
    static create(record) {
        (0, assert_1.default)(typeof record.id === 'string', "id must be provided");
        let entity = new this(record.id, record.number, record.hash, record.parentHash);
        Object.assign(entity, record);
        return entity;
    }
}
exports.Block = Block;
