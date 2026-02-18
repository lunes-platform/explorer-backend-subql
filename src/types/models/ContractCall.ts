// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';



export type ContractCallProps = Omit<ContractCall, NonNullable<FunctionPropertyNames<ContractCall>>| '_name'>;

export class ContractCall implements Entity {

    constructor(
        
        id: string,
        contractId: string,
        callerId: string,
        method: string,
        success: boolean,
        blockNumber: bigint,
        extrinsicIndex: number,
    ) {
        this.id = id;
        this.contractId = contractId;
        this.callerId = callerId;
        this.method = method;
        this.success = success;
        this.blockNumber = blockNumber;
        this.extrinsicIndex = extrinsicIndex;
        
    }

    public id: string;
    public contractId: string;
    public callerId: string;
    public method: string;
    public args?: string;
    public success: boolean;
    public gasUsed?: bigint;
    public value?: bigint;
    public blockNumber: bigint;
    public timestamp?: bigint;
    public transactionHash?: string;
    public extrinsicIndex: number;
    

    get _name(): string {
        return 'ContractCall';
    }

    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save ContractCall entity without an ID");
        await store.set('ContractCall', id.toString(), this);
    }

    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove ContractCall entity without an ID");
        await store.remove('ContractCall', id.toString());
    }

    static async get(id:string): Promise<ContractCall | undefined>{
        assert((id !== null && id !== undefined), "Cannot get ContractCall entity without an ID");
        const record = await store.get('ContractCall', id.toString());
        if (record) {
            return this.create(record as ContractCallProps);
        } else {
            return;
        }
    }

    static async getByContractId(contractId: string): Promise<ContractCall[] | undefined>{
      const records = await store.getByField('ContractCall', 'contractId', contractId);
      return records.map(record => this.create(record as ContractCallProps));
    }

    static async getByCallerId(callerId: string): Promise<ContractCall[] | undefined>{
      const records = await store.getByField('ContractCall', 'callerId', callerId);
      return records.map(record => this.create(record as ContractCallProps));
    }


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<ContractCallProps>[], options?: GetOptions<ContractCallProps>): Promise<ContractCall[]> {
        const records = await store.getByFields('ContractCall', filter, options);
        return records.map(record => this.create(record as ContractCallProps));
    }

    static create(record: ContractCallProps): ContractCall {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new this(
            record.id,
            record.contractId,
            record.callerId,
            record.method,
            record.success,
            record.blockNumber,
            record.extrinsicIndex,
        );
        Object.assign(entity,record);
        return entity;
    }
}
