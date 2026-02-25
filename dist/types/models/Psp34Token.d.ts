import { Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
export type Psp34TokenProps = Omit<Psp34Token, NonNullable<FunctionPropertyNames<Psp34Token>> | '_name'>;
export declare class Psp34Token implements Entity {
    constructor(id: string, collectionId: string, tokenId: string);
    id: string;
    collectionId: string;
    tokenId: string;
    ownerId?: string;
    metadata?: string;
    tokenUri?: string;
    mintedAt?: bigint;
    mintedAtBlock?: bigint;
    get _name(): string;
    save(): Promise<void>;
    static remove(id: string): Promise<void>;
    static get(id: string): Promise<Psp34Token | undefined>;
    static getByCollectionId(collectionId: string): Promise<Psp34Token[] | undefined>;
    static getByOwnerId(ownerId: string): Promise<Psp34Token[] | undefined>;
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static getByFields(filter: FieldsExpression<Psp34TokenProps>[], options?: GetOptions<Psp34TokenProps>): Promise<Psp34Token[]>;
    static create(record: Psp34TokenProps): Psp34Token;
}
