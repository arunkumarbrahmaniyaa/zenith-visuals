import { createIcon } from "./createIcon";

export type { IconProps } from "./createIcon";
export { createIcon } from "./createIcon";

export const ChevronRight = createIcon("ChevronRight", '<path d="M9 18l6-6-6-6" />');
export const ChevronDown = createIcon("ChevronDown", '<path d="M6 9l6 6 6-6" />');
export const ChevronLeft = createIcon("ChevronLeft", '<path d="M15 18l-6-6 6-6" />');
export const ChevronUp = createIcon("ChevronUp", '<path d="M18 15l-6-6-6 6" />');

export const Plus = createIcon("Plus", '<path d="M12 5v14M5 12h14" />');
export const Minus = createIcon("Minus", '<path d="M5 12h14" />');
export const Close = createIcon("Close", '<path d="M18 6L6 18M6 6l12 12" />');
export const Check = createIcon("Check", '<path d="M20 6L9 17l-5-5" />');

export const Search = createIcon(
  "Search",
  '<circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" />',
);
export const Circle = createIcon("Circle", '<circle cx="12" cy="12" r="9" />');
export const Dot = createIcon("Dot", '<circle cx="12" cy="12" r="4" fill="currentColor" />');

export const ZoomIn = createIcon(
  "ZoomIn",
  '<circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3M11 8v6M8 11h6" />',
);
export const ZoomOut = createIcon(
  "ZoomOut",
  '<circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3M8 11h6" />',
);

export const Download = createIcon(
  "Download",
  '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />',
);
export const Calendar = createIcon(
  "Calendar",
  '<rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />',
);
export const User = createIcon(
  "User",
  '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />',
);
export const GitBranch = createIcon(
  "GitBranch",
  '<line x1="6" y1="3" x2="6" y2="15" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9" />',
);
export const Bolt = createIcon("Bolt", '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />');
export const AlertTriangle = createIcon(
  "AlertTriangle",
  '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4M12 17h.01" />',
);
