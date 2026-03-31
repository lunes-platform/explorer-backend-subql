import { SubstrateEvent } from "@subql/types";
import { StakingPosition, StakingReward } from "../types";
import { ensureAccount } from "./account";

export async function handleStakingEvent(
  blockNumber: bigint,
  eventIndex: number,
  event: SubstrateEvent
): Promise<void> {
  const { event: { section, method, data } } = event;
  const timestamp = event.block.timestamp;
  
  
  try {
    // Bonded - Stake created or increased
    if (method === "Bonded") {
      const [stash, amount] = data;
      const stashAddress = stash.toString();
      const stakeAmount = BigInt(amount.toString());
      
      // Ensure account exists before creating staking position
      await ensureAccount(stashAddress, BigInt(0));
      
      // Get or create staking position
      let position = await StakingPosition.get(stashAddress);
      
      if (!position) {
        position = StakingPosition.create({
          id: stashAddress,
          accountId: stashAddress,
          stakedAmount: stakeAmount,
          rewards: BigInt(0),
          status: "Active",
          stakedAt: BigInt(timestamp?.getTime() || 0),
        });
      } else {
        position.stakedAmount += stakeAmount;
      }
      
      await position.save();
    }
    
    // Unbonded - Stake removed (starts unbonding period)
    else if (method === "Unbonded") {
      const [stash, amount] = data;
      const stashAddress = stash.toString();
      const unbondAmount = BigInt(amount.toString());
      
      await ensureAccount(stashAddress, BigInt(0));
      const position = await StakingPosition.get(stashAddress);
      
      if (position) {
        position.unbondingAmount = unbondAmount;
        position.unbondingEnd = BigInt(timestamp?.getTime() || 0) + BigInt(28 * 24 * 60 * 60 * 1000); // 28 days
        position.status = "Unbonding";
        await position.save();
      }
    }
    
    // Withdrawn - Unbonded amount withdrawn
    else if (method === "Withdrawn") {
      const [stash, amount] = data;
      const stashAddress = stash.toString();
      const withdrawAmount = BigInt(amount.toString());
      
      const position = await StakingPosition.get(stashAddress);
      
      if (position) {
        position.stakedAmount -= withdrawAmount;
        position.unbondingAmount = BigInt(0);
        position.unbondingEnd = undefined;
        
        if (position.stakedAmount <= BigInt(0)) {
          position.status = "Withdrawable";
        } else {
          position.status = "Active";
        }
        
        await position.save();
      }
    }
    
    // Rewarded - Staking reward paid
    else if (method === "Rewarded") {
      const [stash, amount] = data;
      const stashAddress = stash.toString();
      const rewardAmount = BigInt(amount.toString());
      
      await ensureAccount(stashAddress, BigInt(0));
      // Update position rewards
      const position = await StakingPosition.get(stashAddress);
      if (position) {
        position.rewards += rewardAmount;
        position.lastClaimedAt = BigInt(timestamp?.getTime() || 0);
        await position.save();
      }
      
      // Create reward record
      const reward = StakingReward.create({
        id: `${blockNumber}-${eventIndex}`,
        accountId: stashAddress,
        amount: rewardAmount,
        blockNumber: blockNumber,
        timestamp: BigInt(timestamp?.getTime() || 0),
        type: "Era",
      });
      
      await reward.save();
    }
    
    // Slashed - Validator slashed (punishment)
    else if (method === "Slashed") {
      const [validator, amount] = data;
      const validatorAddress = validator.toString();
      const slashAmount = BigInt(amount.toString());
      
      // Slashed event logged only
    }
    
  } catch (error) {
    logger.error(`Error handling staking event ${method}: ${error}`);
  }
}
