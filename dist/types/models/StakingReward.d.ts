import { Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
export type StakingRewardProps = Omit<StakingReward, NonNullable<FunctionPropertyNames<StakingReward>> | '_name'>;
export declare class StakingReward implements Entity {
    constructor(id: string, accountId: string, amount: bigint, blockNumber: bigint, timestamp: bigint, type: string);
    id: string;
    accountId: string;
    amount: bigint;
    blockNumber: bigint;
    timestamp: bigint;
    type: string;
    get _name(): string;
    save(): Promise<void>;
    static remove(id: string): Promise<void>;
    static get(id: string): Promise<StakingReward | undefined>;
    static getByAccountId(accountId: string): Promise<StakingReward[] | undefined>;
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static getByFields(filter: FieldsExpression<StakingRewardProps>[], options?: GetOptions<StakingRewardProps>): Promise<StakingReward[]>;
    static create(record: StakingRewardProps): StakingReward;
}
