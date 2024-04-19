import { SubstrateBlock } from "@subql/types";
import { Block } from "../types";
import { EventRecord, Balance } from "@polkadot/types/interfaces";

export async function createBlock(block: SubstrateBlock): Promise<void> {
  const entity = Block.create({
    id: block.block.header.number.toString(),
    number: block.block.header.number.toBigInt(),
    hash: block.block.hash.toString(),
    timestamp: block.timestamp,
    parentHash: block.block.header.parentHash.toString(),
    specVersion: block.specVersion,
    stateRoot: block.block.header.stateRoot.toString(),
    extrinsicsRoot: block.block.header.extrinsicsRoot.toString(),
    fee: BigInt(0),
  });

  await entity.save();
}
export async function updateFeeBlock(
  blockNumber: bigint,
  event: EventRecord
): Promise<void> {
  logger.info(
    `New fee ${blockNumber} }`,
  );
  const {
    event: {
      data: [from, actualFee, tip],
    },
  } = event;
  let fee =(actualFee as Balance).toBigInt()
  let tip_ =(tip as Balance).toBigInt()
  let entity = await Block.get(`${blockNumber}`)
  entity.fee = fee + tip_;
  entity.save();
  
}