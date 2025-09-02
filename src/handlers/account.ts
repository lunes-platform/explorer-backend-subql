import { Account } from "../types";

export async function ensureAccount(accountID: string, balance: bigint): Promise<void> {
  let entity = await Account.get(accountID);
  if (!entity) {
    entity = new Account(accountID, balance, 0, 0);
  } else {
    entity.balance = balance;
  }
  await entity.save();
}