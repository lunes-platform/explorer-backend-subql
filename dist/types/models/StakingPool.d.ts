import { Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
export type StakingPoolProps = Omit<StakingPool, NonNullable<FunctionPropertyNames<StakingPool>> | '_name'>;
export declare class StakingPool implements Entity {
    constructor(id: string, name: string, totalStaked: bigint, totalRewards: bigint, apy: number, minStake: bigint, participantCount: number, createdAt: bigint, status: string);
    id: string;
    name: string;
    totalStaked: bigint;
    totalRewards: bigint;
    apy: number;
    lockPeriod?: number;
    minStake: bigint;
    maxStake?: bigint;
    participantCount: number;
    createdAt: bigint;
    status: string;
    get _name(): string;
    save(): Promise<void>;
    static remove(id: string): Promise<void>;
    static get(id: string): Promise<StakingPool | undefined>;
    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static getByFields(filter: FieldsExpression<StakingPoolProps>[], options?: GetOptions<StakingPoolProps>): Promise<StakingPool[]>;
    static create(record: StakingPoolProps): StakingPool;
}
