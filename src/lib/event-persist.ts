import type { PrimaryEventType } from "@/lib/event-components";
import type { OpsModel, OpsModelV1 } from "@/lib/event-model";
import { eventFromOps, type EventData, type EventComponent, type Sponsor } from "@/components/event-context";

/**
 * Fields that are NOT derivable from the operational model: registries and
 * settings that live only in the legacy format (sponsor list, modular
 * components, template guidance, AV requirements) plus the event identity.
 * Everything else (sessions, breaks, speakers, moderators) is derived from ops.
 */
export type EventMeta = {
  name: string;
  type: string;
  primaryEventType?: PrimaryEventType;
  date: string;
  endDate?: string;
  templateGuidance?: string;
  avRequirements: string;
  sponsors: Sponsor[];
  components: EventComponent[];
};

/** Pick the non-derivable fields from the current event. */
export function pickEventMeta(e: EventData): EventMeta {
  return {
    name: e.name,
    type: e.type,
    primaryEventType: e.primaryEventType,
    date: e.date,
    endDate: e.endDate,
    templateGuidance: e.templateGuidance,
    avRequirements: e.avRequirements,
    sponsors: e.sponsors ?? [],
    components: e.components ?? [],
  };
}

/** Rebuild a full EventData from saved meta + the stored operational model. */
/** Accepts stored v1 or v2 models; v1 is upgraded on open and stored as v2 only on the next Save. */
export function eventFromSaved(meta: EventMeta, ops: OpsModel | OpsModelV1): EventData {
  return eventFromOps(meta, ops);
}
