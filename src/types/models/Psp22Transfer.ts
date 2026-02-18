// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';



export type Psp22TransferProps = Omit<Psp22Transfer, NonNullable<FunctionPropertyNames<Psp22Transfer>>| '_name'>;

export class Psp22Transfer implements Entity {

    constructor(
        
        id: string,
        tokenId: string,
        fromId: string,
        toId: string,
        amount: bigint,
        blockNumber: bigint,
        eventIndex: number,
    ) {
        this.id = id;
        this.tokenId = tokenId;
        this.fromId = fromId;
        this.toId = toId;
        this.amount = amount;
        this.blockNumber = blockNumber;
        this.eventIndex = eventIndex;
        
    }

    public id: string;
    public tokenId: string;
    public fromId: string;
    public toId: string;
    public amount: bigint;
    public blockNumber: bigint;
    public timestamp?: bigint;
    public transactionHash?: string;
    public eventIndex: number;
    

    get _name(): string {
        return 'Psp22Transfer';
    }

    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save Psp22Transfer entity without an ID");
        await store.set('Psp22Transfer', id.toString(), this);
    }

    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove Psp22Transfer entity without an ID");
        await store.remove('Psp22Transfer', id.toString());
    }

    static async get(id:string): Promise<Psp22Transfer | undefined>{
        assert((id !== null && id !== undefined), "Cannot get Psp22Transfer entity without an ID");
        const record = await store.get('Psp22Transfer', id.toString());
        if (record) {
            return this.create(record as Psp22TransferProps);
        } else {
            return;
        }
    }

    static async getByTokenId(tokenId: string): Promise<Psp22Transfer[] | undefined>{
      const records = await store.getByField('Psp22Transfer', 'tokenId', tokenId);
      return records.map(record => this.create(record as Psp22TransferProps));
    }

    static async getByFromId(fromId: string): Promise<Psp22Transfer[] | undefined>{
      const records = await store.getByField('Psp22Transfer', 'fromId', fromId);
      return records.map(record => this.create(record as Psp22TransferProps));
    }

    static async getByToId(toId: string): Promise<Psp22Transfer[] | undefined>{
      const records = await store.getByField('Psp22Transfer', 'toId', toId);
      return records.map(record => this.create(record as Psp22TransferProps));
    }


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<Psp22TransferProps>[], options?: GetOptions<Psp22TransferProps>): Promise<Psp22Transfer[]> {
        const records = await store.getByFields('Psp22Transfer', filter, options);
        return records.map(record => this.create(record as Psp22TransferProps));
    }

    static create(record: Psp22TransferProps): Psp22Transfer {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new this(
            record.id,
            record.tokenId,
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
