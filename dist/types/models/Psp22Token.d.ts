import { Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
export type Psp22TokenProps = Omit<Psp22Token, NonNullable<FunctionPropertyNames<Psp22Token>> | '_name'>;
export declare class Psp22Token implements Entity {
    constructor(id: string, contractAddress: string, standard: string);
    id: string;
    contractAddress: string;
    name?: string;
    symbol?: string;
    decimals?: number;
    totalSupply?: bigint;
    creator?: string;
    createdAt?: bigint;
    createdAtBlock?: bigint;
    standard: string;
    metadata?: string;
    verified?: boolean;
    get _name(): string;
    save(): Promise<void>;
    static remove(id: string): Promise<void>;
    static get(id: string): Promise<Psp22Token | undefined>;
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static getByFields(filter: FieldsExpression<Psp22TokenProps>[], options?: GetOptions<Psp22TokenProps>): Promise<Psp22Token[]>;
    static create(record: Psp22TokenProps): Psp22Token;
}
