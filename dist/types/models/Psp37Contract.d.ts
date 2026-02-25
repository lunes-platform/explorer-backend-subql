import { Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
export type Psp37ContractProps = Omit<Psp37Contract, NonNullable<FunctionPropertyNames<Psp37Contract>> | '_name'>;
export declare class Psp37Contract implements Entity {
    constructor(id: string, contractAddress: string, standard: string);
    id: string;
    contractAddress: string;
    name?: string;
    creator?: string;
    createdAt?: bigint;
    createdAtBlock?: bigint;
    standard: string;
    metadata?: string;
    verified?: boolean;
    get _name(): string;
    save(): Promise<void>;
    static remove(id: string): Promise<void>;
    static get(id: string): Promise<Psp37Contract | undefined>;
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static getByFields(filter: FieldsExpression<Psp37ContractProps>[], options?: GetOptions<Psp37ContractProps>): Promise<Psp37Contract[]>;
    static create(record: Psp37ContractProps): Psp37Contract;
}
