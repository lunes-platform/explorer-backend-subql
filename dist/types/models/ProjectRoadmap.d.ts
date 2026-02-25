import { Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
export type ProjectRoadmapProps = Omit<ProjectRoadmap, NonNullable<FunctionPropertyNames<ProjectRoadmap>> | '_name'>;
export declare class ProjectRoadmap implements Entity {
    constructor(id: string, projectId: string, quarter: string, title: string, status: string);
    id: string;
    projectId: string;
    quarter: string;
    title: string;
    description?: string;
    status: string;
    completedAt?: bigint;
    get _name(): string;
    save(): Promise<void>;
    static remove(id: string): Promise<void>;
    static get(id: string): Promise<ProjectRoadmap | undefined>;
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static getByFields(filter: FieldsExpression<ProjectRoadmapProps>[], options?: GetOptions<ProjectRoadmapProps>): Promise<ProjectRoadmap[]>;
    static create(record: ProjectRoadmapProps): ProjectRoadmap;
}
