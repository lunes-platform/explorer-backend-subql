import { Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
export type Psp37TransferProps = Omit<Psp37Transfer, NonNullable<FunctionPropertyNames<Psp37Transfer>> | '_name'>;
export declare class Psp37Transfer implements Entity {
    constructor(id: string, contractId: string, tokenId: string, toId: string, amount: bigint, blockNumber: bigint, eventIndex: number);
    id: string;
    contractId: string;
    tokenId: string;
    fromId?: string;
    toId: string;
    amount: bigint;
    blockNumber: bigint;
    timestamp?: bigint;
    transactionHash?: string;
    eventIndex: number;
    get _name(): string;
    save(): Promise<void>;
    static remove(id: string): Promise<void>;
    static get(id: string): Promise<Psp37Transfer | undefined>;
    static getByContractId(contractId: string): Promise<Psp37Transfer[] | undefined>;
    static getByTokenId(tokenId: string): Promise<Psp37Transfer[] | undefined>;
    static getByFromId(fromId: string): Promise<Psp37Transfer[] | undefined>;
    static getByToId(toId: string): Promise<Psp37Transfer[] | undefined>;
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static getByFields(filter: FieldsExpression<Psp37TransferProps>[], options?: GetOptions<Psp37TransferProps>): Promise<Psp37Transfer[]>;
    static create(record: Psp37TransferProps): Psp37Transfer;
}
