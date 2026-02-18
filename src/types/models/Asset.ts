// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';



export type AssetProps = Omit<Asset, NonNullable<FunctionPropertyNames<Asset>>| '_name'>;

export class Asset implements Entity {

    constructor(
        
        id: string,
        assetType: string,
    ) {
        this.id = id;
        this.assetType = assetType;
        
    }

    public id: string;
    public assetType: string;
    public contractAddress?: string;
    public name?: string;
    public symbol?: string;
    public decimals?: number;
    public totalSupply?: bigint;
    public metadata?: string;
    public verified?: boolean;
    

    get _name(): string {
        return 'Asset';
    }

    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save Asset entity without an ID");
        await store.set('Asset', id.toString(), this);
    }

    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove Asset entity without an ID");
        await store.remove('Asset', id.toString());
    }

    static async get(id:string): Promise<Asset | undefined>{
        assert((id !== null && id !== undefined), "Cannot get Asset entity without an ID");
        const record = await store.get('Asset', id.toString());
        if (record) {
            return this.create(record as AssetProps);
        } else {
            return;
        }
    }


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<AssetProps>[], options?: GetOptions<AssetProps>): Promise<Asset[]> {
        const records = await store.getByFields('Asset', filter, options);
        return records.map(record => this.create(record as AssetProps));
    }

    static create(record: AssetProps): Asset {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new this(
            record.id,
            record.assetType,
        );
        Object.assign(entity,record);
        return entity;
    }
}
