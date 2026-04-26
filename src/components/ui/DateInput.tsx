"use client";

import { forwardRef } from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

// iOS Safari does not render the value or placeholder of a native
// <input type="date"> by default — the field looks blank until tapped.
// This wrapper:
//   - keeps the native picker (no extra deps, full a11y)
//   - forces value text visibility via class + ::-webkit-date-and-time-value
//   - shows a "Select date" hint via ::before when no value is set
// All sites in the app that previously used `<input type="date">` should
// switch to <DateInput> so the iOS bug fix lands once.
export const DateInput = forwardRef<HTMLInputElement, Props>(function DateInput(
  props,
  ref,
) {
  const { value, className, placeholder, ...rest } = props;
  const hasValue = value !== undefined && value !== null && String(value).length > 0;

  return (
    <input
      ref={ref}
      type="date"
      value={value}
      data-has-value={hasValue ? "true" : "false"}
      placeholder={placeholder ?? "Select date"}
      className={`date-input ${className ?? ""}`}
      {...rest}
    />
  );
});
