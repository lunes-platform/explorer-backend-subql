"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureAsset = void 0;
const types_1 = require("../types");
async function ensureAsset(id) {
    let entity = await types_1.Asset.get(id);
    if (!entity) {
        // Create placeholder — NO RPC calls for speed.
        // Real metadata is populated by assets.MetadataSet event handler.
        entity = new types_1.Asset(id, "Native");
        entity.name = `Asset #${id}`;
        entity.symbol = `AST${id}`;
        entity.decimals = 0;
        await entity.save();
    }
    return entity;
}
exports.ensureAsset = ensureAsset;
