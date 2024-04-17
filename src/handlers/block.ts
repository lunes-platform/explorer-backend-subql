import { SubstrateBlock } from "@subql/types";
import { Block } from "../types";

export async function ensureBlock(recordId: string): Promise<Block> {
  let entity = await Block.get(recordId);
  if (!entity) {
    entity = new Block(recordId,BigInt(recordId));
    await entity.save();
  }
  return entity;
}

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
  });

  await entity.save();
}
