import { Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
export type DailyStatsProps = Omit<DailyStats, NonNullable<FunctionPropertyNames<DailyStats>> | '_name'>;
export declare class DailyStats implements Entity {
    constructor(id: string, date: Date, transfersCount: number, totalVolume: bigint, uniqueAccounts: number, contractCalls: number, psp22Transfers: number, psp34Transfers: number, psp37Transfers: number, newContracts: number);
    id: string;
    date: Date;
    transfersCount: number;
    totalVolume: bigint;
    uniqueAccounts: number;
    contractCalls: number;
    psp22Transfers: number;
    psp34Transfers: number;
    psp37Transfers: number;
    newContracts: number;
    get _name(): string;
    save(): Promise<void>;
    static remove(id: string): Promise<void>;
    static get(id: string): Promise<DailyStats | undefined>;
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static getByFields(filter: FieldsExpression<DailyStatsProps>[], options?: GetOptions<DailyStatsProps>): Promise<DailyStats[]>;
    static create(record: DailyStatsProps): DailyStats;
}
