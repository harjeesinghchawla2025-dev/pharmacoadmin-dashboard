import type { ReactNode } from "react";
import { AlertTriangle, Inbox, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { columnsOf, display, label, type Row } from "@/lib/clinical-api";

interface ToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
  placeholder: string;
  searchLabel: string;
  onRefresh: () => void;
  refreshing?: boolean;
  children?: ReactNode;
}

export function AdminToolbar({
  query,
  onQueryChange,
  placeholder,
  searchLabel,
  onRefresh,
  refreshing,
  children,
}: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
        <Search className="size-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={placeholder}
          aria-label={searchLabel}
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      {children}
      <Button variant="outline" onClick={onRefresh} disabled={refreshing}>
        <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
        Refresh
      </Button>
    </div>
  );
}

export function AdminError({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

interface RecordTableProps {
  rows: Row[];
  /** Preferred column order; any remaining real columns are appended. */
  preferred?: string[];
  maxColumns?: number;
  isLoading: boolean;
  emptyMessage: string;
  renderCell?: (row: Row, key: string) => ReactNode;
  actions?: (row: Row) => ReactNode;
  rowKey: (row: Row, index: number) => string;
}

export function RecordTable({
  rows,
  preferred = [],
  maxColumns = 9,
  isLoading,
  emptyMessage,
  renderCell,
  actions,
  rowKey,
}: RecordTableProps) {
  const available = columnsOf(rows);
  const ordered = [
    ...preferred.filter((k) => available.includes(k)),
    ...available.filter((k) => !preferred.includes(k)),
  ].slice(0, maxColumns);

  return (
    <Card>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-3 p-6">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
              <Inbox className="size-6" />
            </span>
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {ordered.map((key) => (
                    <TableHead key={key}>{label(key)}</TableHead>
                  ))}
                  {actions && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow key={rowKey(row, index)}>
                    {ordered.map((key) => (
                      <TableCell key={key} className="whitespace-nowrap align-middle">
                        {renderCell?.(row, key) ?? display(row[key])}
                      </TableCell>
                    ))}
                    {actions && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">{actions(row)}</div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DetailGrid({ record }: { record: Row }) {
  const keys = columnsOf([record]);
  if (keys.length === 0) {
    return <p className="text-sm text-muted-foreground">No fields available.</p>;
  }
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {keys.map((key) => (
        <div key={key} className="min-w-0">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label(key)}</dt>
          <dd className="truncate text-sm font-medium">{display(record[key])}</dd>
        </div>
      ))}
    </dl>
  );
}
