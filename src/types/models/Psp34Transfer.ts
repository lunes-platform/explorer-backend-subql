// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';



export type Psp34TransferProps = Omit<Psp34Transfer, NonNullable<FunctionPropertyNames<Psp34Transfer>>| '_name'>;

export class Psp34Transfer implements Entity {

    constructor(
        
        id: string,
        collectionId: string,
        toId: string,
        blockNumber: bigint,
        eventIndex: number,
    ) {
        this.id = id;
        this.collectionId = collectionId;
        this.toId = toId;
        this.blockNumber = blockNumber;
        this.eventIndex = eventIndex;
        
    }

    public id: string;
    public collectionId: string;
    public tokenId?: string;
    public fromId?: string;
    public toId: string;
    public blockNumber: bigint;
    public timestamp?: bigint;
    public transactionHash?: string;
    public eventIndex: number;
    

    get _name(): string {
        return 'Psp34Transfer';
    }

    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save Psp34Transfer entity without an ID");
        await store.set('Psp34Transfer', id.toString(), this);
    }

    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove Psp34Transfer entity without an ID");
        await store.remove('Psp34Transfer', id.toString());
    }

    static async get(id:string): Promise<Psp34Transfer | undefined>{
        assert((id !== null && id !== undefined), "Cannot get Psp34Transfer entity without an ID");
        const record = await store.get('Psp34Transfer', id.toString());
        if (record) {
            return this.create(record as Psp34TransferProps);
        } else {
            return;
        }
    }

    static async getByCollectionId(collectionId: string): Promise<Psp34Transfer[] | undefined>{
      const records = await store.getByField('Psp34Transfer', 'collectionId', collectionId);
      return records.map(record => this.create(record as Psp34TransferProps));
    }

    static async getByTokenId(tokenId: string): Promise<Psp34Transfer[] | undefined>{
      const records = await store.getByField('Psp34Transfer', 'tokenId', tokenId);
      return records.map(record => this.create(record as Psp34TransferProps));
    }

    static async getByFromId(fromId: string): Promise<Psp34Transfer[] | undefined>{
      const records = await store.getByField('Psp34Transfer', 'fromId', fromId);
      return records.map(record => this.create(record as Psp34TransferProps));
    }

    static async getByToId(toId: string): Promise<Psp34Transfer[] | undefined>{
      const records = await store.getByField('Psp34Transfer', 'toId', toId);
      return records.map(record => this.create(record as Psp34TransferProps));
    }


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<Psp34TransferProps>[], options?: GetOptions<Psp34TransferProps>): Promise<Psp34Transfer[]> {
        const records = await store.getByFields('Psp34Transfer', filter, options);
        return records.map(record => this.create(record as Psp34TransferProps));
    }

    static create(record: Psp34TransferProps): Psp34Transfer {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new this(
            record.id,
            record.collectionId,
            record.toId,
            record.blockNumber,
            record.eventIndex,
        );
        Object.assign(entity,record);
        return entity;
    }
}
