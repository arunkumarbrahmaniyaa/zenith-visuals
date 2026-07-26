import { createElement, forwardRef, type SVGProps } from "react";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "ref"> {
  /** Square icon size in px. Default 16. */
  size?: number;
  /** Stroke width. Default 2. */
  strokeWidth?: number;
  /** Accessible label. When omitted the icon is `aria-hidden`. */
  title?: string;
}

/**
 * Internal factory that builds a stroke-based icon component from raw path
 * children. Icons inherit `currentColor` so they match surrounding text.
 */
export function createIcon(displayName: string, children: string) {
  const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon(
    { size = 16, strokeWidth = 2, title, ...rest },
    ref,
  ) {
    return createElement(
      "svg",
      {
        ref,
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        role: title ? "img" : undefined,
        "aria-label": title,
        "aria-hidden": title ? undefined : true,
        ...rest,
      },
      title ? createElement("title", null, title) : null,
      createElement("g", { dangerouslySetInnerHTML: { __html: children } }),
    );
  });
  Icon.displayName = displayName;
  return Icon;
}
