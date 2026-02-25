"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StakingPosition = void 0;
const tslib_1 = require("tslib");
const assert_1 = tslib_1.__importDefault(require("assert"));
class StakingPosition {
    constructor(id, accountId, stakedAmount, rewards, stakedAt, status) {
        this.id = id;
        this.accountId = accountId;
        this.stakedAmount = stakedAmount;
        this.rewards = rewards;
        this.stakedAt = stakedAt;
        this.status = status;
    }
    get _name() {
        return 'StakingPosition';
    }
    async save() {
        let id = this.id;
        (0, assert_1.default)(id !== null, "Cannot save StakingPosition entity without an ID");
        await store.set('StakingPosition', id.toString(), this);
    }
    static async remove(id) {
        (0, assert_1.default)(id !== null, "Cannot remove StakingPosition entity without an ID");
        await store.remove('StakingPosition', id.toString());
    }
    static async get(id) {
        (0, assert_1.default)((id !== null && id !== undefined), "Cannot get StakingPosition entity without an ID");
        const record = await store.get('StakingPosition', id.toString());
        if (record) {
            return this.create(record);
        }
        else {
            return;
        }
    }
    static async getByAccountId(accountId) {
        const records = await store.getByField('StakingPosition', 'accountId', accountId);
        return records.map(record => this.create(record));
    }
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter, options) {
        const records = await store.getByFields('StakingPosition', filter, options);
        return records.map(record => this.create(record));
    }
    static create(record) {
        (0, assert_1.default)(typeof record.id === 'string', "id must be provided");
        let entity = new this(record.id, record.accountId, record.stakedAmount, record.rewards, record.stakedAt, record.status);
        Object.assign(entity, record);
        return entity;
    }
}
exports.StakingPosition = StakingPosition;
