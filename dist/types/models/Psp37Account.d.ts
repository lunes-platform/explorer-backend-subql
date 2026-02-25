import { Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
export type Psp37AccountProps = Omit<Psp37Account, NonNullable<FunctionPropertyNames<Psp37Account>> | '_name'>;
export declare class Psp37Account implements Entity {
    constructor(id: string, contractId: string, tokenId: string, accountId: string, balance: bigint);
    id: string;
    contractId: string;
    tokenId: string;
    accountId: string;
    balance: bigint;
    get _name(): string;
    save(): Promise<void>;
    static remove(id: string): Promise<void>;
    static get(id: string): Promise<Psp37Account | undefined>;
    static getByContractId(contractId: string): Promise<Psp37Account[] | undefined>;
    static getByTokenId(tokenId: string): Promise<Psp37Account[] | undefined>;
    static getByAccountId(accountId: string): Promise<Psp37Account[] | undefined>;
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static getByFields(filter: FieldsExpression<Psp37AccountProps>[], options?: GetOptions<Psp37AccountProps>): Promise<Psp37Account[]>;
    static create(record: Psp37AccountProps): Psp37Account;
}
