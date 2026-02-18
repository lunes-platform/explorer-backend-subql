// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';



export type SmartContractProps = Omit<SmartContract, NonNullable<FunctionPropertyNames<SmartContract>>| '_name'>;

export class SmartContract implements Entity {

    constructor(
        
        id: string,
        contractAddress: string,
        deployedAt: bigint,
        deployedAtBlock: bigint,
        isVerified: boolean,
        callCount: number,
    ) {
        this.id = id;
        this.contractAddress = contractAddress;
        this.deployedAt = deployedAt;
        this.deployedAtBlock = deployedAtBlock;
        this.isVerified = isVerified;
        this.callCount = callCount;
        
    }

    public id: string;
    public contractAddress: string;
    public deployerId?: string;
    public codeHash?: string;
    public standard?: string;
    public name?: string;
    public version?: string;
    public deployedAt: bigint;
    public deployedAtBlock: bigint;
    public isVerified: boolean;
    public sourceCode?: string;
    public abi?: string;
    public metadata?: string;
    public lastInteraction?: bigint;
    public callCount: number;
    

    get _name(): string {
        return 'SmartContract';
    }

    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save SmartContract entity without an ID");
        await store.set('SmartContract', id.toString(), this);
    }

    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove SmartContract entity without an ID");
        await store.remove('SmartContract', id.toString());
    }

    static async get(id:string): Promise<SmartContract | undefined>{
        assert((id !== null && id !== undefined), "Cannot get SmartContract entity without an ID");
        const record = await store.get('SmartContract', id.toString());
        if (record) {
            return this.create(record as SmartContractProps);
        } else {
            return;
        }
    }

    static async getByDeployerId(deployerId: string): Promise<SmartContract[] | undefined>{
      const records = await store.getByField('SmartContract', 'deployerId', deployerId);
      return records.map(record => this.create(record as SmartContractProps));
    }


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<SmartContractProps>[], options?: GetOptions<SmartContractProps>): Promise<SmartContract[]> {
        const records = await store.getByFields('SmartContract', filter, options);
        return records.map(record => this.create(record as SmartContractProps));
    }

    static create(record: SmartContractProps): SmartContract {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new this(
            record.id,
            record.contractAddress,
            record.deployedAt,
            record.deployedAtBlock,
            record.isVerified,
            record.callCount,
        );
        Object.assign(entity,record);
        return entity;
    }
}
