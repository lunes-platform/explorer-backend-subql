import { Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
export type AccountProps = Omit<Account, NonNullable<FunctionPropertyNames<Account>> | '_name'>;
export declare class Account implements Entity {
    constructor(id: string, balance: bigint, sentTransfersCount: number, receivedTransfersCount: number);
    id: string;
    balance: bigint;
    sentTransfersCount: number;
    receivedTransfersCount: number;
    lastTransferBlock?: bigint;
    get _name(): string;
    save(): Promise<void>;
    static remove(id: string): Promise<void>;
    static get(id: string): Promise<Account | undefined>;
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static getByFields(filter: FieldsExpression<AccountProps>[], options?: GetOptions<AccountProps>): Promise<Account[]>;
    static create(record: AccountProps): Account;
}
