import { Transfer } from "../types";
import { EventRecord, Balance } from "@polkadot/types/interfaces";

export function createTransfer(
  blockNumber: bigint,
  index: number,
  event: EventRecord,
  blockTimestamp?: Date
): Transfer {
  const {
    event: {
      data: [fromId, toId, balance],
    },
  } = event;

  let entity = Transfer.create({
    id: `${blockNumber.toString()}-${index.toString()}`,
    fromId: fromId.toString(),
    toId: toId.toString(),
    amount: (balance as Balance).toBigInt(),
    value: (balance as Balance).toBigInt(),
    blockId: blockNumber.toString(),
    blockNumber: blockNumber,
    eventIndex: index,
    ...(blockTimestamp
      ? {
          timestamp: BigInt(blockTimestamp.getTime()),
          date: blockTimestamp,
        }
      : {}),
  });
  entity.save();
  return entity;  
}