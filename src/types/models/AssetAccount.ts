// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';



export type AssetAccountProps = Omit<AssetAccount, NonNullable<FunctionPropertyNames<AssetAccount>>| '_name'>;

export class AssetAccount implements Entity {

    constructor(
        
        id: string,
        assetId: string,
        accountId: string,
        balance: bigint,
    ) {
        this.id = id;
        this.assetId = assetId;
        this.accountId = accountId;
        this.balance = balance;
        
    }

    public id: string;
    public assetId: string;
    public accountId: string;
    public balance: bigint;
    

    get _name(): string {
        return 'AssetAccount';
    }

    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save AssetAccount entity without an ID");
        await store.set('AssetAccount', id.toString(), this);
    }

    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove AssetAccount entity without an ID");
        await store.remove('AssetAccount', id.toString());
    }

    static async get(id:string): Promise<AssetAccount | undefined>{
        assert((id !== null && id !== undefined), "Cannot get AssetAccount entity without an ID");
        const record = await store.get('AssetAccount', id.toString());
        if (record) {
            return this.create(record as AssetAccountProps);
        } else {
            return;
        }
    }

    static async getByAssetId(assetId: string): Promise<AssetAccount[] | undefined>{
      const records = await store.getByField('AssetAccount', 'assetId', assetId);
      return records.map(record => this.create(record as AssetAccountProps));
    }

    static async getByAccountId(accountId: string): Promise<AssetAccount[] | undefined>{
      const records = await store.getByField('AssetAccount', 'accountId', accountId);
      return records.map(record => this.create(record as AssetAccountProps));
    }


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<AssetAccountProps>[], options?: GetOptions<AssetAccountProps>): Promise<AssetAccount[]> {
        const records = await store.getByFields('AssetAccount', filter, options);
        return records.map(record => this.create(record as AssetAccountProps));
    }

    static create(record: AssetAccountProps): AssetAccount {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new this(
            record.id,
            record.assetId,
            record.accountId,
            record.balance,
        );
        Object.assign(entity,record);
        return entity;
    }
}
