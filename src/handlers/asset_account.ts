import { AssetAccount } from "../types";

export async function ensureAccountAsset(accountID: string, balance: bigint, assetId: string): Promise<void> {
  const ID = `${accountID}-${assetId}`;
  let entity = await AssetAccount.get(ID);

  if (!entity) {
    entity = new AssetAccount(ID, assetId, accountID, balance);
    await entity.save();
  } else if (balance > BigInt(0)) {
    // Only update if we have a real balance — never overwrite with 0
    entity.balance = balance;
    await entity.save();
  }
}