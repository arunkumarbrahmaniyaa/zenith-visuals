import { useCallback, useRef, useState } from "react";

/**
 * Support both controlled and uncontrolled values in a single hook, following
 * the standard React controllable-state pattern. When `controlled` is provided
 * the component is controlled; otherwise internal state is used.
 */
export function useControllableState<T>(params: {
  controlled: T | undefined;
  defaultValue: T;
  onChange?: (value: T) => void;
}): [T, (next: T) => void] {
  const { controlled, defaultValue, onChange } = params;
  const isControlled = controlled !== undefined;
  const [uncontrolled, setUncontrolled] = useState<T>(defaultValue);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const value = isControlled ? (controlled as T) : uncontrolled;

  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) setUncontrolled(next);
      onChangeRef.current?.(next);
    },
    [isControlled],
  );

  return [value, setValue];
}
