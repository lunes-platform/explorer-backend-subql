import { AssetTransfer } from "../types";
import { EventRecord, Balance } from "@polkadot/types/interfaces";
import { ensureAccountAsset } from "./asset_account";
import { ensureAsset } from "./asset";

export async function createAssetTransfer(
  blockNumber: bigint,
  index: number,
  event: EventRecord
): Promise<AssetTransfer> {
  const {
    event: {
      data: [assetId, from, to, amount],
    },
  } = event;

  const assetIdStr = assetId.toString();
  const fromStr = from.toString();
  const toStr = to.toString();
  const transferAmount = (amount as Balance).toBigInt();

  await ensureAsset(assetIdStr);

  const entity = AssetTransfer.create({
    id: `${blockNumber}-${index}`,
    assetId: assetIdStr,
    fromId: fromStr,
    toId: toStr,
    amount: transferAmount,
    blockNumber,
    eventIndex: index,
  });
  entity.save();

  // Register from/to as AssetAccount holders with placeholder balance (0).
  // The actual balance is unknown without an RPC call — which we avoid here
  // to prevent timeouts. The balance gets corrected by assets.Issued events.
  // We use fire-and-forget (no await) so this never blocks block processing.
  ensureAccountAsset(fromStr, BigInt(0), assetIdStr);
  ensureAccountAsset(toStr, BigInt(0), assetIdStr);

  return entity;
}