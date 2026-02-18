// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';



export type ProjectProps = Omit<Project, NonNullable<FunctionPropertyNames<Project>>| '_name'>;

export class Project implements Entity {

    constructor(
        
        id: string,
        name: string,
        category: string,
        createdAt: bigint,
        verified: boolean,
        createdBy: string,
    ) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.createdAt = createdAt;
        this.verified = verified;
        this.createdBy = createdBy;
        
    }

    public id: string;
    public name: string;
    public description?: string;
    public category: string;
    public website?: string;
    public whitepaper?: string;
    public github?: string;
    public twitter?: string;
    public discord?: string;
    public telegram?: string;
    public logoUrl?: string;
    public bannerUrl?: string;
    public createdAt: bigint;
    public updatedAt?: bigint;
    public verified: boolean;
    public verifiedAt?: bigint;
    public createdBy: string;
    

    get _name(): string {
        return 'Project';
    }

    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save Project entity without an ID");
        await store.set('Project', id.toString(), this);
    }

    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove Project entity without an ID");
        await store.remove('Project', id.toString());
    }

    static async get(id:string): Promise<Project | undefined>{
        assert((id !== null && id !== undefined), "Cannot get Project entity without an ID");
        const record = await store.get('Project', id.toString());
        if (record) {
            return this.create(record as ProjectProps);
        } else {
            return;
        }
    }


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<ProjectProps>[], options?: GetOptions<ProjectProps>): Promise<Project[]> {
        const records = await store.getByFields('Project', filter, options);
        return records.map(record => this.create(record as ProjectProps));
    }

    static create(record: ProjectProps): Project {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new this(
            record.id,
            record.name,
            record.category,
            record.createdAt,
            record.verified,
            record.createdBy,
        );
        Object.assign(entity,record);
        return entity;
    }
}
