"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StakingPool = void 0;
const tslib_1 = require("tslib");
const assert_1 = tslib_1.__importDefault(require("assert"));
class StakingPool {
    constructor(id, name, totalStaked, totalRewards, apy, minStake, participantCount, createdAt, status) {
        this.id = id;
        this.name = name;
        this.totalStaked = totalStaked;
        this.totalRewards = totalRewards;
        this.apy = apy;
        this.minStake = minStake;
        this.participantCount = participantCount;
        this.createdAt = createdAt;
        this.status = status;
    }
    get _name() {
        return 'StakingPool';
    }
    async save() {
        let id = this.id;
        (0, assert_1.default)(id !== null, "Cannot save StakingPool entity without an ID");
        await store.set('StakingPool', id.toString(), this);
    }
    static async remove(id) {
        (0, assert_1.default)(id !== null, "Cannot remove StakingPool entity without an ID");
        await store.remove('StakingPool', id.toString());
    }
    static async get(id) {
        (0, assert_1.default)((id !== null && id !== undefined), "Cannot get StakingPool entity without an ID");
        const record = await store.get('StakingPool', id.toString());
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
        const records = await store.getByFields('StakingPool', filter, options);
        return records.map(record => this.create(record));
    }
    static create(record) {
        (0, assert_1.default)(typeof record.id === 'string', "id must be provided");
        let entity = new this(record.id, record.name, record.totalStaked, record.totalRewards, record.apy, record.minStake, record.participantCount, record.createdAt, record.status);
        Object.assign(entity, record);
        return entity;
    }
}
exports.StakingPool = StakingPool;
