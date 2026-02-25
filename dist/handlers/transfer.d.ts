import { Transfer } from "../types";
import { EventRecord } from "@polkadot/types/interfaces";
export declare function createTransfer(blockNumber: bigint, index: number, event: EventRecord, blockTimestamp?: Date): Transfer;
