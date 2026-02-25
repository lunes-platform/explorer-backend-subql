"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wrapExtrinsics = exports.createExtrinsic = void 0;
const types_1 = require("../types");
function createExtrinsic(blockNumber, extrinsic) {
    const entity = types_1.Extrinsic.create({
        id: `${blockNumber.toString()}-${extrinsic.idx}`,
        blockNumber: blockNumber,
        extrinsicIndex: extrinsic.idx,
        isSigned: extrinsic.extrinsic.isSigned,
        method: extrinsic.extrinsic.method.method,
        section: extrinsic.extrinsic.method.section,
        success: extrinsic.success,
    });
    if (extrinsic.extrinsic.isSigned) {
        entity.signer = extrinsic.extrinsic.signer.toString();
    }
    entity.save();
    return entity;
}
exports.createExtrinsic = createExtrinsic;
function wrapExtrinsics(wrappedBlock) {
    return wrappedBlock.block.extrinsics.map((extrinsic, idx) => {
        const events = wrappedBlock.events.filter(({ phase }) => phase.isApplyExtrinsic && phase.asApplyExtrinsic.eqn(idx));
        return {
            idx,
            extrinsic,
            block: wrappedBlock,
            events,
            success: events.findIndex((evt) => evt.event.method === "ExtrinsicSuccess") > -1,
        };
    });
}
exports.wrapExtrinsics = wrapExtrinsics;
