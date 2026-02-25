import { Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
export type ContractCallProps = Omit<ContractCall, NonNullable<FunctionPropertyNames<ContractCall>> | '_name'>;
export declare class ContractCall implements Entity {
    constructor(id: string, contractId: string, callerId: string, method: string, success: boolean, blockNumber: bigint, extrinsicIndex: number);
    id: string;
    contractId: string;
    callerId: string;
    method: string;
    args?: string;
    success: boolean;
    gasUsed?: bigint;
    value?: bigint;
    blockNumber: bigint;
    timestamp?: bigint;
    transactionHash?: string;
    extrinsicIndex: number;
    get _name(): string;
    save(): Promise<void>;
    static remove(id: string): Promise<void>;
    static get(id: string): Promise<ContractCall | undefined>;
    static getByContractId(contractId: string): Promise<ContractCall[] | undefined>;
    static getByCallerId(callerId: string): Promise<ContractCall[] | undefined>;
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static getByFields(filter: FieldsExpression<ContractCallProps>[], options?: GetOptions<ContractCallProps>): Promise<ContractCall[]>;
    static create(record: ContractCallProps): ContractCall;
}
