import { Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
export type EventProps = Omit<Event, NonNullable<FunctionPropertyNames<Event>> | '_name'>;
export declare class Event implements Entity {
    constructor(id: string, blockNumber: bigint, eventIndex: number, section: string, method: string, data: string);
    id: string;
    blockNumber: bigint;
    eventIndex: number;
    section: string;
    method: string;
    data: string;
    contractId?: string;
    get _name(): string;
    save(): Promise<void>;
    static remove(id: string): Promise<void>;
    static get(id: string): Promise<Event | undefined>;
    static getByContractId(contractId: string): Promise<Event[] | undefined>;
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static getByFields(filter: FieldsExpression<EventProps>[], options?: GetOptions<EventProps>): Promise<Event[]>;
    static create(record: EventProps): Event;
}
