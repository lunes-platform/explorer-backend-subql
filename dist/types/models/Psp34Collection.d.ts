import { Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
export type Psp34CollectionProps = Omit<Psp34Collection, NonNullable<FunctionPropertyNames<Psp34Collection>> | '_name'>;
export declare class Psp34Collection implements Entity {
    constructor(id: string, contractAddress: string, standard: string);
    id: string;
    contractAddress: string;
    name?: string;
    symbol?: string;
    creator?: string;
    createdAt?: bigint;
    createdAtBlock?: bigint;
    totalSupply?: bigint;
    standard: string;
    metadata?: string;
    baseUri?: string;
    verified?: boolean;
    get _name(): string;
    save(): Promise<void>;
    static remove(id: string): Promise<void>;
    static get(id: string): Promise<Psp34Collection | undefined>;
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static getByFields(filter: FieldsExpression<Psp34CollectionProps>[], options?: GetOptions<Psp34CollectionProps>): Promise<Psp34Collection[]>;
    static create(record: Psp34CollectionProps): Psp34Collection;
}
