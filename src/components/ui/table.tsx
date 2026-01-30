import * as React from "react";

import { cn } from "@/lib/utils";

const Table = ({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
  <div className="w-full overflow-auto">
    <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
  </div>
);

const TableHeader = (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className="[&_tr]:border-b" {...props} />
);

const TableBody = (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className="[&_tr:last-child]:border-0" {...props} />
);

const TableRow = (props: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className="border-b transition-colors hover:bg-muted/50" {...props} />
);

const TableHead = ({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground",
      className,
    )}
    {...props}
  />
);

const TableCell = ({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn("p-4 align-middle", className)} {...props} />
);

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
