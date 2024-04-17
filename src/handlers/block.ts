import { SubstrateBlock } from "@subql/types";
import { Block } from "../types";

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