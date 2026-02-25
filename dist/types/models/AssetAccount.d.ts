import { Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
export type AssetAccountProps = Omit<AssetAccount, NonNullable<FunctionPropertyNames<AssetAccount>> | '_name'>;
export declare class AssetAccount implements Entity {
    constructor(id: string, assetId: string, accountId: string, balance: bigint);
    id: string;
    assetId: string;
    accountId: string;
    balance: bigint;
    get _name(): string;
    save(): Promise<void>;
    static remove(id: string): Promise<void>;
    static get(id: string): Promise<AssetAccount | undefined>;
    static getByAssetId(assetId: string): Promise<AssetAccount[] | undefined>;
    static getByAccountId(accountId: string): Promise<AssetAccount[] | undefined>;
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static getByFields(filter: FieldsExpression<AssetAccountProps>[], options?: GetOptions<AssetAccountProps>): Promise<AssetAccount[]>;
    static create(record: AssetAccountProps): AssetAccount;
}
