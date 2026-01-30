"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const parseNumber = (value: string) =>
  Number(value.replace(/[^0-9,]/g, "").replace(",", ".")) || 0;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

export default function CurrencyInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number;
  onChange?: (value: number) => void;
}) {
  const [internalValue, setInternalValue] = useState(
    value ? formatCurrency(value) : "",
  );

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        placeholder="R$ 0,00"
        value={internalValue}
        onChange={(event) => setInternalValue(event.target.value)}
        onBlur={() => {
          const numeric = parseNumber(internalValue);
          setInternalValue(numeric ? formatCurrency(numeric) : "");
          onChange?.(numeric);
        }}
      />
    </div>
  );
}
