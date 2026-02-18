// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';



export type Psp22TokenProps = Omit<Psp22Token, NonNullable<FunctionPropertyNames<Psp22Token>>| '_name'>;

export class Psp22Token implements Entity {

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
    public decimals?: number;
    public totalSupply?: bigint;
    public creator?: string;
    public createdAt?: bigint;
    public createdAtBlock?: bigint;
    public standard: string;
    public metadata?: string;
    public verified?: boolean;
    

    get _name(): string {
        return 'Psp22Token';
    }

    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save Psp22Token entity without an ID");
        await store.set('Psp22Token', id.toString(), this);
    }

    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove Psp22Token entity without an ID");
        await store.remove('Psp22Token', id.toString());
    }

    static async get(id:string): Promise<Psp22Token | undefined>{
        assert((id !== null && id !== undefined), "Cannot get Psp22Token entity without an ID");
        const record = await store.get('Psp22Token', id.toString());
        if (record) {
            return this.create(record as Psp22TokenProps);
        } else {
            return;
        }
    }


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<Psp22TokenProps>[], options?: GetOptions<Psp22TokenProps>): Promise<Psp22Token[]> {
        const records = await store.getByFields('Psp22Token', filter, options);
        return records.map(record => this.create(record as Psp22TokenProps));
    }

    static create(record: Psp22TokenProps): Psp22Token {
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
