import { Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
export type Psp34TransferProps = Omit<Psp34Transfer, NonNullable<FunctionPropertyNames<Psp34Transfer>> | '_name'>;
export declare class Psp34Transfer implements Entity {
    constructor(id: string, collectionId: string, toId: string, blockNumber: bigint, eventIndex: number);
    id: string;
    collectionId: string;
    tokenId?: string;
    fromId?: string;
    toId: string;
    blockNumber: bigint;
    timestamp?: bigint;
    transactionHash?: string;
    eventIndex: number;
    get _name(): string;
    save(): Promise<void>;
    static remove(id: string): Promise<void>;
    static get(id: string): Promise<Psp34Transfer | undefined>;
    static getByCollectionId(collectionId: string): Promise<Psp34Transfer[] | undefined>;
    static getByTokenId(tokenId: string): Promise<Psp34Transfer[] | undefined>;
    static getByFromId(fromId: string): Promise<Psp34Transfer[] | undefined>;
    static getByToId(toId: string): Promise<Psp34Transfer[] | undefined>;
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static getByFields(filter: FieldsExpression<Psp34TransferProps>[], options?: GetOptions<Psp34TransferProps>): Promise<Psp34Transfer[]>;
    static create(record: Psp34TransferProps): Psp34Transfer;
}
