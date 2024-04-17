import { Transfer } from "../types";
import { EventRecord, Balance } from "@polkadot/types/interfaces";

export function createTransfer(
  blockNumber: bigint,
  index: number,
  event: EventRecord
): Transfer {
  const {
    event: {
      data: [fromId, toId, balance],
    },
  } = event;

  let entity = Transfer.create({
    id: `${blockNumber.toString()}-${index.toString()}`,
    fromId: fromId.toString().toLowerCase(),
    toId: toId.toString().toLowerCase(),
    value: (balance as Balance).toBigInt(),
    blockId: blockNumber.toString(),
    blockNumber: blockNumber,
    eventIndex: index,
  });
  entity.save();
  return entity;  
}