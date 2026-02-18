// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';



export type NftAccountProps = Omit<NftAccount, NonNullable<FunctionPropertyNames<NftAccount>>| '_name'>;

export class NftAccount implements Entity {

    constructor(
        
        id: string,
        collectionId: string,
        accountId: string,
        tokenCount: number,
    ) {
        this.id = id;
        this.collectionId = collectionId;
        this.accountId = accountId;
        this.tokenCount = tokenCount;
        
    }

    public id: string;
    public collectionId: string;
    public accountId: string;
    public tokenCount: number;
    

    get _name(): string {
        return 'NftAccount';
    }

    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save NftAccount entity without an ID");
        await store.set('NftAccount', id.toString(), this);
    }

    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove NftAccount entity without an ID");
        await store.remove('NftAccount', id.toString());
    }

    static async get(id:string): Promise<NftAccount | undefined>{
        assert((id !== null && id !== undefined), "Cannot get NftAccount entity without an ID");
        const record = await store.get('NftAccount', id.toString());
        if (record) {
            return this.create(record as NftAccountProps);
        } else {
            return;
        }
    }

    static async getByCollectionId(collectionId: string): Promise<NftAccount[] | undefined>{
      const records = await store.getByField('NftAccount', 'collectionId', collectionId);
      return records.map(record => this.create(record as NftAccountProps));
    }

    static async getByAccountId(accountId: string): Promise<NftAccount[] | undefined>{
      const records = await store.getByField('NftAccount', 'accountId', accountId);
      return records.map(record => this.create(record as NftAccountProps));
    }


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<NftAccountProps>[], options?: GetOptions<NftAccountProps>): Promise<NftAccount[]> {
        const records = await store.getByFields('NftAccount', filter, options);
        return records.map(record => this.create(record as NftAccountProps));
    }

    static create(record: NftAccountProps): NftAccount {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new this(
            record.id,
            record.collectionId,
            record.accountId,
            record.tokenCount,
        );
        Object.assign(entity,record);
        return entity;
    }
}
