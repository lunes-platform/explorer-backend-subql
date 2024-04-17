import { SubstrateBlock, SubstrateExtrinsic } from "@subql/types";
import { Extrinsic } from "../types";

export function createExtrinsic(
  blockNumber: bigint,
  extrinsic: SubstrateExtrinsic
): Extrinsic {
  const entity = Extrinsic.create({
    id: `${blockNumber.toString()}-${extrinsic.idx}`,
    blockId: blockNumber.toString(),
    blockNumber: blockNumber,
    index: extrinsic.idx,
    hash: extrinsic.extrinsic.hash.toString(),
    isSigned: extrinsic.extrinsic.isSigned,
    section: extrinsic.extrinsic.method.section,
    method: extrinsic.extrinsic.method.method,
    success: extrinsic.success,
    signerId: extrinsic.extrinsic.isSigned
      ? extrinsic.extrinsic.signer.toString().toLowerCase()
      : undefined,
  });
  entity.save();
  return entity;
}

export function wrapExtrinsics(
  wrappedBlock: SubstrateBlock
): SubstrateExtrinsic[] {
  return wrappedBlock.block.extrinsics.map((extrinsic, idx) => {
    const events = wrappedBlock.events.filter(
      ({ phase }) => phase.isApplyExtrinsic && phase.asApplyExtrinsic.eqn(idx)
    );
    return {
      idx,
      extrinsic,
      block: wrappedBlock,
      events,
      success:
        events.findIndex((evt) => evt.event.method === "ExtrinsicSuccess") > -1,
    };
  });
}