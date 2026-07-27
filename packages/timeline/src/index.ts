export { ActivityTimeline, type ActivityTimelineProps } from "./ActivityTimeline";
export type { ActivityItem, ActivityActor, ActivityStatus } from "./types";

export {
  ResourceTimeline,
  type ResourceTimelineProps,
} from "./resource-timeline/ResourceTimeline";
export {
  computeResourceTimeline,
  type ResourceTask,
  type ResourceBar,
  type ResourceRow,
  type ResourceTimelineModel,
  type ResourceTimelineOptions,
} from "./resource-timeline/layout";

export { Swimlane, type SwimlaneProps } from "./swimlane/Swimlane";
export {
  computeSwimlane,
  type SwimlaneEvent,
  type SwimlaneItem,
  type SwimlaneBand,
  type SwimlaneModel,
  type SwimlaneOptions,
} from "./swimlane/layout";

export { EventDrops, type EventDropsProps } from "./event-drops/EventDrops";
export {
  computeEventDrops,
  type DropEvent,
  type EventDropsRow,
  type DropPoint,
  type EventDropsLane,
  type EventDropsModel,
  type EventDropsOptions,
} from "./event-drops/layout";

export {
  toMs,
  timeExtentMs,
  niceTimeTicks,
  packLanes,
  type TimeTick,
  type TimeInterval,
} from "./lib/time";
