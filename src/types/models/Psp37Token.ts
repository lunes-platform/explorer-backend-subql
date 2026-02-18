// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';



export type Psp37TokenProps = Omit<Psp37Token, NonNullable<FunctionPropertyNames<Psp37Token>>| '_name'>;

export class Psp37Token implements Entity {

    constructor(
        
        id: string,
        contractId: string,
        tokenId: string,
        tokenType: string,
    ) {
        this.id = id;
        this.contractId = contractId;
        this.tokenId = tokenId;
        this.tokenType = tokenType;
        
    }

    public id: string;
    public contractId: string;
    public tokenId: string;
    public tokenType: string;
    public totalSupply?: bigint;
    public metadata?: string;
    public tokenUri?: string;
    public createdAt?: bigint;
    public createdAtBlock?: bigint;
    

    get _name(): string {
        return 'Psp37Token';
    }

    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save Psp37Token entity without an ID");
        await store.set('Psp37Token', id.toString(), this);
    }

    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove Psp37Token entity without an ID");
        await store.remove('Psp37Token', id.toString());
    }

    static async get(id:string): Promise<Psp37Token | undefined>{
        assert((id !== null && id !== undefined), "Cannot get Psp37Token entity without an ID");
        const record = await store.get('Psp37Token', id.toString());
        if (record) {
            return this.create(record as Psp37TokenProps);
        } else {
            return;
        }
    }

    static async getByContractId(contractId: string): Promise<Psp37Token[] | undefined>{
      const records = await store.getByField('Psp37Token', 'contractId', contractId);
      return records.map(record => this.create(record as Psp37TokenProps));
    }


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<Psp37TokenProps>[], options?: GetOptions<Psp37TokenProps>): Promise<Psp37Token[]> {
        const records = await store.getByFields('Psp37Token', filter, options);
        return records.map(record => this.create(record as Psp37TokenProps));
    }

    static create(record: Psp37TokenProps): Psp37Token {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new this(
            record.id,
            record.contractId,
            record.tokenId,
            record.tokenType,
        );
        Object.assign(entity,record);
        return entity;
    }
}
