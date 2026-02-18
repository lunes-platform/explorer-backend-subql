// Auto-generated , DO NOT EDIT
import {Entity, FunctionPropertyNames, FieldsExpression, GetOptions } from "@subql/types-core";
import assert from 'assert';



export type StakingRewardProps = Omit<StakingReward, NonNullable<FunctionPropertyNames<StakingReward>>| '_name'>;

export class StakingReward implements Entity {

    constructor(
        
        id: string,
        accountId: string,
        amount: bigint,
        blockNumber: bigint,
        timestamp: bigint,
        type: string,
    ) {
        this.id = id;
        this.accountId = accountId;
        this.amount = amount;
        this.blockNumber = blockNumber;
        this.timestamp = timestamp;
        this.type = type;
        
    }

    public id: string;
    public accountId: string;
    public amount: bigint;
    public blockNumber: bigint;
    public timestamp: bigint;
    public type: string;
    

    get _name(): string {
        return 'StakingReward';
    }

    async save(): Promise<void>{
        let id = this.id;
        assert(id !== null, "Cannot save StakingReward entity without an ID");
        await store.set('StakingReward', id.toString(), this);
    }

    static async remove(id:string): Promise<void>{
        assert(id !== null, "Cannot remove StakingReward entity without an ID");
        await store.remove('StakingReward', id.toString());
    }

    static async get(id:string): Promise<StakingReward | undefined>{
        assert((id !== null && id !== undefined), "Cannot get StakingReward entity without an ID");
        const record = await store.get('StakingReward', id.toString());
        if (record) {
            return this.create(record as StakingRewardProps);
        } else {
            return;
        }
    }

    static async getByAccountId(accountId: string): Promise<StakingReward[] | undefined>{
      const records = await store.getByField('StakingReward', 'accountId', accountId);
      return records.map(record => this.create(record as StakingRewardProps));
    }


    /**
     * Gets entities matching the specified filters and options.
     *
     * ⚠️ This function will first search cache data followed by DB data. Please consider this when using order and offset options.⚠️
     * */
    static async getByFields(filter: FieldsExpression<StakingRewardProps>[], options?: GetOptions<StakingRewardProps>): Promise<StakingReward[]> {
        const records = await store.getByFields('StakingReward', filter, options);
        return records.map(record => this.create(record as StakingRewardProps));
    }

    static create(record: StakingRewardProps): StakingReward {
        assert(typeof record.id === 'string', "id must be provided");
        let entity = new this(
            record.id,
            record.accountId,
            record.amount,
            record.blockNumber,
            record.timestamp,
            record.type,
        );
        Object.assign(entity,record);
        return entity;
    }
}
