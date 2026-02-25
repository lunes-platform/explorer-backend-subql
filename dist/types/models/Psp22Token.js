"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Psp22Token = void 0;
const tslib_1 = require("tslib");
const assert_1 = tslib_1.__importDefault(require("assert"));
class Psp22Token {
    constructor(id, contractAddress, standard) {
        this.id = id;
        this.contractAddress = contractAddress;
        this.standard = standard;
    }
    get _name() {
        return 'Psp22Token';
    }
    async save() {
        let id = this.id;
        (0, assert_1.default)(id !== null, "Cannot save Psp22Token entity without an ID");
        await store.set('Psp22Token', id.toString(), this);
    }
    static async remove(id) {
        (0, assert_1.default)(id !== null, "Cannot remove Psp22Token entity without an ID");
        await store.remove('Psp22Token', id.toString());
    }
    static async get(id) {
        (0, assert_1.default)((id !== null && id !== undefined), "Cannot get Psp22Token entity without an ID");
        const record = await store.get('Psp22Token', id.toString());
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
        const records = await store.getByFields('Psp22Token', filter, options);
        return records.map(record => this.create(record));
    }
    static create(record) {
        (0, assert_1.default)(typeof record.id === 'string', "id must be provided");
        let entity = new this(record.id, record.contractAddress, record.standard);
        Object.assign(entity, record);
        return entity;
    }
}
exports.Psp22Token = Psp22Token;
