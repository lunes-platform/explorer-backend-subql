// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';



export type Psp37TransferProps = Omit<Psp37Transfer, NonNullable<FunctionPropertyNames<Psp37Transfer>>| '_name'>;

export class Psp37Transfer implements Entity {

    constructor(
        
        id: string,
        contractId: string,
        tokenId: string,
        toId: string,
        amount: bigint,
        blockNumber: bigint,
        eventIndex: number,
    ) {
        this.id = id;
        this.contractId = contractId;
        this.tokenId = tokenId;
        this.toId = toId;
        this.amount = amount;
        this.blockNumber = blockNumber;
        this.eventIndex = eventIndex;
        
    }

    public id: string;
    public contractId: string;
    public tokenId: string;
    public fromId?: string;
    public toId: string;
    public amount: bigint;
    public blockNumber: bigint;
    public timestamp?: bigint;
    public transactionHash?: string;
    public eventIndex: number;
    

    get _name(): string {
        return 'Psp37Transfer';
    }

    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save Psp37Transfer entity without an ID");
        await store.set('Psp37Transfer', id.toString(), this);
    }

    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove Psp37Transfer entity without an ID");
        await store.remove('Psp37Transfer', id.toString());
    }

    static async get(id:string): Promise<Psp37Transfer | undefined>{
        assert((id !== null && id !== undefined), "Cannot get Psp37Transfer entity without an ID");
        const record = await store.get('Psp37Transfer', id.toString());
        if (record) {
            return this.create(record as Psp37TransferProps);
        } else {
            return;
        }
    }

    static async getByContractId(contractId: string): Promise<Psp37Transfer[] | undefined>{
      const records = await store.getByField('Psp37Transfer', 'contractId', contractId);
      return records.map(record => this.create(record as Psp37TransferProps));
    }

    static async getByTokenId(tokenId: string): Promise<Psp37Transfer[] | undefined>{
      const records = await store.getByField('Psp37Transfer', 'tokenId', tokenId);
      return records.map(record => this.create(record as Psp37TransferProps));
    }

    static async getByFromId(fromId: string): Promise<Psp37Transfer[] | undefined>{
      const records = await store.getByField('Psp37Transfer', 'fromId', fromId);
      return records.map(record => this.create(record as Psp37TransferProps));
    }

    static async getByToId(toId: string): Promise<Psp37Transfer[] | undefined>{
      const records = await store.getByField('Psp37Transfer', 'toId', toId);
      return records.map(record => this.create(record as Psp37TransferProps));
    }


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<Psp37TransferProps>[], options?: GetOptions<Psp37TransferProps>): Promise<Psp37Transfer[]> {
        const records = await store.getByFields('Psp37Transfer', filter, options);
        return records.map(record => this.create(record as Psp37TransferProps));
    }

    static create(record: Psp37TransferProps): Psp37Transfer {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new this(
            record.id,
            record.contractId,
            record.tokenId,
            record.toId,
            record.amount,
            record.blockNumber,
            record.eventIndex,
        );
        Object.assign(entity,record);
        return entity;
    }
}
