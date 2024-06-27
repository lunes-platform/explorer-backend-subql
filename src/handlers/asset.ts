import { AssetTransfer } from "../types";
import { EventRecord, Balance } from "@polkadot/types/interfaces";

export function createAssetTransfer(
  blockNumber: bigint,
  index: number,
  event: EventRecord
): AssetTransfer {
  const {
    event: {
      data: [from, to, balance, assetId],
    },
  } = event;
  let entity = AssetTransfer.create({
    id: `${blockNumber.toString()}-${index.toString()}`,
    blockId: blockNumber.toString(),
    blockNumber: blockNumber,
    eventIndex: index,
    assetId: Number(assetId),
    from: from.toString(),
    to: to.toString(),
    amount: (balance as Balance).toBigInt()
  });
  entity.save();
  return entity;
}