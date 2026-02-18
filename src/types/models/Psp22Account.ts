// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';



export type Psp22AccountProps = Omit<Psp22Account, NonNullable<FunctionPropertyNames<Psp22Account>>| '_name'>;

export class Psp22Account implements Entity {

    constructor(
        
        id: string,
        tokenId: string,
        accountId: string,
        balance: bigint,
    ) {
        this.id = id;
        this.tokenId = tokenId;
        this.accountId = accountId;
        this.balance = balance;
        
    }

    public id: string;
    public tokenId: string;
    public accountId: string;
    public balance: bigint;
    

    get _name(): string {
        return 'Psp22Account';
    }

    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save Psp22Account entity without an ID");
        await store.set('Psp22Account', id.toString(), this);
    }

    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove Psp22Account entity without an ID");
        await store.remove('Psp22Account', id.toString());
    }

    static async get(id:string): Promise<Psp22Account | undefined>{
        assert((id !== null && id !== undefined), "Cannot get Psp22Account entity without an ID");
        const record = await store.get('Psp22Account', id.toString());
        if (record) {
            return this.create(record as Psp22AccountProps);
        } else {
            return;
        }
    }

    static async getByTokenId(tokenId: string): Promise<Psp22Account[] | undefined>{
      const records = await store.getByField('Psp22Account', 'tokenId', tokenId);
      return records.map(record => this.create(record as Psp22AccountProps));
    }

    static async getByAccountId(accountId: string): Promise<Psp22Account[] | undefined>{
      const records = await store.getByField('Psp22Account', 'accountId', accountId);
      return records.map(record => this.create(record as Psp22AccountProps));
    }


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<Psp22AccountProps>[], options?: GetOptions<Psp22AccountProps>): Promise<Psp22Account[]> {
        const records = await store.getByFields('Psp22Account', filter, options);
        return records.map(record => this.create(record as Psp22AccountProps));
    }

    static create(record: Psp22AccountProps): Psp22Account {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new this(
            record.id,
            record.tokenId,
            record.accountId,
            record.balance,
        );
        Object.assign(entity,record);
        return entity;
    }
}
