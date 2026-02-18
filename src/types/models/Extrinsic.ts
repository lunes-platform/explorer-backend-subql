// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';



export type ExtrinsicProps = Omit<Extrinsic, NonNullable<FunctionPropertyNames<Extrinsic>>| '_name'>;

export class Extrinsic implements Entity {

    constructor(
        
        id: string,
        blockNumber: bigint,
        extrinsicIndex: number,
        isSigned: boolean,
        method: string,
        section: string,
        success: boolean,
    ) {
        this.id = id;
        this.blockNumber = blockNumber;
        this.extrinsicIndex = extrinsicIndex;
        this.isSigned = isSigned;
        this.method = method;
        this.section = section;
        this.success = success;
        
    }

    public id: string;
    public blockNumber: bigint;
    public extrinsicIndex: number;
    public isSigned: boolean;
    public method: string;
    public section: string;
    public signer?: string;
    public signature?: string;
    public tip?: bigint;
    public fee?: bigint;
    public success: boolean;
    public contractId?: string;
    

    get _name(): string {
        return 'Extrinsic';
    }

    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save Extrinsic entity without an ID");
        await store.set('Extrinsic', id.toString(), this);
    }

    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove Extrinsic entity without an ID");
        await store.remove('Extrinsic', id.toString());
    }

    static async get(id:string): Promise<Extrinsic | undefined>{
        assert((id !== null && id !== undefined), "Cannot get Extrinsic entity without an ID");
        const record = await store.get('Extrinsic', id.toString());
        if (record) {
            return this.create(record as ExtrinsicProps);
        } else {
            return;
        }
    }

    static async getByContractId(contractId: string): Promise<Extrinsic[] | undefined>{
      const records = await store.getByField('Extrinsic', 'contractId', contractId);
      return records.map(record => this.create(record as ExtrinsicProps));
    }


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<ExtrinsicProps>[], options?: GetOptions<ExtrinsicProps>): Promise<Extrinsic[]> {
        const records = await store.getByFields('Extrinsic', filter, options);
        return records.map(record => this.create(record as ExtrinsicProps));
    }

    static create(record: ExtrinsicProps): Extrinsic {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new this(
            record.id,
            record.blockNumber,
            record.extrinsicIndex,
            record.isSigned,
            record.method,
            record.section,
            record.success,
        );
        Object.assign(entity,record);
        return entity;
    }
}
