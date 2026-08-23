import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminError, AdminToolbar, DetailGrid, RecordTable } from "./RecordTable";
import { idOf, matches, patientsApi, statusOf, type Row } from "@/lib/clinical-api";

const PATIENTS_KEY = ["admin", "patients"] as const;
const ID_KEYS = ["patientId", "patient_id", "id"];
const PREFERRED = [
  "patientId",
  "patient_id",
  "patientCode",
  "patient_code",
  "fullName",
  "name",
  "firstName",
  "lastName",
  "email",
  "gender",
  "dateOfBirth",
  "date_of_birth",
  "status",
  "createdAt",
  "created_at",
];

export function PatientsModule() {
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detailId, setDetailId] = useState<string | number | null>(null);

  const patientsQuery = useQuery({ queryKey: PATIENTS_KEY, queryFn: patientsApi.list });
  const detailQuery = useQuery({
    queryKey: ["admin", "patients", detailId],
    queryFn: () => patientsApi.get(detailId as string | number),
    enabled: detailId !== null,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: PATIENTS_KEY });

  const rows = patientsQuery.data ?? [];
  const statuses = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => {
      const s = statusOf(r);
      if (s) set.add(s);
    });
    return [...set];
  }, [rows]);

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) => matches(r, query) && (statusFilter === "all" || statusOf(r) === statusFilter),
      ),
    [rows, query, statusFilter],
  );

  const detail = detailQuery.data;

  return (
    <div className="space-y-4">
      <AdminToolbar
        query={query}
        onQueryChange={setQuery}
        placeholder="Search by patient code, name, email or identifier"
        searchLabel="Search patients"
        onRefresh={refresh}
        refreshing={patientsQuery.isFetching}
      >
        {statuses.length > 0 && (
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[170px]" aria-label="Filter by status">
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
        )}
      </AdminToolbar>

      {patientsQuery.isError && (
        <AdminError
          message={
            patientsQuery.error instanceof Error
              ? patientsQuery.error.message
              : "Failed to load patients."
          }
        />
      )}

      <RecordTable
        rows={filtered}
        preferred={PREFERRED}
        isLoading={patientsQuery.isPending}
        emptyMessage={
          query || statusFilter !== "all"
            ? "No patients match your filters."
            : "No patients found in the database."
        }
        rowKey={(row, i) => String(idOf(row, ID_KEYS) ?? i)}
        actions={(row) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDetailId(idOf(row, ID_KEYS))}
            aria-label="View patient details"
          >
            <Eye className="size-4" />
          </Button>
        )}
      />

      <Dialog open={detailId !== null} onOpenChange={(open) => !open && setDetailId(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Patient details</DialogTitle>
            <DialogDescription>
              Record, genotypes, prescriptions and recommendations from the database.
            </DialogDescription>
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
                  : "Failed to load patient."
              }
            />
          ) : (
            <Tabs defaultValue="profile">
              <TabsList>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="genotypes">
                  Genotypes ({detail?.genotypes?.length ?? 0})
                </TabsTrigger>
                <TabsTrigger value="prescriptions">
                  Prescriptions ({detail?.prescriptions?.length ?? 0})
                </TabsTrigger>
                <TabsTrigger value="recommendations">
                  Recommendations ({detail?.recommendations?.length ?? 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="pt-4">
                {detail?.patient ? (
                  <DetailGrid record={detail.patient} />
                ) : (
                  <p className="text-sm text-muted-foreground">Not found.</p>
                )}
              </TabsContent>

              {(
                [
                  ["genotypes", detail?.genotypes ?? []],
                  ["prescriptions", detail?.prescriptions ?? []],
                  ["recommendations", detail?.recommendations ?? []],
                ] as [string, Row[]][]
              ).map(([key, list]) => (
                <TabsContent key={key} value={key} className="pt-4">
                  {detail?.unavailable?.includes(key) ? (
                    <p className="text-sm text-muted-foreground">
                      The current database schema has no relationship linking patients to {key}.
                    </p>
                  ) : (
                    <RecordTable
                      rows={list}
                      isLoading={false}
                      maxColumns={6}
                      emptyMessage={`No ${key} recorded for this patient.`}
                      rowKey={(_row, i) => `${key}-${i}`}
                    />
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailId(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
