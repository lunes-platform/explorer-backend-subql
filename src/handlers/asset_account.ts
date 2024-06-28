import { AssetAccount } from "../types";

export async function ensureAccountAsset(accountID: string, balance: bigint, assetId: number): Promise<void> {
  let ID = `${accountID.toString()}-${assetId.toString()}`;
  let entity = await AssetAccount.get(ID);

  if (!entity) {
    entity = new AssetAccount(ID, accountID, assetId, balance);
  } else {
    entity.balance = balance;
  }
  await entity.save();



}