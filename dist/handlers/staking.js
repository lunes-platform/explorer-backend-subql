"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleStakingEvent = void 0;
const types_1 = require("../types");
const account_1 = require("./account");
async function handleStakingEvent(blockNumber, eventIndex, event) {
    const { event: { section, method, data } } = event;
    const timestamp = event.block.timestamp;
    try {
        // Bonded - Stake created or increased
        if (method === "Bonded") {
            const [stash, amount] = data;
            const stashAddress = stash.toString();
            const stakeAmount = BigInt(amount.toString());
            // Ensure account exists before creating staking position
            await (0, account_1.ensureAccount)(stashAddress, BigInt(0));
            // Get or create staking position
            let position = await types_1.StakingPosition.get(stashAddress);
            if (!position) {
                position = types_1.StakingPosition.create({
                    id: stashAddress,
                    accountId: stashAddress,
                    stakedAmount: stakeAmount,
                    rewards: BigInt(0),
                    status: "Active",
                    stakedAt: BigInt((timestamp === null || timestamp === void 0 ? void 0 : timestamp.getTime()) || 0),
                });
            }
            else {
                position.stakedAmount += stakeAmount;
            }
            await position.save();
        }
        // Unbonded - Stake removed (starts unbonding period)
        else if (method === "Unbonded") {
            const [stash, amount] = data;
            const stashAddress = stash.toString();
            const unbondAmount = BigInt(amount.toString());
            await (0, account_1.ensureAccount)(stashAddress, BigInt(0));
            const position = await types_1.StakingPosition.get(stashAddress);
            if (position) {
                position.unbondingAmount = unbondAmount;
                position.unbondingEnd = BigInt((timestamp === null || timestamp === void 0 ? void 0 : timestamp.getTime()) || 0) + BigInt(28 * 24 * 60 * 60 * 1000); // 28 days
                position.status = "Unbonding";
                await position.save();
            }
        }
        // Withdrawn - Unbonded amount withdrawn
        else if (method === "Withdrawn") {
            const [stash, amount] = data;
            const stashAddress = stash.toString();
            const withdrawAmount = BigInt(amount.toString());
            const position = await types_1.StakingPosition.get(stashAddress);
            if (position) {
                position.stakedAmount -= withdrawAmount;
                position.unbondingAmount = BigInt(0);
                position.unbondingEnd = undefined;
                if (position.stakedAmount <= BigInt(0)) {
                    position.status = "Withdrawable";
                }
                else {
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
            await (0, account_1.ensureAccount)(stashAddress, BigInt(0));
            // Update position rewards
            const position = await types_1.StakingPosition.get(stashAddress);
            if (position) {
                position.rewards += rewardAmount;
                position.lastClaimedAt = BigInt((timestamp === null || timestamp === void 0 ? void 0 : timestamp.getTime()) || 0);
                await position.save();
            }
            // Create reward record
            const reward = types_1.StakingReward.create({
                id: `${blockNumber}-${eventIndex}`,
                accountId: stashAddress,
                amount: rewardAmount,
                blockNumber: blockNumber,
                timestamp: BigInt((timestamp === null || timestamp === void 0 ? void 0 : timestamp.getTime()) || 0),
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
    }
    catch (error) {
        logger.error(`Error handling staking event ${method}: ${error}`);
    }
}
exports.handleStakingEvent = handleStakingEvent;
