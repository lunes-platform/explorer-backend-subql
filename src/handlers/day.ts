import { Day } from "../types";

export async function updateDay(
  timestamp: Date,
  newExtrinsics: number,
  newEvents: number,
  newTransfers: number,
  newTransferAmount: bigint
): Promise<void> {
  const recordId = timestamp.toISOString().slice(0, 10);
  let entity = await Day.get(recordId);
  if (!entity) {
    entity = Day.create({
      id: recordId,
      year: timestamp.getFullYear(),
      month: timestamp.getMonth(),
      date: timestamp.getDate(),
      extrinsics: 0,
      events: 0,
      transferCount: 0,
      transferAmount: BigInt(0),
    });
  }
  entity.extrinsics += newExtrinsics;
  entity.events += newEvents;
  entity.transferCount += newTransfers;
  entity.transferAmount += newTransferAmount;

  await entity.save();
}