// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';



export type Psp34CollectionProps = Omit<Psp34Collection, NonNullable<FunctionPropertyNames<Psp34Collection>>| '_name'>;

export class Psp34Collection implements Entity {

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
    public symbol?: string;
    public creator?: string;
    public createdAt?: bigint;
    public createdAtBlock?: bigint;
    public totalSupply?: bigint;
    public standard: string;
    public metadata?: string;
    public baseUri?: string;
    public verified?: boolean;
    

    get _name(): string {
        return 'Psp34Collection';
    }

    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save Psp34Collection entity without an ID");
        await store.set('Psp34Collection', id.toString(), this);
    }

    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove Psp34Collection entity without an ID");
        await store.remove('Psp34Collection', id.toString());
    }

    static async get(id:string): Promise<Psp34Collection | undefined>{
        assert((id !== null && id !== undefined), "Cannot get Psp34Collection entity without an ID");
        const record = await store.get('Psp34Collection', id.toString());
        if (record) {
            return this.create(record as Psp34CollectionProps);
        } else {
            return;
        }
    }


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<Psp34CollectionProps>[], options?: GetOptions<Psp34CollectionProps>): Promise<Psp34Collection[]> {
        const records = await store.getByFields('Psp34Collection', filter, options);
        return records.map(record => this.create(record as Psp34CollectionProps));
    }

    static create(record: Psp34CollectionProps): Psp34Collection {
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
