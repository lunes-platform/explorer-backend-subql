"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Extrinsic = void 0;
const tslib_1 = require("tslib");
const assert_1 = tslib_1.__importDefault(require("assert"));
class Extrinsic {
    constructor(id, blockNumber, extrinsicIndex, isSigned, method, section, success) {
        this.id = id;
        this.blockNumber = blockNumber;
        this.extrinsicIndex = extrinsicIndex;
        this.isSigned = isSigned;
        this.method = method;
        this.section = section;
        this.success = success;
    }
    get _name() {
        return 'Extrinsic';
    }
    async save() {
        let id = this.id;
        (0, assert_1.default)(id !== null, "Cannot save Extrinsic entity without an ID");
        await store.set('Extrinsic', id.toString(), this);
    }
    static async remove(id) {
        (0, assert_1.default)(id !== null, "Cannot remove Extrinsic entity without an ID");
        await store.remove('Extrinsic', id.toString());
    }
    static async get(id) {
        (0, assert_1.default)((id !== null && id !== undefined), "Cannot get Extrinsic entity without an ID");
        const record = await store.get('Extrinsic', id.toString());
        if (record) {
            return this.create(record);
        }
        else {
            return;
        }
    }
    static async getByContractId(contractId) {
        const records = await store.getByField('Extrinsic', 'contractId', contractId);
        return records.map(record => this.create(record));
    }
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter, options) {
        const records = await store.getByFields('Extrinsic', filter, options);
        return records.map(record => this.create(record));
    }
    static create(record) {
        (0, assert_1.default)(typeof record.id === 'string', "id must be provided");
        let entity = new this(record.id, record.blockNumber, record.extrinsicIndex, record.isSigned, record.method, record.section, record.success);
        Object.assign(entity, record);
        return entity;
    }
}
exports.Extrinsic = Extrinsic;
