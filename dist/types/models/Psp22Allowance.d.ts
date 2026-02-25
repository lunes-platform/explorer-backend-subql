import { Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
export type Psp22AllowanceProps = Omit<Psp22Allowance, NonNullable<FunctionPropertyNames<Psp22Allowance>> | '_name'>;
export declare class Psp22Allowance implements Entity {
    constructor(id: string, tokenId: string, ownerId: string, spender: string, amount: bigint, blockNumber: bigint);
    id: string;
    tokenId: string;
    ownerId: string;
    spender: string;
    amount: bigint;
    blockNumber: bigint;
    get _name(): string;
    save(): Promise<void>;
    static remove(id: string): Promise<void>;
    static get(id: string): Promise<Psp22Allowance | undefined>;
    static getByTokenId(tokenId: string): Promise<Psp22Allowance[] | undefined>;
    static getByOwnerId(ownerId: string): Promise<Psp22Allowance[] | undefined>;
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static getByFields(filter: FieldsExpression<Psp22AllowanceProps>[], options?: GetOptions<Psp22AllowanceProps>): Promise<Psp22Allowance[]>;
    static create(record: Psp22AllowanceProps): Psp22Allowance;
}
