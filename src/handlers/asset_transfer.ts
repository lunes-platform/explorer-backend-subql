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
  logger.info(
    `AssetTransfer ${amount} }`,
  );
  await ensureAsset(assetId.toString());
  let entity = AssetTransfer.create({
    id: `${blockNumber.toString()}-${index.toString()}`,
    blockId: blockNumber.toString(),
    blockNumber: blockNumber,
    eventIndex: index,
    assetId: assetId.toString(),
    from: from.toString(),
    to: to.toString(),
    amount: (amount as Balance).toBigInt()
  });
  entity.save();
  try {
    const data_from = await api.query.assets.account(assetId, from.toString());
    let data_: any = data_from.toHuman();
    logger.info(
      `AssetAccount ${data_}}`,
    );
    logger.info(
      `AssetAccount ${BigInt(data_.balance.toString().replace(/,/g, ''))} }`,
    );
    const balanceFrom = BigInt(data_.balance.toString().replace(/,/g, ''))
    ensureAccountAsset(from.toString(), balanceFrom, assetId.toString());
    const data_to = await api.query.assets.account(assetId, to.toString());
    data_ = data_to.toHuman();
    const balanceTo = BigInt(data_.balance.toString().replace(/,/g, ''))
    ensureAccountAsset(to.toString(), balanceTo, assetId.toString());

  } catch (error) {
    logger.info(
      `AssetTransfer ${error} }`,
    );
  }
  return entity;
}