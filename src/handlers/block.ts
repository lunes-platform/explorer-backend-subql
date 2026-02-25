import { SubstrateBlock } from "@subql/types";
import { Block } from "../types";
import { EventRecord, Balance } from "@polkadot/types/interfaces";

export async function createBlock(block: SubstrateBlock): Promise<void> {
  const blockId = block.block.header.number.toString();
  const entity = Block.create({
    id: blockId,
    number: block.block.header.number.toBigInt(),
    hash: block.block.hash.toString(),
    parentHash: block.block.header.parentHash.toString(),
  });
  if (block.timestamp) {
    entity.timestamp = BigInt(block.timestamp.getTime());
  }
  if (block.specVersion) {
    entity.specVersion = block.specVersion;
  }
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
  if (entity) {
    // Note: Block entity doesn't have fee field in the schema, skipping this update
    // entity.fee = fee + tip_;
    await entity.save();
  }
}