import { Psp22Token } from "../types";
import { EventRecord } from "@polkadot/types/interfaces";
export declare function handlePsp22Transfer(blockNumber: bigint, index: number, event: EventRecord): Promise<void>;
export declare function handlePsp22Approval(blockNumber: bigint, index: number, event: EventRecord): Promise<void>;
export declare function ensurePsp22Token(contractAddress: string, blockNumber: bigint): Promise<Psp22Token>;
