import { Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
export type Psp22AccountProps = Omit<Psp22Account, NonNullable<FunctionPropertyNames<Psp22Account>> | '_name'>;
export declare class Psp22Account implements Entity {
    constructor(id: string, tokenId: string, accountId: string, balance: bigint);
    id: string;
    tokenId: string;
    accountId: string;
    balance: bigint;
    get _name(): string;
    save(): Promise<void>;
    static remove(id: string): Promise<void>;
    static get(id: string): Promise<Psp22Account | undefined>;
    static getByTokenId(tokenId: string): Promise<Psp22Account[] | undefined>;
    static getByAccountId(accountId: string): Promise<Psp22Account[] | undefined>;
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static getByFields(filter: FieldsExpression<Psp22AccountProps>[], options?: GetOptions<Psp22AccountProps>): Promise<Psp22Account[]>;
    static create(record: Psp22AccountProps): Psp22Account;
}
