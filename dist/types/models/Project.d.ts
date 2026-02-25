import { Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
export type ProjectProps = Omit<Project, NonNullable<FunctionPropertyNames<Project>> | '_name'>;
export declare class Project implements Entity {
    constructor(id: string, name: string, category: string, createdAt: bigint, verified: boolean, createdBy: string);
    id: string;
    name: string;
    description?: string;
    category: string;
    website?: string;
    whitepaper?: string;
    github?: string;
    twitter?: string;
    discord?: string;
    telegram?: string;
    logoUrl?: string;
    bannerUrl?: string;
    createdAt: bigint;
    updatedAt?: bigint;
    verified: boolean;
    verifiedAt?: bigint;
    createdBy: string;
    get _name(): string;
    save(): Promise<void>;
    static remove(id: string): Promise<void>;
    static get(id: string): Promise<Project | undefined>;
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static getByFields(filter: FieldsExpression<ProjectProps>[], options?: GetOptions<ProjectProps>): Promise<Project[]>;
    static create(record: ProjectProps): Project;
}
