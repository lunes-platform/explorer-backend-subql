import { SubstrateEvent } from "@subql/types";
import { StakingPosition, StakingReward } from "../types";

export async function handleStakingEvent(
  blockNumber: bigint,
  eventIndex: number,
  event: SubstrateEvent
): Promise<void> {
  const { event: { section, method, data } } = event;
  const timestamp = event.block.timestamp;
  
  logger.info(`Handling staking event: ${section}.${method}`);
  
  try {
    // Bonded - Stake created or increased
    if (method === "Bonded") {
      const [stash, amount] = data;
      const stashAddress = stash.toString();
      const stakeAmount = BigInt(amount.toString());
      
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
      logger.info(`Bonded: ${stashAddress} staked ${stakeAmount}`);
    }
    
    // Unbonded - Stake removed (starts unbonding period)
    else if (method === "Unbonded") {
      const [stash, amount] = data;
      const stashAddress = stash.toString();
      const unbondAmount = BigInt(amount.toString());
      
      const position = await StakingPosition.get(stashAddress);
      
      if (position) {
        position.unbondingAmount = unbondAmount;
        position.unbondingEnd = BigInt(timestamp?.getTime() || 0) + BigInt(28 * 24 * 60 * 60 * 1000); // 28 days
        position.status = "Unbonding";
        await position.save();
        logger.info(`Unbonded: ${stashAddress} unbonding ${unbondAmount}`);
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
        logger.info(`Withdrawn: ${stashAddress} withdrew ${withdrawAmount}`);
      }
    }
    
    // Rewarded - Staking reward paid
    else if (method === "Rewarded") {
      const [stash, amount] = data;
      const stashAddress = stash.toString();
      const rewardAmount = BigInt(amount.toString());
      
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
      logger.info(`Rewarded: ${stashAddress} received ${rewardAmount}`);
    }
    
    // Slashed - Validator slashed (punishment)
    else if (method === "Slashed") {
      const [validator, amount] = data;
      const validatorAddress = validator.toString();
      const slashAmount = BigInt(amount.toString());
      
      logger.warn(`Slashed: ${validatorAddress} slashed ${slashAmount}`);
    }
    
  } catch (error) {
    logger.error(`Error handling staking event ${method}: ${error}`);
  }
}
