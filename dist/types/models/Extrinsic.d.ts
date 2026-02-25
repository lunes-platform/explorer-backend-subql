import { Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
export type ExtrinsicProps = Omit<Extrinsic, NonNullable<FunctionPropertyNames<Extrinsic>> | '_name'>;
export declare class Extrinsic implements Entity {
    constructor(id: string, blockNumber: bigint, extrinsicIndex: number, isSigned: boolean, method: string, section: string, success: boolean);
    id: string;
    blockNumber: bigint;
    extrinsicIndex: number;
    isSigned: boolean;
    method: string;
    section: string;
    signer?: string;
    signature?: string;
    tip?: bigint;
    fee?: bigint;
    success: boolean;
    contractId?: string;
    get _name(): string;
    save(): Promise<void>;
    static remove(id: string): Promise<void>;
    static get(id: string): Promise<Extrinsic | undefined>;
    static getByContractId(contractId: string): Promise<Extrinsic[] | undefined>;
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static getByFields(filter: FieldsExpression<ExtrinsicProps>[], options?: GetOptions<ExtrinsicProps>): Promise<Extrinsic[]>;
    static create(record: ExtrinsicProps): Extrinsic;
}
