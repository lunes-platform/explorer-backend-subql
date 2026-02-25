import { Psp37Contract } from "../types";
import { EventRecord } from "@polkadot/types/interfaces";
export declare function handlePsp37TransferSingle(blockNumber: bigint, index: number, event: EventRecord): Promise<void>;
export declare function handlePsp37TransferBatch(blockNumber: bigint, index: number, event: EventRecord): Promise<void>;
export declare function handlePsp37Mint(blockNumber: bigint, index: number, event: EventRecord): Promise<void>;
export declare function ensurePsp37Contract(contractAddress: string, blockNumber: bigint): Promise<Psp37Contract>;
