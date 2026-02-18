// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';



export type AssetTransferProps = Omit<AssetTransfer, NonNullable<FunctionPropertyNames<AssetTransfer>>| '_name'>;

export class AssetTransfer implements Entity {

    constructor(
        
        id: string,
        assetId: string,
        fromId: string,
        toId: string,
        amount: bigint,
        blockNumber: bigint,
        eventIndex: number,
    ) {
        this.id = id;
        this.assetId = assetId;
        this.fromId = fromId;
        this.toId = toId;
        this.amount = amount;
        this.blockNumber = blockNumber;
        this.eventIndex = eventIndex;
        
    }

    public id: string;
    public assetId: string;
    public fromId: string;
    public toId: string;
    public amount: bigint;
    public blockNumber: bigint;
    public timestamp?: bigint;
    public eventIndex: number;
    

    get _name(): string {
        return 'AssetTransfer';
    }

    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save AssetTransfer entity without an ID");
        await store.set('AssetTransfer', id.toString(), this);
    }

    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove AssetTransfer entity without an ID");
        await store.remove('AssetTransfer', id.toString());
    }

    static async get(id:string): Promise<AssetTransfer | undefined>{
        assert((id !== null && id !== undefined), "Cannot get AssetTransfer entity without an ID");
        const record = await store.get('AssetTransfer', id.toString());
        if (record) {
            return this.create(record as AssetTransferProps);
        } else {
            return;
        }
    }

    static async getByAssetId(assetId: string): Promise<AssetTransfer[] | undefined>{
      const records = await store.getByField('AssetTransfer', 'assetId', assetId);
      return records.map(record => this.create(record as AssetTransferProps));
    }


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<AssetTransferProps>[], options?: GetOptions<AssetTransferProps>): Promise<AssetTransfer[]> {
        const records = await store.getByFields('AssetTransfer', filter, options);
        return records.map(record => this.create(record as AssetTransferProps));
    }

    static create(record: AssetTransferProps): AssetTransfer {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new this(
            record.id,
            record.assetId,
            record.fromId,
            record.toId,
            record.amount,
            record.blockNumber,
            record.eventIndex,
        );
        Object.assign(entity,record);
        return entity;
    }
}
