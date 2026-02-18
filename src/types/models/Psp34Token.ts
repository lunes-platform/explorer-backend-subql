// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';



export type Psp34TokenProps = Omit<Psp34Token, NonNullable<FunctionPropertyNames<Psp34Token>>| '_name'>;

export class Psp34Token implements Entity {

    constructor(
        
        id: string,
        collectionId: string,
        tokenId: string,
    ) {
        this.id = id;
        this.collectionId = collectionId;
        this.tokenId = tokenId;
        
    }

    public id: string;
    public collectionId: string;
    public tokenId: string;
    public ownerId?: string;
    public metadata?: string;
    public tokenUri?: string;
    public mintedAt?: bigint;
    public mintedAtBlock?: bigint;
    

    get _name(): string {
        return 'Psp34Token';
    }

    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save Psp34Token entity without an ID");
        await store.set('Psp34Token', id.toString(), this);
    }

    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove Psp34Token entity without an ID");
        await store.remove('Psp34Token', id.toString());
    }

    static async get(id:string): Promise<Psp34Token | undefined>{
        assert((id !== null && id !== undefined), "Cannot get Psp34Token entity without an ID");
        const record = await store.get('Psp34Token', id.toString());
        if (record) {
            return this.create(record as Psp34TokenProps);
        } else {
            return;
        }
    }

    static async getByCollectionId(collectionId: string): Promise<Psp34Token[] | undefined>{
      const records = await store.getByField('Psp34Token', 'collectionId', collectionId);
      return records.map(record => this.create(record as Psp34TokenProps));
    }

    static async getByOwnerId(ownerId: string): Promise<Psp34Token[] | undefined>{
      const records = await store.getByField('Psp34Token', 'ownerId', ownerId);
      return records.map(record => this.create(record as Psp34TokenProps));
    }


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<Psp34TokenProps>[], options?: GetOptions<Psp34TokenProps>): Promise<Psp34Token[]> {
        const records = await store.getByFields('Psp34Token', filter, options);
        return records.map(record => this.create(record as Psp34TokenProps));
    }

    static create(record: Psp34TokenProps): Psp34Token {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new this(
            record.id,
            record.collectionId,
            record.tokenId,
        );
        Object.assign(entity,record);
        return entity;
    }
}
