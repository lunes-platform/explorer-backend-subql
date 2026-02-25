"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Psp34Token = void 0;
const tslib_1 = require("tslib");
const assert_1 = tslib_1.__importDefault(require("assert"));
class Psp34Token {
    constructor(id, collectionId, tokenId) {
        this.id = id;
        this.collectionId = collectionId;
        this.tokenId = tokenId;
    }
    get _name() {
        return 'Psp34Token';
    }
    async save() {
        let id = this.id;
        (0, assert_1.default)(id !== null, "Cannot save Psp34Token entity without an ID");
        await store.set('Psp34Token', id.toString(), this);
    }
    static async remove(id) {
        (0, assert_1.default)(id !== null, "Cannot remove Psp34Token entity without an ID");
        await store.remove('Psp34Token', id.toString());
    }
    static async get(id) {
        (0, assert_1.default)((id !== null && id !== undefined), "Cannot get Psp34Token entity without an ID");
        const record = await store.get('Psp34Token', id.toString());
        if (record) {
            return this.create(record);
        }
        else {
            return;
        }
    }
    static async getByCollectionId(collectionId) {
        const records = await store.getByField('Psp34Token', 'collectionId', collectionId);
        return records.map(record => this.create(record));
    }
    static async getByOwnerId(ownerId) {
        const records = await store.getByField('Psp34Token', 'ownerId', ownerId);
        return records.map(record => this.create(record));
    }
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter, options) {
        const records = await store.getByFields('Psp34Token', filter, options);
        return records.map(record => this.create(record));
    }
    static create(record) {
        (0, assert_1.default)(typeof record.id === 'string', "id must be provided");
        let entity = new this(record.id, record.collectionId, record.tokenId);
        Object.assign(entity, record);
        return entity;
    }
}
exports.Psp34Token = Psp34Token;
