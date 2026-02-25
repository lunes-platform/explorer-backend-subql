import { Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
export type TransferProps = Omit<Transfer, NonNullable<FunctionPropertyNames<Transfer>> | '_name'>;
export declare class Transfer implements Entity {
    constructor(id: string, fromId: string, toId: string, amount: bigint, value: bigint, blockId: string, blockNumber: bigint, eventIndex: number);
    id: string;
    fromId: string;
    toId: string;
    amount: bigint;
    value: bigint;
    blockId: string;
    blockNumber: bigint;
    eventIndex: number;
    timestamp?: bigint;
    date?: Date;
    get _name(): string;
    save(): Promise<void>;
    static remove(id: string): Promise<void>;
    static get(id: string): Promise<Transfer | undefined>;
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static getByFields(filter: FieldsExpression<TransferProps>[], options?: GetOptions<TransferProps>): Promise<Transfer[]>;
    static create(record: TransferProps): Transfer;
}
