// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';



export type Psp37AccountProps = Omit<Psp37Account, NonNullable<FunctionPropertyNames<Psp37Account>>| '_name'>;

export class Psp37Account implements Entity {

    constructor(
        
        id: string,
        contractId: string,
        tokenId: string,
        accountId: string,
        balance: bigint,
    ) {
        this.id = id;
        this.contractId = contractId;
        this.tokenId = tokenId;
        this.accountId = accountId;
        this.balance = balance;
        
    }

    public id: string;
    public contractId: string;
    public tokenId: string;
    public accountId: string;
    public balance: bigint;
    

    get _name(): string {
        return 'Psp37Account';
    }

    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save Psp37Account entity without an ID");
        await store.set('Psp37Account', id.toString(), this);
    }

    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove Psp37Account entity without an ID");
        await store.remove('Psp37Account', id.toString());
    }

    static async get(id:string): Promise<Psp37Account | undefined>{
        assert((id !== null && id !== undefined), "Cannot get Psp37Account entity without an ID");
        const record = await store.get('Psp37Account', id.toString());
        if (record) {
            return this.create(record as Psp37AccountProps);
        } else {
            return;
        }
    }

    static async getByContractId(contractId: string): Promise<Psp37Account[] | undefined>{
      const records = await store.getByField('Psp37Account', 'contractId', contractId);
      return records.map(record => this.create(record as Psp37AccountProps));
    }

    static async getByTokenId(tokenId: string): Promise<Psp37Account[] | undefined>{
      const records = await store.getByField('Psp37Account', 'tokenId', tokenId);
      return records.map(record => this.create(record as Psp37AccountProps));
    }

    static async getByAccountId(accountId: string): Promise<Psp37Account[] | undefined>{
      const records = await store.getByField('Psp37Account', 'accountId', accountId);
      return records.map(record => this.create(record as Psp37AccountProps));
    }


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<Psp37AccountProps>[], options?: GetOptions<Psp37AccountProps>): Promise<Psp37Account[]> {
        const records = await store.getByFields('Psp37Account', filter, options);
        return records.map(record => this.create(record as Psp37AccountProps));
    }

    static create(record: Psp37AccountProps): Psp37Account {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new this(
            record.id,
            record.contractId,
            record.tokenId,
            record.accountId,
            record.balance,
        );
        Object.assign(entity,record);
        return entity;
    }
}
