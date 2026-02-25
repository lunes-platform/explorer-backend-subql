import { Psp34Collection } from "../types";
import { EventRecord } from "@polkadot/types/interfaces";
export declare function handlePsp34Transfer(blockNumber: bigint, index: number, event: EventRecord): Promise<void>;
export declare function handlePsp34Mint(blockNumber: bigint, index: number, event: EventRecord): Promise<void>;
export declare function ensurePsp34Collection(contractAddress: string, blockNumber: bigint): Promise<Psp34Collection>;
