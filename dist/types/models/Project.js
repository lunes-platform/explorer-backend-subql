"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Project = void 0;
const tslib_1 = require("tslib");
const assert_1 = tslib_1.__importDefault(require("assert"));
class Project {
    constructor(id, name, category, createdAt, verified, createdBy) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.createdAt = createdAt;
        this.verified = verified;
        this.createdBy = createdBy;
    }
    get _name() {
        return 'Project';
    }
    async save() {
        let id = this.id;
        (0, assert_1.default)(id !== null, "Cannot save Project entity without an ID");
        await store.set('Project', id.toString(), this);
    }
    static async remove(id) {
        (0, assert_1.default)(id !== null, "Cannot remove Project entity without an ID");
        await store.remove('Project', id.toString());
    }
    static async get(id) {
        (0, assert_1.default)((id !== null && id !== undefined), "Cannot get Project entity without an ID");
        const record = await store.get('Project', id.toString());
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
        const records = await store.getByFields('Project', filter, options);
        return records.map(record => this.create(record));
    }
    static create(record) {
        (0, assert_1.default)(typeof record.id === 'string', "id must be provided");
        let entity = new this(record.id, record.name, record.category, record.createdAt, record.verified, record.createdBy);
        Object.assign(entity, record);
        return entity;
    }
}
exports.Project = Project;
