import {
  SubstrateBlock,
} from "@subql/types";
import {
  createBlock,
  createEvent,
  createExtrinsic,
  ensureAccount,
  wrapExtrinsics,
} from "../handlers";
import { Event, Transfer } from "../types";
import { createTransfer } from "../handlers/transfer";
import { updateDay } from "../handlers/day";

export async function handleBlock(block: SubstrateBlock): Promise<void> {
  await createBlock(block);

  // Process all events in block
  const events: Event[] = block.events
    .filter(
      (evt) =>
        !(
          evt.event.section === "system" &&
          evt.event.method === "ExtrinsicSuccess"
        )
    )
    .map((evt, idx) =>
      createEvent(block.block.header.number.toBigInt(), idx, evt)
    );

  const transfers: Transfer[] = block.events
    .filter(
      (e) => e.event.section === "balances" && e.event.method === "Transfer"
    )
    .map((evt, idx) =>
      createTransfer(block.block.header.number.toBigInt(), idx, evt)
    );

  // Process all calls in block
  const extrinsics = wrapExtrinsics(block).map((ext) =>
    createExtrinsic(block.block.header.number.toBigInt(), ext)
  );

  const accountIDs = new Set<string>();
  extrinsics.map((e) => (e.signerId ? accountIDs.add(e.signerId) : null));
  transfers.map((t) => {
    accountIDs.add(t.fromId);
    accountIDs.add(t.toId);
  });

  accountIDs.forEach((id) => {
    ensureAccount(id);
  });

  // Save all data
  await Promise.all([    
    updateDay(
      block.timestamp,
      extrinsics.length,
      events.length,
      transfers.length,
      transfers.reduce((a, b) => a + b.value, BigInt(0))
    ),
  ]);
}