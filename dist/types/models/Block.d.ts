import { Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
export type BlockProps = Omit<Block, NonNullable<FunctionPropertyNames<Block>> | '_name'>;
export declare class Block implements Entity {
    constructor(id: string, number: bigint, hash: string, parentHash: string);
    id: string;
    number: bigint;
    timestamp?: bigint;
    hash: string;
    parentHash: string;
    specVersion?: number;
    get _name(): string;
    save(): Promise<void>;
    static remove(id: string): Promise<void>;
    static get(id: string): Promise<Block | undefined>;
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static getByFields(filter: FieldsExpression<BlockProps>[], options?: GetOptions<BlockProps>): Promise<Block[]>;
    static create(record: BlockProps): Block;
}
