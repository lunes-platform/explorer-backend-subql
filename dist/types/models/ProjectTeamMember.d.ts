import { Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
export type ProjectTeamMemberProps = Omit<ProjectTeamMember, NonNullable<FunctionPropertyNames<ProjectTeamMember>> | '_name'>;
export declare class ProjectTeamMember implements Entity {
    constructor(id: string, projectId: string, name: string, role: string);
    id: string;
    projectId: string;
    name: string;
    role: string;
    linkedin?: string;
    twitter?: string;
    avatarUrl?: string;
    get _name(): string;
    save(): Promise<void>;
    static remove(id: string): Promise<void>;
    static get(id: string): Promise<ProjectTeamMember | undefined>;
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static getByFields(filter: FieldsExpression<ProjectTeamMemberProps>[], options?: GetOptions<ProjectTeamMemberProps>): Promise<ProjectTeamMember[]>;
    static create(record: ProjectTeamMemberProps): ProjectTeamMember;
}
