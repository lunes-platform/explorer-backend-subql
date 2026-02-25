import { AssetTransfer } from "../types";
import { EventRecord } from "@polkadot/types/interfaces";
export declare function createAssetTransfer(blockNumber: bigint, index: number, event: EventRecord): Promise<AssetTransfer>;
