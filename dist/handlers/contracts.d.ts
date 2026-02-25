import { SubstrateExtrinsic } from "@subql/types";
import { EventRecord } from "@polkadot/types/interfaces";
export declare function handleContractCall(blockNumber: bigint, extrinsic: SubstrateExtrinsic): Promise<void>;
export declare function handleContractEvent(blockNumber: bigint, index: number, event: EventRecord): Promise<void>;
export declare function handleContractInstantiated(blockNumber: bigint, index: number, event: EventRecord): Promise<void>;
export declare function detectContractStandard(contractAddress: string, eventName: string): Promise<void>;
