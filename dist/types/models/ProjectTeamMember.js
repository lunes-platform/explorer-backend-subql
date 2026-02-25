"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectTeamMember = void 0;
const tslib_1 = require("tslib");
const assert_1 = tslib_1.__importDefault(require("assert"));
class ProjectTeamMember {
    constructor(id, projectId, name, role) {
        this.id = id;
        this.projectId = projectId;
        this.name = name;
        this.role = role;
    }
    get _name() {
        return 'ProjectTeamMember';
    }
    async save() {
        let id = this.id;
        (0, assert_1.default)(id !== null, "Cannot save ProjectTeamMember entity without an ID");
        await store.set('ProjectTeamMember', id.toString(), this);
    }
    static async remove(id) {
        (0, assert_1.default)(id !== null, "Cannot remove ProjectTeamMember entity without an ID");
        await store.remove('ProjectTeamMember', id.toString());
    }
    static async get(id) {
        (0, assert_1.default)((id !== null && id !== undefined), "Cannot get ProjectTeamMember entity without an ID");
        const record = await store.get('ProjectTeamMember', id.toString());
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
        const records = await store.getByFields('ProjectTeamMember', filter, options);
        return records.map(record => this.create(record));
    }
    static create(record) {
        (0, assert_1.default)(typeof record.id === 'string', "id must be provided");
        let entity = new this(record.id, record.projectId, record.name, record.role);
        Object.assign(entity, record);
        return entity;
    }
}
exports.ProjectTeamMember = ProjectTeamMember;
