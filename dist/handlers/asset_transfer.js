"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAssetTransfer = void 0;
const types_1 = require("../types");
const asset_account_1 = require("./asset_account");
const asset_1 = require("./asset");
async function createAssetTransfer(blockNumber, index, event) {
    const { event: { data: [assetId, from, to, amount], }, } = event;
    const assetIdStr = assetId.toString();
    const fromStr = from.toString();
    const toStr = to.toString();
    const transferAmount = amount.toBigInt();
    await (0, asset_1.ensureAsset)(assetIdStr);
    const entity = types_1.AssetTransfer.create({
        id: `${blockNumber}-${index}`,
        assetId: assetIdStr,
        fromId: fromStr,
        toId: toStr,
        amount: transferAmount,
        blockNumber,
        eventIndex: index,
    });
    entity.save();
    // Register from/to as AssetAccount holders with placeholder balance (0).
    // The actual balance is unknown without an RPC call — which we avoid here
    // to prevent timeouts. The balance gets corrected by assets.Issued events.
    // We use fire-and-forget (no await) so this never blocks block processing.
    (0, asset_account_1.ensureAccountAsset)(fromStr, BigInt(0), assetIdStr);
    (0, asset_account_1.ensureAccountAsset)(toStr, BigInt(0), assetIdStr);
    return entity;
}
exports.createAssetTransfer = createAssetTransfer;
