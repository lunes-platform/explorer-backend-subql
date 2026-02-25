import { Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
export type StakingPositionProps = Omit<StakingPosition, NonNullable<FunctionPropertyNames<StakingPosition>> | '_name'>;
export declare class StakingPosition implements Entity {
    constructor(id: string, accountId: string, stakedAmount: bigint, rewards: bigint, stakedAt: bigint, status: string);
    id: string;
    accountId: string;
    stakedAmount: bigint;
    rewards: bigint;
    apy?: number;
    lastClaimedAt?: bigint;
    stakedAt: bigint;
    lockPeriod?: number;
    status: string;
    unbondingAmount?: bigint;
    unbondingEnd?: bigint;
    get _name(): string;
    save(): Promise<void>;
    static remove(id: string): Promise<void>;
    static get(id: string): Promise<StakingPosition | undefined>;
    static getByAccountId(accountId: string): Promise<StakingPosition[] | undefined>;
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static getByFields(filter: FieldsExpression<StakingPositionProps>[], options?: GetOptions<StakingPositionProps>): Promise<StakingPosition[]>;
    static create(record: StakingPositionProps): StakingPosition;
}
