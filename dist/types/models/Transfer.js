"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transfer = void 0;
const tslib_1 = require("tslib");
const assert_1 = tslib_1.__importDefault(require("assert"));
class Transfer {
    constructor(id, fromId, toId, amount, value, blockId, blockNumber, eventIndex) {
        this.id = id;
        this.fromId = fromId;
        this.toId = toId;
        this.amount = amount;
        this.value = value;
        this.blockId = blockId;
        this.blockNumber = blockNumber;
        this.eventIndex = eventIndex;
    }
    get _name() {
        return 'Transfer';
    }
    async save() {
        let id = this.id;
        (0, assert_1.default)(id !== null, "Cannot save Transfer entity without an ID");
        await store.set('Transfer', id.toString(), this);
    }
    static async remove(id) {
        (0, assert_1.default)(id !== null, "Cannot remove Transfer entity without an ID");
        await store.remove('Transfer', id.toString());
    }
    static async get(id) {
        (0, assert_1.default)((id !== null && id !== undefined), "Cannot get Transfer entity without an ID");
        const record = await store.get('Transfer', id.toString());
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
        const records = await store.getByFields('Transfer', filter, options);
        return records.map(record => this.create(record));
    }
    static create(record) {
        (0, assert_1.default)(typeof record.id === 'string', "id must be provided");
        let entity = new this(record.id, record.fromId, record.toId, record.amount, record.value, record.blockId, record.blockNumber, record.eventIndex);
        Object.assign(entity, record);
        return entity;
    }
}
exports.Transfer = Transfer;
