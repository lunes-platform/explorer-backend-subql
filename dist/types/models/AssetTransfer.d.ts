import { Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
export type AssetTransferProps = Omit<AssetTransfer, NonNullable<FunctionPropertyNames<AssetTransfer>> | '_name'>;
export declare class AssetTransfer implements Entity {
    constructor(id: string, assetId: string, fromId: string, toId: string, amount: bigint, blockNumber: bigint, eventIndex: number);
    id: string;
    assetId: string;
    fromId: string;
    toId: string;
    amount: bigint;
    blockNumber: bigint;
    timestamp?: bigint;
    eventIndex: number;
    get _name(): string;
    save(): Promise<void>;
    static remove(id: string): Promise<void>;
    static get(id: string): Promise<AssetTransfer | undefined>;
    static getByAssetId(assetId: string): Promise<AssetTransfer[] | undefined>;
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static getByFields(filter: FieldsExpression<AssetTransferProps>[], options?: GetOptions<AssetTransferProps>): Promise<AssetTransfer[]>;
    static create(record: AssetTransferProps): AssetTransfer;
}
