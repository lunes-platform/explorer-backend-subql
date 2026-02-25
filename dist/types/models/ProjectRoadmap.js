"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectRoadmap = void 0;
const tslib_1 = require("tslib");
const assert_1 = tslib_1.__importDefault(require("assert"));
class ProjectRoadmap {
    constructor(id, projectId, quarter, title, status) {
        this.id = id;
        this.projectId = projectId;
        this.quarter = quarter;
        this.title = title;
        this.status = status;
    }
    get _name() {
        return 'ProjectRoadmap';
    }
    async save() {
        let id = this.id;
        (0, assert_1.default)(id !== null, "Cannot save ProjectRoadmap entity without an ID");
        await store.set('ProjectRoadmap', id.toString(), this);
    }
    static async remove(id) {
        (0, assert_1.default)(id !== null, "Cannot remove ProjectRoadmap entity without an ID");
        await store.remove('ProjectRoadmap', id.toString());
    }
    static async get(id) {
        (0, assert_1.default)((id !== null && id !== undefined), "Cannot get ProjectRoadmap entity without an ID");
        const record = await store.get('ProjectRoadmap', id.toString());
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
        const records = await store.getByFields('ProjectRoadmap', filter, options);
        return records.map(record => this.create(record));
    }
    static create(record) {
        (0, assert_1.default)(typeof record.id === 'string', "id must be provided");
        let entity = new this(record.id, record.projectId, record.quarter, record.title, record.status);
        Object.assign(entity, record);
        return entity;
    }
}
exports.ProjectRoadmap = ProjectRoadmap;
