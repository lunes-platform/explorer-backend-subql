"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEvent = void 0;
const types_1 = require("../types");
function createEvent(blockNumber, index, event) {
    const entity = types_1.Event.create({
        id: `${blockNumber.toString()}-${index.toString()}`,
        blockNumber,
        eventIndex: index,
        section: event.event.section,
        method: event.event.method,
        data: JSON.stringify(event.event.data),
    });
    entity.save();
    return entity;
}
exports.createEvent = createEvent;
