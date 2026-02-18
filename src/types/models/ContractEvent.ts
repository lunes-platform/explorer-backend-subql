// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';



export type ContractEventProps = Omit<ContractEvent, NonNullable<FunctionPropertyNames<ContractEvent>>| '_name'>;

export class ContractEvent implements Entity {

    constructor(
        
        id: string,
        eventName: string,
        eventData: string,
        blockNumber: bigint,
        eventIndex: number,
    ) {
        this.id = id;
        this.eventName = eventName;
        this.eventData = eventData;
        this.blockNumber = blockNumber;
        this.eventIndex = eventIndex;
        
    }

    public id: string;
    public contractId?: string;
    public eventName: string;
    public eventData: string;
    public blockNumber: bigint;
    public timestamp?: bigint;
    public transactionHash?: string;
    public eventIndex: number;
    

    get _name(): string {
        return 'ContractEvent';
    }

    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save ContractEvent entity without an ID");
        await store.set('ContractEvent', id.toString(), this);
    }

    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove ContractEvent entity without an ID");
        await store.remove('ContractEvent', id.toString());
    }

    static async get(id:string): Promise<ContractEvent | undefined>{
        assert((id !== null && id !== undefined), "Cannot get ContractEvent entity without an ID");
        const record = await store.get('ContractEvent', id.toString());
        if (record) {
            return this.create(record as ContractEventProps);
        } else {
            return;
        }
    }

    static async getByContractId(contractId: string): Promise<ContractEvent[] | undefined>{
      const records = await store.getByField('ContractEvent', 'contractId', contractId);
      return records.map(record => this.create(record as ContractEventProps));
    }


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<ContractEventProps>[], options?: GetOptions<ContractEventProps>): Promise<ContractEvent[]> {
        const records = await store.getByFields('ContractEvent', filter, options);
        return records.map(record => this.create(record as ContractEventProps));
    }

    static create(record: ContractEventProps): ContractEvent {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new this(
            record.id,
            record.eventName,
            record.eventData,
            record.blockNumber,
            record.eventIndex,
        );
        Object.assign(entity,record);
        return entity;
    }
}
