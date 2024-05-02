import { Deposit } from "../types";
import { EventRecord, Balance } from "@polkadot/types/interfaces";

export function createDeposit(
  blockNumber: bigint,
  index: number,
  event: EventRecord
): Deposit {
  logger.info(
    `createDeposit fee ${blockNumber} }`,
  );
  const {
    event: {
      data: [who, amount],
    },
  } = event;

  let entity = Deposit.create({
    id: `${blockNumber.toString()}-${index.toString()}`,
    toId: who.toString(),
    value: (amount as Balance).toBigInt(),
    blockId: blockNumber.toString(),
    blockNumber: blockNumber,
    eventIndex: index,
  });
  entity.save();
  return entity;  
}