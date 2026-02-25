import { Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
export type NftAccountProps = Omit<NftAccount, NonNullable<FunctionPropertyNames<NftAccount>> | '_name'>;
export declare class NftAccount implements Entity {
    constructor(id: string, collectionId: string, accountId: string, tokenCount: number);
    id: string;
    collectionId: string;
    accountId: string;
    tokenCount: number;
    get _name(): string;
    save(): Promise<void>;
    static remove(id: string): Promise<void>;
    static get(id: string): Promise<NftAccount | undefined>;
    static getByCollectionId(collectionId: string): Promise<NftAccount[] | undefined>;
    static getByAccountId(accountId: string): Promise<NftAccount[] | undefined>;
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static getByFields(filter: FieldsExpression<NftAccountProps>[], options?: GetOptions<NftAccountProps>): Promise<NftAccount[]>;
    static create(record: NftAccountProps): NftAccount;
}
