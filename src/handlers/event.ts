import { Event } from "../types";
import { EventRecord } from "@polkadot/types/interfaces";

export function createEvent(
  blockNumber: bigint,
  index: number,
  event: EventRecord
): Event {
  const entity = Event.create({
    id: `${blockNumber.toString()}-${index.toString()}`,
    blockId: blockNumber.toString(),
    blockNumber,
    index,
    section: event.event.section,
    method: event.event.method,
  });
  entity.save();
  return entity;
}