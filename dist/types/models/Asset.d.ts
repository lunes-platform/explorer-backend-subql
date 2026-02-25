import { Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
export type AssetProps = Omit<Asset, NonNullable<FunctionPropertyNames<Asset>> | '_name'>;
export declare class Asset implements Entity {
    constructor(id: string, assetType: string);
    id: string;
    assetType: string;
    contractAddress?: string;
    name?: string;
    symbol?: string;
    decimals?: number;
    totalSupply?: bigint;
    metadata?: string;
    verified?: boolean;
    get _name(): string;
    save(): Promise<void>;
    static remove(id: string): Promise<void>;
    static get(id: string): Promise<Asset | undefined>;
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static getByFields(filter: FieldsExpression<AssetProps>[], options?: GetOptions<AssetProps>): Promise<Asset[]>;
    static create(record: AssetProps): Asset;
}
