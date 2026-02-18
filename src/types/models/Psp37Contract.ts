// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';



export type Psp37ContractProps = Omit<Psp37Contract, NonNullable<FunctionPropertyNames<Psp37Contract>>| '_name'>;

export class Psp37Contract implements Entity {

    constructor(
        
        id: string,
        contractAddress: string,
        standard: string,
    ) {
        this.id = id;
        this.contractAddress = contractAddress;
        this.standard = standard;
        
    }

    public id: string;
    public contractAddress: string;
    public name?: string;
    public creator?: string;
    public createdAt?: bigint;
    public createdAtBlock?: bigint;
    public standard: string;
    public metadata?: string;
    public verified?: boolean;
    

    get _name(): string {
        return 'Psp37Contract';
    }

    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save Psp37Contract entity without an ID");
        await store.set('Psp37Contract', id.toString(), this);
    }

    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove Psp37Contract entity without an ID");
        await store.remove('Psp37Contract', id.toString());
    }

    static async get(id:string): Promise<Psp37Contract | undefined>{
        assert((id !== null && id !== undefined), "Cannot get Psp37Contract entity without an ID");
        const record = await store.get('Psp37Contract', id.toString());
        if (record) {
            return this.create(record as Psp37ContractProps);
        } else {
            return;
        }
    }


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<Psp37ContractProps>[], options?: GetOptions<Psp37ContractProps>): Promise<Psp37Contract[]> {
        const records = await store.getByFields('Psp37Contract', filter, options);
        return records.map(record => this.create(record as Psp37ContractProps));
    }

    static create(record: Psp37ContractProps): Psp37Contract {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new this(
            record.id,
            record.contractAddress,
            record.standard,
        );
        Object.assign(entity,record);
        return entity;
    }
}
