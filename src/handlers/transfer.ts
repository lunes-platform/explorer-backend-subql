import { SubstrateEvent } from "@subql/types";
import { Transfer } from "../types";
import { ensureAccount } from "./account";
import { ensureBlock } from "./block";
import { addTransferToDay } from "./day";
import { Balance } from "@polkadot/types/interfaces";
import assert from 'assert';

export async function createTransfer(event: SubstrateEvent): Promise<void> {
  logger.info(
    `New transfer event found at block ${event.block.block.header.number.toString()}`,
  );
  try {
    // Get data from the event
    // The balances.transfer event has the following payload \[from, to, value\]
    // logger.info(JSON.stringify(event));
    const {
      event: {
        data: [to, amount],
      },
    } = event;

    const from = event.extrinsic?.extrinsic.signer;
    assert(from, "Signer is missing");

    const blockNumber: number = event.block.block.header.number.toNumber();

    const fromAccount = await ensureAccount(from.toString());
    const toAccount = await ensureAccount(to.toString());
    const block = await ensureBlock(event.block.block.header.number.toString())
    // Create the new transfer entity
    const entity = Transfer.create({
      id: `${block.id}-${event.idx}`,
      fromId: fromAccount.id,
      toId: toAccount.id,
      value: (amount as Balance).toBigInt(),
      blockId: block.id,
      blockNumber: block.number,
      eventIndex: event.idx,
      extrinsicIndex: event.extrinsic?.idx
    });
    await entity.save();
    
    await addTransferToDay(event.block.timestamp, (amount as Balance).toBigInt());
  } catch (error) {
    console.log(error)

  }

}
