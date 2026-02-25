import { SubstrateEvent } from "@subql/types";
export declare function handleStakingEvent(blockNumber: bigint, eventIndex: number, event: SubstrateEvent): Promise<void>;
