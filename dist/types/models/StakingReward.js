"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StakingReward = void 0;
const tslib_1 = require("tslib");
const assert_1 = tslib_1.__importDefault(require("assert"));
class StakingReward {
    constructor(id, accountId, amount, blockNumber, timestamp, type) {
        this.id = id;
        this.accountId = accountId;
        this.amount = amount;
        this.blockNumber = blockNumber;
        this.timestamp = timestamp;
        this.type = type;
    }
    get _name() {
        return 'StakingReward';
    }
    async save() {
        let id = this.id;
        (0, assert_1.default)(id !== null, "Cannot save StakingReward entity without an ID");
        await store.set('StakingReward', id.toString(), this);
    }
    static async remove(id) {
        (0, assert_1.default)(id !== null, "Cannot remove StakingReward entity without an ID");
        await store.remove('StakingReward', id.toString());
    }
    static async get(id) {
        (0, assert_1.default)((id !== null && id !== undefined), "Cannot get StakingReward entity without an ID");
        const record = await store.get('StakingReward', id.toString());
        if (record) {
            return this.create(record);
        }
        else {
            return;
        }
    }
    static async getByAccountId(accountId) {
        const records = await store.getByField('StakingReward', 'accountId', accountId);
        return records.map(record => this.create(record));
    }
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter, options) {
        const records = await store.getByFields('StakingReward', filter, options);
        return records.map(record => this.create(record));
    }
    static create(record) {
        (0, assert_1.default)(typeof record.id === 'string', "id must be provided");
        let entity = new this(record.id, record.accountId, record.amount, record.blockNumber, record.timestamp, record.type);
        Object.assign(entity, record);
        return entity;
    }
}
exports.StakingReward = StakingReward;
