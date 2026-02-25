"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Event = void 0;
const tslib_1 = require("tslib");
const assert_1 = tslib_1.__importDefault(require("assert"));
class Event {
    constructor(id, blockNumber, eventIndex, section, method, data) {
        this.id = id;
        this.blockNumber = blockNumber;
        this.eventIndex = eventIndex;
        this.section = section;
        this.method = method;
        this.data = data;
    }
    get _name() {
        return 'Event';
    }
    async save() {
        let id = this.id;
        (0, assert_1.default)(id !== null, "Cannot save Event entity without an ID");
        await store.set('Event', id.toString(), this);
    }
    static async remove(id) {
        (0, assert_1.default)(id !== null, "Cannot remove Event entity without an ID");
        await store.remove('Event', id.toString());
    }
    static async get(id) {
        (0, assert_1.default)((id !== null && id !== undefined), "Cannot get Event entity without an ID");
        const record = await store.get('Event', id.toString());
        if (record) {
            return this.create(record);
        }
        else {
            return;
        }
    }
    static async getByContractId(contractId) {
        const records = await store.getByField('Event', 'contractId', contractId);
        return records.map(record => this.create(record));
    }
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter, options) {
        const records = await store.getByFields('Event', filter, options);
        return records.map(record => this.create(record));
    }
    static create(record) {
        (0, assert_1.default)(typeof record.id === 'string', "id must be provided");
        let entity = new this(record.id, record.blockNumber, record.eventIndex, record.section, record.method, record.data);
        Object.assign(entity, record);
        return entity;
    }
}
exports.Event = Event;
