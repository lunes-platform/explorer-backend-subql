"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractEvent = void 0;
const tslib_1 = require("tslib");
const assert_1 = tslib_1.__importDefault(require("assert"));
class ContractEvent {
    constructor(id, eventName, eventData, blockNumber, eventIndex) {
        this.id = id;
        this.eventName = eventName;
        this.eventData = eventData;
        this.blockNumber = blockNumber;
        this.eventIndex = eventIndex;
    }
    get _name() {
        return 'ContractEvent';
    }
    async save() {
        let id = this.id;
        (0, assert_1.default)(id !== null, "Cannot save ContractEvent entity without an ID");
        await store.set('ContractEvent', id.toString(), this);
    }
    static async remove(id) {
        (0, assert_1.default)(id !== null, "Cannot remove ContractEvent entity without an ID");
        await store.remove('ContractEvent', id.toString());
    }
    static async get(id) {
        (0, assert_1.default)((id !== null && id !== undefined), "Cannot get ContractEvent entity without an ID");
        const record = await store.get('ContractEvent', id.toString());
        if (record) {
            return this.create(record);
        }
        else {
            return;
        }
    }
    static async getByContractId(contractId) {
        const records = await store.getByField('ContractEvent', 'contractId', contractId);
        return records.map(record => this.create(record));
    }
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter, options) {
        const records = await store.getByFields('ContractEvent', filter, options);
        return records.map(record => this.create(record));
    }
    static create(record) {
        (0, assert_1.default)(typeof record.id === 'string', "id must be provided");
        let entity = new this(record.id, record.eventName, record.eventData, record.blockNumber, record.eventIndex);
        Object.assign(entity, record);
        return entity;
    }
}
exports.ContractEvent = ContractEvent;
