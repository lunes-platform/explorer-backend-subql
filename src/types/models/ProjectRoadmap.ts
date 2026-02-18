// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';



export type ProjectRoadmapProps = Omit<ProjectRoadmap, NonNullable<FunctionPropertyNames<ProjectRoadmap>>| '_name'>;

export class ProjectRoadmap implements Entity {

    constructor(
        
        id: string,
        projectId: string,
        quarter: string,
        title: string,
        status: string,
    ) {
        this.id = id;
        this.projectId = projectId;
        this.quarter = quarter;
        this.title = title;
        this.status = status;
        
    }

    public id: string;
    public projectId: string;
    public quarter: string;
    public title: string;
    public description?: string;
    public status: string;
    public completedAt?: bigint;
    

    get _name(): string {
        return 'ProjectRoadmap';
    }

    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save ProjectRoadmap entity without an ID");
        await store.set('ProjectRoadmap', id.toString(), this);
    }

    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove ProjectRoadmap entity without an ID");
        await store.remove('ProjectRoadmap', id.toString());
    }

    static async get(id:string): Promise<ProjectRoadmap | undefined>{
        assert((id !== null && id !== undefined), "Cannot get ProjectRoadmap entity without an ID");
        const record = await store.get('ProjectRoadmap', id.toString());
        if (record) {
            return this.create(record as ProjectRoadmapProps);
        } else {
            return;
        }
    }


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<ProjectRoadmapProps>[], options?: GetOptions<ProjectRoadmapProps>): Promise<ProjectRoadmap[]> {
        const records = await store.getByFields('ProjectRoadmap', filter, options);
        return records.map(record => this.create(record as ProjectRoadmapProps));
    }

    static create(record: ProjectRoadmapProps): ProjectRoadmap {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new this(
            record.id,
            record.projectId,
            record.quarter,
            record.title,
            record.status,
        );
        Object.assign(entity,record);
        return entity;
    }
}
