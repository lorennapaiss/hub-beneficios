"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DatePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange?: (value: string) => void;
}) {
  const [internalValue, setInternalValue] = useState(value ?? "");

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="date"
        value={internalValue}
        onChange={(event) => {
          setInternalValue(event.target.value);
          onChange?.(event.target.value);
        }}
      />
    </div>
  );
}
