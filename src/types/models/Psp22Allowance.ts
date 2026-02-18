// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';



export type Psp22AllowanceProps = Omit<Psp22Allowance, NonNullable<FunctionPropertyNames<Psp22Allowance>>| '_name'>;

export class Psp22Allowance implements Entity {

    constructor(
        
        id: string,
        tokenId: string,
        ownerId: string,
        spender: string,
        amount: bigint,
        blockNumber: bigint,
    ) {
        this.id = id;
        this.tokenId = tokenId;
        this.ownerId = ownerId;
        this.spender = spender;
        this.amount = amount;
        this.blockNumber = blockNumber;
        
    }

    public id: string;
    public tokenId: string;
    public ownerId: string;
    public spender: string;
    public amount: bigint;
    public blockNumber: bigint;
    

    get _name(): string {
        return 'Psp22Allowance';
    }

    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save Psp22Allowance entity without an ID");
        await store.set('Psp22Allowance', id.toString(), this);
    }

    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove Psp22Allowance entity without an ID");
        await store.remove('Psp22Allowance', id.toString());
    }

    static async get(id:string): Promise<Psp22Allowance | undefined>{
        assert((id !== null && id !== undefined), "Cannot get Psp22Allowance entity without an ID");
        const record = await store.get('Psp22Allowance', id.toString());
        if (record) {
            return this.create(record as Psp22AllowanceProps);
        } else {
            return;
        }
    }

    static async getByTokenId(tokenId: string): Promise<Psp22Allowance[] | undefined>{
      const records = await store.getByField('Psp22Allowance', 'tokenId', tokenId);
      return records.map(record => this.create(record as Psp22AllowanceProps));
    }

    static async getByOwnerId(ownerId: string): Promise<Psp22Allowance[] | undefined>{
      const records = await store.getByField('Psp22Allowance', 'ownerId', ownerId);
      return records.map(record => this.create(record as Psp22AllowanceProps));
    }


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<Psp22AllowanceProps>[], options?: GetOptions<Psp22AllowanceProps>): Promise<Psp22Allowance[]> {
        const records = await store.getByFields('Psp22Allowance', filter, options);
        return records.map(record => this.create(record as Psp22AllowanceProps));
    }

    static create(record: Psp22AllowanceProps): Psp22Allowance {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new this(
            record.id,
            record.tokenId,
            record.ownerId,
            record.spender,
            record.amount,
            record.blockNumber,
        );
        Object.assign(entity,record);
        return entity;
    }
}
