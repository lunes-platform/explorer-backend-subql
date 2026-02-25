import { SubstrateBlock } from "@subql/types";
import { EventRecord } from "@polkadot/types/interfaces";
export declare function createBlock(block: SubstrateBlock): Promise<void>;
export declare function updateFeeBlock(blockNumber: bigint, event: EventRecord): Promise<void>;
