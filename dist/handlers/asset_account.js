"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureAccountAsset = void 0;
const types_1 = require("../types");
async function ensureAccountAsset(accountID, balance, assetId) {
    const ID = `${accountID}-${assetId}`;
    let entity = await types_1.AssetAccount.get(ID);
    if (!entity) {
        entity = new types_1.AssetAccount(ID, assetId, accountID, balance);
        await entity.save();
    }
    else if (balance > BigInt(0)) {
        // Only update if we have a real balance — never overwrite with 0
        entity.balance = balance;
        await entity.save();
    }
}
exports.ensureAccountAsset = ensureAccountAsset;
