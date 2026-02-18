// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';



export type ProjectTeamMemberProps = Omit<ProjectTeamMember, NonNullable<FunctionPropertyNames<ProjectTeamMember>>| '_name'>;

export class ProjectTeamMember implements Entity {

    constructor(
        
        id: string,
        projectId: string,
        name: string,
        role: string,
    ) {
        this.id = id;
        this.projectId = projectId;
        this.name = name;
        this.role = role;
        
    }

    public id: string;
    public projectId: string;
    public name: string;
    public role: string;
    public linkedin?: string;
    public twitter?: string;
    public avatarUrl?: string;
    

    get _name(): string {
        return 'ProjectTeamMember';
    }

    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save ProjectTeamMember entity without an ID");
        await store.set('ProjectTeamMember', id.toString(), this);
    }

    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove ProjectTeamMember entity without an ID");
        await store.remove('ProjectTeamMember', id.toString());
    }

    static async get(id:string): Promise<ProjectTeamMember | undefined>{
        assert((id !== null && id !== undefined), "Cannot get ProjectTeamMember entity without an ID");
        const record = await store.get('ProjectTeamMember', id.toString());
        if (record) {
            return this.create(record as ProjectTeamMemberProps);
        } else {
            return;
        }
    }


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<ProjectTeamMemberProps>[], options?: GetOptions<ProjectTeamMemberProps>): Promise<ProjectTeamMember[]> {
        const records = await store.getByFields('ProjectTeamMember', filter, options);
        return records.map(record => this.create(record as ProjectTeamMemberProps));
    }

    static create(record: ProjectTeamMemberProps): ProjectTeamMember {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new this(
            record.id,
            record.projectId,
            record.name,
            record.role,
        );
        Object.assign(entity,record);
        return entity;
    }
}
