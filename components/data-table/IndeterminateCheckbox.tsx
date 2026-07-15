"use client";

import { useEffect, useRef } from "react";

interface IndeterminateCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function IndeterminateCheckbox({
  checked,
  indeterminate = false,
  disabled = false,
  onChange,
}: IndeterminateCheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = !checked && indeterminate;
    }
  }, [checked, indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      onClick={(e) => e.stopPropagation()}
      className="size-4 cursor-pointer rounded-[4px] border-[1.5px] border-border-strong accent-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-40"
    />
  );
}
