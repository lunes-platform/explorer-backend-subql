// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';



export type StakingPositionProps = Omit<StakingPosition, NonNullable<FunctionPropertyNames<StakingPosition>>| '_name'>;

export class StakingPosition implements Entity {

    constructor(
        
        id: string,
        accountId: string,
        stakedAmount: bigint,
        rewards: bigint,
        stakedAt: bigint,
        status: string,
    ) {
        this.id = id;
        this.accountId = accountId;
        this.stakedAmount = stakedAmount;
        this.rewards = rewards;
        this.stakedAt = stakedAt;
        this.status = status;
        
    }

    public id: string;
    public accountId: string;
    public stakedAmount: bigint;
    public rewards: bigint;
    public apy?: number;
    public lastClaimedAt?: bigint;
    public stakedAt: bigint;
    public lockPeriod?: number;
    public status: string;
    public unbondingAmount?: bigint;
    public unbondingEnd?: bigint;
    

    get _name(): string {
        return 'StakingPosition';
    }

    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save StakingPosition entity without an ID");
        await store.set('StakingPosition', id.toString(), this);
    }

    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove StakingPosition entity without an ID");
        await store.remove('StakingPosition', id.toString());
    }

    static async get(id:string): Promise<StakingPosition | undefined>{
        assert((id !== null && id !== undefined), "Cannot get StakingPosition entity without an ID");
        const record = await store.get('StakingPosition', id.toString());
        if (record) {
            return this.create(record as StakingPositionProps);
        } else {
            return;
        }
    }

    static async getByAccountId(accountId: string): Promise<StakingPosition[] | undefined>{
      const records = await store.getByField('StakingPosition', 'accountId', accountId);
      return records.map(record => this.create(record as StakingPositionProps));
    }


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<StakingPositionProps>[], options?: GetOptions<StakingPositionProps>): Promise<StakingPosition[]> {
        const records = await store.getByFields('StakingPosition', filter, options);
        return records.map(record => this.create(record as StakingPositionProps));
    }

    static create(record: StakingPositionProps): StakingPosition {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new this(
            record.id,
            record.accountId,
            record.stakedAmount,
            record.rewards,
            record.stakedAt,
            record.status,
        );
        Object.assign(entity,record);
        return entity;
    }
}
