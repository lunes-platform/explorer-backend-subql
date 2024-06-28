import { Account } from "../types";

export async function ensureAccount(accountID: string, balance: bigint): Promise<void> {
  accountID = accountID;
  let entity = await Account.get(accountID);
  if (!entity) {
    entity = new Account(accountID, balance);
  } else {
    entity.balance = balance;
  }
  await entity.save();
}