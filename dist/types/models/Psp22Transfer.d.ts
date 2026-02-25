import { Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
export type Psp22TransferProps = Omit<Psp22Transfer, NonNullable<FunctionPropertyNames<Psp22Transfer>> | '_name'>;
export declare class Psp22Transfer implements Entity {
    constructor(id: string, tokenId: string, fromId: string, toId: string, amount: bigint, blockNumber: bigint, eventIndex: number);
    id: string;
    tokenId: string;
    fromId: string;
    toId: string;
    amount: bigint;
    blockNumber: bigint;
    timestamp?: bigint;
    transactionHash?: string;
    eventIndex: number;
    get _name(): string;
    save(): Promise<void>;
    static remove(id: string): Promise<void>;
    static get(id: string): Promise<Psp22Transfer | undefined>;
    static getByTokenId(tokenId: string): Promise<Psp22Transfer[] | undefined>;
    static getByFromId(fromId: string): Promise<Psp22Transfer[] | undefined>;
    static getByToId(toId: string): Promise<Psp22Transfer[] | undefined>;
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static getByFields(filter: FieldsExpression<Psp22TransferProps>[], options?: GetOptions<Psp22TransferProps>): Promise<Psp22Transfer[]>;
    static create(record: Psp22TransferProps): Psp22Transfer;
}
