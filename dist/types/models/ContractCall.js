"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractCall = void 0;
const tslib_1 = require("tslib");
const assert_1 = tslib_1.__importDefault(require("assert"));
class ContractCall {
    constructor(id, contractId, callerId, method, success, blockNumber, extrinsicIndex) {
        this.id = id;
        this.contractId = contractId;
        this.callerId = callerId;
        this.method = method;
        this.success = success;
        this.blockNumber = blockNumber;
        this.extrinsicIndex = extrinsicIndex;
    }
    get _name() {
        return 'ContractCall';
    }
    async save() {
        let id = this.id;
        (0, assert_1.default)(id !== null, "Cannot save ContractCall entity without an ID");
        await store.set('ContractCall', id.toString(), this);
    }
    static async remove(id) {
        (0, assert_1.default)(id !== null, "Cannot remove ContractCall entity without an ID");
        await store.remove('ContractCall', id.toString());
    }
    static async get(id) {
        (0, assert_1.default)((id !== null && id !== undefined), "Cannot get ContractCall entity without an ID");
        const record = await store.get('ContractCall', id.toString());
        if (record) {
            return this.create(record);
        }
        else {
            return;
        }
    }
    static async getByContractId(contractId) {
        const records = await store.getByField('ContractCall', 'contractId', contractId);
        return records.map(record => this.create(record));
    }
    static async getByCallerId(callerId) {
        const records = await store.getByField('ContractCall', 'callerId', callerId);
        return records.map(record => this.create(record));
    }
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter, options) {
        const records = await store.getByFields('ContractCall', filter, options);
        return records.map(record => this.create(record));
    }
    static create(record) {
        (0, assert_1.default)(typeof record.id === 'string', "id must be provided");
        let entity = new this(record.id, record.contractId, record.callerId, record.method, record.success, record.blockNumber, record.extrinsicIndex);
        Object.assign(entity, record);
        return entity;
    }
}
exports.ContractCall = ContractCall;
