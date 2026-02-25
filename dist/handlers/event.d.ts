import { Event } from "../types";
import { EventRecord } from "@polkadot/types/interfaces";
export declare function createEvent(blockNumber: bigint, index: number, event: EventRecord): Event;
