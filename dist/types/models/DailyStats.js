"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyStats = void 0;
const tslib_1 = require("tslib");
const assert_1 = tslib_1.__importDefault(require("assert"));
class DailyStats {
    constructor(id, date, transfersCount, totalVolume, uniqueAccounts, contractCalls, psp22Transfers, psp34Transfers, psp37Transfers, newContracts) {
        this.id = id;
        this.date = date;
        this.transfersCount = transfersCount;
        this.totalVolume = totalVolume;
        this.uniqueAccounts = uniqueAccounts;
        this.contractCalls = contractCalls;
        this.psp22Transfers = psp22Transfers;
        this.psp34Transfers = psp34Transfers;
        this.psp37Transfers = psp37Transfers;
        this.newContracts = newContracts;
    }
    get _name() {
        return 'DailyStats';
    }
    async save() {
        let id = this.id;
        (0, assert_1.default)(id !== null, "Cannot save DailyStats entity without an ID");
        await store.set('DailyStats', id.toString(), this);
    }
    static async remove(id) {
        (0, assert_1.default)(id !== null, "Cannot remove DailyStats entity without an ID");
        await store.remove('DailyStats', id.toString());
    }
    static async get(id) {
        (0, assert_1.default)((id !== null && id !== undefined), "Cannot get DailyStats entity without an ID");
        const record = await store.get('DailyStats', id.toString());
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
        const records = await store.getByFields('DailyStats', filter, options);
        return records.map(record => this.create(record));
    }
    static create(record) {
        (0, assert_1.default)(typeof record.id === 'string', "id must be provided");
        let entity = new this(record.id, record.date, record.transfersCount, record.totalVolume, record.uniqueAccounts, record.contractCalls, record.psp22Transfers, record.psp34Transfers, record.psp37Transfers, record.newContracts);
        Object.assign(entity, record);
        return entity;
    }
}
exports.DailyStats = DailyStats;
