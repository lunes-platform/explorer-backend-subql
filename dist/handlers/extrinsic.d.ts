import { SubstrateBlock, SubstrateExtrinsic } from "@subql/types";
import { Extrinsic } from "../types";
export declare function createExtrinsic(blockNumber: bigint, extrinsic: SubstrateExtrinsic): Extrinsic;
export declare function wrapExtrinsics(wrappedBlock: SubstrateBlock): SubstrateExtrinsic[];
