// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';



export type TransferProps = Omit<Transfer, NonNullable<FunctionPropertyNames<Transfer>>| '_name'>;

export class Transfer implements Entity {

    constructor(
        
        id: string,
        fromId: string,
        toId: string,
        amount: bigint,
        value: bigint,
        blockId: string,
        blockNumber: bigint,
        eventIndex: number,
    ) {
        this.id = id;
        this.fromId = fromId;
        this.toId = toId;
        this.amount = amount;
        this.value = value;
        this.blockId = blockId;
        this.blockNumber = blockNumber;
        this.eventIndex = eventIndex;
        
    }

    public id: string;
    public fromId: string;
    public toId: string;
    public amount: bigint;
    public value: bigint;
    public blockId: string;
    public blockNumber: bigint;
    public eventIndex: number;
    public timestamp?: bigint;
    public date?: Date;
    

    get _name(): string {
        return 'Transfer';
    }

    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save Transfer entity without an ID");
        await store.set('Transfer', id.toString(), this);
    }

    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove Transfer entity without an ID");
        await store.remove('Transfer', id.toString());
    }

    static async get(id:string): Promise<Transfer | undefined>{
        assert((id !== null && id !== undefined), "Cannot get Transfer entity without an ID");
        const record = await store.get('Transfer', id.toString());
        if (record) {
            return this.create(record as TransferProps);
        } else {
            return;
        }
    }


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<TransferProps>[], options?: GetOptions<TransferProps>): Promise<Transfer[]> {
        const records = await store.getByFields('Transfer', filter, options);
        return records.map(record => this.create(record as TransferProps));
    }

    static create(record: TransferProps): Transfer {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new this(
            record.id,
            record.fromId,
            record.toId,
            record.amount,
            record.value,
            record.blockId,
            record.blockNumber,
            record.eventIndex,
        );
        Object.assign(entity,record);
        return entity;
    }
}
