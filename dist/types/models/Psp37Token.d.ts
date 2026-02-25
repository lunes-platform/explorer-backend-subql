import { Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
export type Psp37TokenProps = Omit<Psp37Token, NonNullable<FunctionPropertyNames<Psp37Token>> | '_name'>;
export declare class Psp37Token implements Entity {
    constructor(id: string, contractId: string, tokenId: string, tokenType: string);
    id: string;
    contractId: string;
    tokenId: string;
    tokenType: string;
    totalSupply?: bigint;
    metadata?: string;
    tokenUri?: string;
    createdAt?: bigint;
    createdAtBlock?: bigint;
    get _name(): string;
    save(): Promise<void>;
    static remove(id: string): Promise<void>;
    static get(id: string): Promise<Psp37Token | undefined>;
    static getByContractId(contractId: string): Promise<Psp37Token[] | undefined>;
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static getByFields(filter: FieldsExpression<Psp37TokenProps>[], options?: GetOptions<Psp37TokenProps>): Promise<Psp37Token[]>;
    static create(record: Psp37TokenProps): Psp37Token;
}
