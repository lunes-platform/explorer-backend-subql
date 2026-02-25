import { Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
export type ContractEventProps = Omit<ContractEvent, NonNullable<FunctionPropertyNames<ContractEvent>> | '_name'>;
export declare class ContractEvent implements Entity {
    constructor(id: string, eventName: string, eventData: string, blockNumber: bigint, eventIndex: number);
    id: string;
    contractId?: string;
    eventName: string;
    eventData: string;
    blockNumber: bigint;
    timestamp?: bigint;
    transactionHash?: string;
    eventIndex: number;
    get _name(): string;
    save(): Promise<void>;
    static remove(id: string): Promise<void>;
    static get(id: string): Promise<ContractEvent | undefined>;
    static getByContractId(contractId: string): Promise<ContractEvent[] | undefined>;
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static getByFields(filter: FieldsExpression<ContractEventProps>[], options?: GetOptions<ContractEventProps>): Promise<ContractEvent[]>;
    static create(record: ContractEventProps): ContractEvent;
}
