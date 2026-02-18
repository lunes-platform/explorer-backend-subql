// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';



export type StakingPoolProps = Omit<StakingPool, NonNullable<FunctionPropertyNames<StakingPool>>| '_name'>;

export class StakingPool implements Entity {

    constructor(
        
        id: string,
        name: string,
        totalStaked: bigint,
        totalRewards: bigint,
        apy: number,
        minStake: bigint,
        participantCount: number,
        createdAt: bigint,
        status: string,
    ) {
        this.id = id;
        this.name = name;
        this.totalStaked = totalStaked;
        this.totalRewards = totalRewards;
        this.apy = apy;
        this.minStake = minStake;
        this.participantCount = participantCount;
        this.createdAt = createdAt;
        this.status = status;
        
    }

    public id: string;
    public name: string;
    public totalStaked: bigint;
    public totalRewards: bigint;
    public apy: number;
    public lockPeriod?: number;
    public minStake: bigint;
    public maxStake?: bigint;
    public participantCount: number;
    public createdAt: bigint;
    public status: string;
    

    get _name(): string {
        return 'StakingPool';
    }

    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save StakingPool entity without an ID");
        await store.set('StakingPool', id.toString(), this);
    }

    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove StakingPool entity without an ID");
        await store.remove('StakingPool', id.toString());
    }

    static async get(id:string): Promise<StakingPool | undefined>{
        assert((id !== null && id !== undefined), "Cannot get StakingPool entity without an ID");
        const record = await store.get('StakingPool', id.toString());
        if (record) {
            return this.create(record as StakingPoolProps);
        } else {
            return;
        }
    }


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<StakingPoolProps>[], options?: GetOptions<StakingPoolProps>): Promise<StakingPool[]> {
        const records = await store.getByFields('StakingPool', filter, options);
        return records.map(record => this.create(record as StakingPoolProps));
    }

    static create(record: StakingPoolProps): StakingPool {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new this(
            record.id,
            record.name,
            record.totalStaked,
            record.totalRewards,
            record.apy,
            record.minStake,
            record.participantCount,
            record.createdAt,
            record.status,
        );
        Object.assign(entity,record);
        return entity;
    }
}
