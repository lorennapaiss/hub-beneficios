"use client";

import { Button } from "@/components/ui/button";

export function PrintDescriptiveButton() {
  return (
    <Button type="button" onClick={() => window.print()}>
      Imprimir / salvar em PDF
    </Button>
  );
}
