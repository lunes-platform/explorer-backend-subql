"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFeeBlock = exports.createBlock = void 0;
const types_1 = require("../types");
async function createBlock(block) {
    const blockId = block.block.header.number.toString();
    const entity = types_1.Block.create({
        id: blockId,
        number: block.block.header.number.toBigInt(),
        hash: block.block.hash.toString(),
        parentHash: block.block.header.parentHash.toString(),
    });
    if (block.timestamp) {
        entity.timestamp = BigInt(block.timestamp.getTime());
    }
    if (block.specVersion) {
        entity.specVersion = block.specVersion;
    }
    await entity.save();
}
exports.createBlock = createBlock;
async function updateFeeBlock(blockNumber, event) {
    logger.info(`New fee ${blockNumber} }`);
    const { event: { data: [from, actualFee, tip], }, } = event;
    let fee = actualFee.toBigInt();
    let tip_ = tip.toBigInt();
    let entity = await types_1.Block.get(`${blockNumber}`);
    if (entity) {
        // Note: Block entity doesn't have fee field in the schema, skipping this update
        // entity.fee = fee + tip_;
        await entity.save();
    }
}
exports.updateFeeBlock = updateFeeBlock;
