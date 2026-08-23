import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminError, AdminToolbar, DetailGrid, RecordTable } from "./RecordTable";
import {
  columnsOf,
  doctorsApi,
  idOf,
  label,
  matches,
  statusOf,
  type DoctorRow,
  type Row,
} from "@/lib/clinical-api";
import { ACCOUNT_STATUSES } from "@/lib/users-api";

const DOCTORS_KEY = ["admin", "doctors"] as const;
const ID_KEYS = ["doctorId", "doctor_id", "id"];
const PREFERRED = [
  "doctorId",
  "doctor_id",
  "fullName",
  "name",
  "firstName",
  "lastName",
  "email",
  "studentId",
  "student_id",
  "specialization",
  "licenseNumber",
  "license_number",
  "status",
  "createdAt",
  "created_at",
];

/** Text fields the admin may edit; only fields the row actually contains render. */
const EDITABLE = [
  "fullName",
  "name",
  "firstName",
  "lastName",
  "specialization",
  "licenseNumber",
  "license_number",
  "registrationNumber",
  "phone",
  "contactNumber",
  "department",
];

export function DoctorsModule() {
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailId, setDetailId] = useState<string | number | null>(null);
  const [editRow, setEditRow] = useState<DoctorRow | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const doctorsQuery = useQuery({ queryKey: DOCTORS_KEY, queryFn: doctorsApi.list });
  const detailQuery = useQuery({
    queryKey: ["admin", "doctors", detailId],
    queryFn: () => doctorsApi.get(detailId as string | number),
    enabled: detailId !== null,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: DOCTORS_KEY });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string | number; status: string }) =>
      doctorsApi.setStatus(id, status),
    onSuccess: async () => {
      setActionError(null);
      await refresh();
    },
    onError: (err: Error) => setActionError(err.message),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const id = editRow ? idOf(editRow, ID_KEYS) : null;
      if (id === null) throw new Error("This doctor record has no identifier column.");
      return doctorsApi.update(id, form as Row);
    },
    onSuccess: async () => {
      setEditRow(null);
      setFormError(null);
      await refresh();
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const rows = doctorsQuery.data ?? [];
  const statuses = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      const s = statusOf(r);
      if (s) set.add(s);
    });
    ACCOUNT_STATUSES.forEach((s) => set.add(s));
    return [...set];
  }, [rows]);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) => matches(r, query) && (statusFilter === "all" || statusOf(r) === statusFilter),
      ),
    [rows, query, statusFilter],
  );

  const hasStatus = rows.some((r) => statusOf(r) !== null);

  function openEdit(row: DoctorRow) {
    const editable = columnsOf([row]).filter((k) => EDITABLE.includes(k));
    setForm(
      Object.fromEntries(editable.map((k) => [k, row[k] === null ? "" : String(row[k] ?? "")])),
    );
    setFormError(null);
    setEditRow(row);
  }

  return (
    <div className="space-y-4">
      <AdminToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Search by name, email, ID, specialization or status"
        searchLabel="Search doctors"
        onRefresh={refresh}
        refreshing={doctorsQuery.isFetching}
      >
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[170px]" aria-label="Filter by account status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </AdminToolbar>

      {(doctorsQuery.isError || actionError) && (
        <AdminError
          message={
            actionError ??
            (doctorsQuery.error instanceof Error
              ? doctorsQuery.error.message
              : "Failed to load doctors.")
          }
        />
      )}

      <RecordTable
        rows={filtered}
        preferred={PREFERRED}
        isLoading={doctorsQuery.isPending}
        emptyMessage={
          query || statusFilter !== "all"
            ? "No doctors match your filters."
            : "No doctors found in the database."
        }
        rowKey={(row, i) => String(idOf(row, ID_KEYS) ?? i)}
        renderCell={(row, key) => {
          if (hasStatus && ["status", "accountStatus", "account_status"].includes(key)) {
            const id = idOf(row, ID_KEYS);
            const current = statusOf(row) ?? "";
            if (id === null) return <Badge variant="outline">{current || "—"}</Badge>;
            return (
              <Select
                value={current}
                onValueChange={(value) => statusMutation.mutate({ id, status: value })}
              >
                <SelectTrigger className="h-8 w-[130px]" aria-label="Account status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }
          return undefined;
        }}
        actions={(row) => (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDetailId(idOf(row, ID_KEYS))}
              aria-label="View doctor details"
            >
              <Eye className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openEdit(row as DoctorRow)}
              aria-label="Edit doctor"
            >
              <Pencil className="size-4" />
            </Button>
          </>
        )}
      />

      {/* Details */}
      <Dialog open={detailId !== null} onOpenChange={(open) => !open && setDetailId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Doctor details</DialogTitle>
            <DialogDescription>Record and linked user account from the database.</DialogDescription>
          </DialogHeader>
          {detailQuery.isPending ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : detailQuery.isError ? (
            <AdminError
              message={
                detailQuery.error instanceof Error
                  ? detailQuery.error.message
                  : "Failed to load doctor."
              }
            />
          ) : (
            <div className="space-y-6">
              <section className="space-y-3">
                <h3 className="text-sm font-semibold">Doctor record</h3>
                {detailQuery.data?.doctor ? (
                  <DetailGrid record={detailQuery.data.doctor} />
                ) : (
                  <p className="text-sm text-muted-foreground">Not found.</p>
                )}
              </section>
              <section className="space-y-3">
                <h3 className="text-sm font-semibold">Linked user account</h3>
                {detailQuery.data?.user ? (
                  <DetailGrid record={detailQuery.data.user} />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No linked user account available for this doctor in the current schema.
                  </p>
                )}
              </section>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailId(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={editRow !== null} onOpenChange={(open) => !open && setEditRow(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit doctor</DialogTitle>
            <DialogDescription>
              Only columns that exist in the doctors table can be edited.
            </DialogDescription>
          </DialogHeader>
          {Object.keys(form).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              This doctor record has no editable descriptive columns in the current schema. Account
              status can be changed from the table.
            </p>
          ) : (
            <div className="space-y-4">
              {Object.keys(form).map((key) => (
                <div key={key} className="space-y-2">
                  <Label htmlFor={`doctor-${key}`}>{label(key)}</Label>
                  <Input
                    id={`doctor-${key}`}
                    value={form[key] ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          )}
          {formError && <AdminError message={formError} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRow(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || Object.keys(form).length === 0}
            >
              {saveMutation.isPending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
