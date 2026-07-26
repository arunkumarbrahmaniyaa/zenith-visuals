import type { ReactNode } from "react";

export type ActivityStatus = "default" | "success" | "warning" | "danger" | "info";

export interface ActivityActor {
  name: string;
  /** Avatar image URL. When absent, initials are rendered. */
  avatarUrl?: string;
}

export interface ActivityItem {
  id: string;
  /** Primary title/description of the event. */
  title: ReactNode;
  /** Optional secondary body (comment, details). */
  description?: ReactNode;
  /** Timestamp (Date or ISO string) used for grouping and display. */
  timestamp: Date | string;
  actor?: ActivityActor;
  /** Semantic status controlling the node color. */
  status?: ActivityStatus;
  /** Custom icon rendered inside the timeline node. */
  icon?: ReactNode;
  /** Nested child events rendered indented under this item. */
  children?: ActivityItem[];
}
