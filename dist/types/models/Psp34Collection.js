"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Psp34Collection = void 0;
const tslib_1 = require("tslib");
const assert_1 = tslib_1.__importDefault(require("assert"));
class Psp34Collection {
    constructor(id, contractAddress, standard) {
        this.id = id;
        this.contractAddress = contractAddress;
        this.standard = standard;
    }
    get _name() {
        return 'Psp34Collection';
    }
    async save() {
        let id = this.id;
        (0, assert_1.default)(id !== null, "Cannot save Psp34Collection entity without an ID");
        await store.set('Psp34Collection', id.toString(), this);
    }
    static async remove(id) {
        (0, assert_1.default)(id !== null, "Cannot remove Psp34Collection entity without an ID");
        await store.remove('Psp34Collection', id.toString());
    }
    static async get(id) {
        (0, assert_1.default)((id !== null && id !== undefined), "Cannot get Psp34Collection entity without an ID");
        const record = await store.get('Psp34Collection', id.toString());
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
        const records = await store.getByFields('Psp34Collection', filter, options);
        return records.map(record => this.create(record));
    }
    static create(record) {
        (0, assert_1.default)(typeof record.id === 'string', "id must be provided");
        let entity = new this(record.id, record.contractAddress, record.standard);
        Object.assign(entity, record);
        return entity;
    }
}
exports.Psp34Collection = Psp34Collection;
