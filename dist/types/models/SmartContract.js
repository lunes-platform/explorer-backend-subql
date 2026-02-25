"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmartContract = void 0;
const tslib_1 = require("tslib");
const assert_1 = tslib_1.__importDefault(require("assert"));
class SmartContract {
    constructor(id, contractAddress, deployedAt, deployedAtBlock, isVerified, callCount) {
        this.id = id;
        this.contractAddress = contractAddress;
        this.deployedAt = deployedAt;
        this.deployedAtBlock = deployedAtBlock;
        this.isVerified = isVerified;
        this.callCount = callCount;
    }
    get _name() {
        return 'SmartContract';
    }
    async save() {
        let id = this.id;
        (0, assert_1.default)(id !== null, "Cannot save SmartContract entity without an ID");
        await store.set('SmartContract', id.toString(), this);
    }
    static async remove(id) {
        (0, assert_1.default)(id !== null, "Cannot remove SmartContract entity without an ID");
        await store.remove('SmartContract', id.toString());
    }
    static async get(id) {
        (0, assert_1.default)((id !== null && id !== undefined), "Cannot get SmartContract entity without an ID");
        const record = await store.get('SmartContract', id.toString());
        if (record) {
            return this.create(record);
        }
        else {
            return;
        }
    }
    static async getByDeployerId(deployerId) {
        const records = await store.getByField('SmartContract', 'deployerId', deployerId);
        return records.map(record => this.create(record));
    }
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter, options) {
        const records = await store.getByFields('SmartContract', filter, options);
        return records.map(record => this.create(record));
    }
    static create(record) {
        (0, assert_1.default)(typeof record.id === 'string', "id must be provided");
        let entity = new this(record.id, record.contractAddress, record.deployedAt, record.deployedAtBlock, record.isVerified, record.callCount);
        Object.assign(entity, record);
        return entity;
    }
}
exports.SmartContract = SmartContract;
