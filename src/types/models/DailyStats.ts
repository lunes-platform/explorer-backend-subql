// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';



export type DailyStatsProps = Omit<DailyStats, NonNullable<FunctionPropertyNames<DailyStats>>| '_name'>;

export class DailyStats implements Entity {

    constructor(
        
        id: string,
        date: Date,
        transfersCount: number,
        totalVolume: bigint,
        uniqueAccounts: number,
        contractCalls: number,
        psp22Transfers: number,
        psp34Transfers: number,
        psp37Transfers: number,
        newContracts: number,
    ) {
        this.id = id;
        this.date = date;
        this.transfersCount = transfersCount;
        this.totalVolume = totalVolume;
        this.uniqueAccounts = uniqueAccounts;
        this.contractCalls = contractCalls;
        this.psp22Transfers = psp22Transfers;
        this.psp34Transfers = psp34Transfers;
        this.psp37Transfers = psp37Transfers;
        this.newContracts = newContracts;
        
    }

    public id: string;
    public date: Date;
    public transfersCount: number;
    public totalVolume: bigint;
    public uniqueAccounts: number;
    public contractCalls: number;
    public psp22Transfers: number;
    public psp34Transfers: number;
    public psp37Transfers: number;
    public newContracts: number;
    

    get _name(): string {
        return 'DailyStats';
    }

    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save DailyStats entity without an ID");
        await store.set('DailyStats', id.toString(), this);
    }

    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove DailyStats entity without an ID");
        await store.remove('DailyStats', id.toString());
    }

    static async get(id:string): Promise<DailyStats | undefined>{
        assert((id !== null && id !== undefined), "Cannot get DailyStats entity without an ID");
        const record = await store.get('DailyStats', id.toString());
        if (record) {
            return this.create(record as DailyStatsProps);
        } else {
            return;
        }
    }


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<DailyStatsProps>[], options?: GetOptions<DailyStatsProps>): Promise<DailyStats[]> {
        const records = await store.getByFields('DailyStats', filter, options);
        return records.map(record => this.create(record as DailyStatsProps));
    }

    static create(record: DailyStatsProps): DailyStats {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new this(
            record.id,
            record.date,
            record.transfersCount,
            record.totalVolume,
            record.uniqueAccounts,
            record.contractCalls,
            record.psp22Transfers,
            record.psp34Transfers,
            record.psp37Transfers,
            record.newContracts,
        );
        Object.assign(entity,record);
        return entity;
    }
}
