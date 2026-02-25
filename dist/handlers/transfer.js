"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransfer = void 0;
const types_1 = require("../types");
function createTransfer(blockNumber, index, event, blockTimestamp) {
    const { event: { data: [fromId, toId, balance], }, } = event;
    let entity = types_1.Transfer.create(Object.assign({ id: `${blockNumber.toString()}-${index.toString()}`, fromId: fromId.toString(), toId: toId.toString(), amount: balance.toBigInt(), value: balance.toBigInt(), blockId: blockNumber.toString(), blockNumber: blockNumber, eventIndex: index }, (blockTimestamp
        ? {
            timestamp: BigInt(blockTimestamp.getTime()),
            date: blockTimestamp,
        }
        : {})));
    entity.save();
    return entity;
}
exports.createTransfer = createTransfer;
