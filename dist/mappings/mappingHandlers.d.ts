import { SubstrateBlock } from "@subql/types";
import { SubstrateEvent, SubstrateExtrinsic } from "@subql/types";
export declare function handleBlock(block: SubstrateBlock): Promise<void>;
export declare function handleEvent(event: SubstrateEvent): Promise<void>;
export declare function handleCall(call: SubstrateExtrinsic): Promise<void>;
