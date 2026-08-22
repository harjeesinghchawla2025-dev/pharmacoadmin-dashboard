import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Pencil, Plus, RefreshCw, Search, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ACCOUNT_STATUSES,
  usersApi,
  type AccountStatus,
  type AdminUser,
  type Role,
} from "@/lib/users-api";

const USERS_KEY = ["admin", "users"] as const;

interface FormState {
  studentId: string;
  email: string;
  password: string;
  roleId: string;
  accountStatus: string;
}

const EMPTY_FORM: FormState = {
  studentId: "",
  email: "",
  password: "",
  roleId: "",
  accountStatus: "Active",
};

function statusVariant(status: string) {
  if (status === "Active") return "default" as const;
  if (status === "Pending") return "secondary" as const;
  return "outline" as const;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

export function UsersModule() {
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const usersQuery = useQuery({ queryKey: USERS_KEY, queryFn: usersApi.list });
  const rolesQuery = useQuery({ queryKey: ["admin", "roles"], queryFn: usersApi.roles });
  const roles: Role[] = rolesQuery.data ?? [];

  const roleIdByName = useMemo(
    () => new Map(roles.map((r) => [r.roleName.toLowerCase(), r.roleId])),
    [roles],
  );

  const refresh = () => qc.invalidateQueries({ queryKey: USERS_KEY });

  const saveMutation = useMutation({
    mutationFn: async (values: FormState) => {
      const payload = {
        studentId: values.studentId.trim() ? values.studentId.trim() : null,
        email: values.email.trim(),
        roleId: Number(values.roleId),
        accountStatus: values.accountStatus,
        ...(values.password ? { password: values.password } : {}),
      };
      return editing ? usersApi.update(editing.id, payload) : usersApi.create(payload);
    },
    onSuccess: async () => {
      setDialogOpen(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      setFormError(null);
      await refresh();
    },
    onError: (err: Error) => setFormError(err.message),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: AccountStatus }) =>
      usersApi.setStatus(id, status),
    onSuccess: async () => {
      setActionError(null);
      await refresh();
    },
    onError: (err: Error) => setActionError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => usersApi.remove(id),
    onSuccess: async () => {
      setDeleteTarget(null);
      setDeleteError(null);
      await refresh();
    },
    onError: (err: Error) => setDeleteError(err.message),
  });

  const filtered = useMemo(() => {
    const users = usersQuery.data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.studentId ?? "", u.email, u.role, String(u.status)]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [usersQuery.data, query]);

  function openCreate() {
    setEditing(null);
    setFormError(null);
    setForm({ ...EMPTY_FORM, roleId: roles[0] ? String(roles[0].roleId) : "" });
    setDialogOpen(true);
  }

  function openEdit(user: AdminUser) {
    setEditing(user);
    setFormError(null);
    setForm({
      studentId: user.studentId ?? "",
      email: user.email,
      password: "",
      roleId: String(user.roleId ?? roleIdByName.get(user.role?.toLowerCase() ?? "") ?? ""),
      accountStatus: String(user.status || "Active"),
    });
    setDialogOpen(true);
  }

  function submit() {
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setFormError("A valid email address is required.");
      return;
    }
    if (!form.roleId) {
      setFormError("Please select a role.");
      return;
    }
    if (!editing && form.password.length < 8) {
      setFormError("Password is required and must be at least 8 characters.");
      return;
    }
    if (editing && form.password && form.password.length < 8) {
      setFormError("New password must be at least 8 characters.");
      return;
    }
    saveMutation.mutate(form);
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by student ID, email, role or status"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label="Search users"
          />
        </div>
        <Button variant="outline" onClick={() => refresh()} disabled={usersQuery.isFetching}>
          <RefreshCw className={`size-4 ${usersQuery.isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Add User
        </Button>
      </div>

      {(usersQuery.isError || actionError) && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>
            {actionError ??
              (usersQuery.error instanceof Error
                ? usersQuery.error.message
                : "Failed to load users.")}
          </span>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {usersQuery.isPending ? (
            <div className="space-y-3 p-6">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
                <Users className="size-6" />
              </span>
              <p className="text-sm text-muted-foreground">
                {query ? "No users match your search." : "No users found in the database."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {user.id}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{user.studentId ?? "—"}</TableCell>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={String(user.status)}
                          onValueChange={(value) =>
                            statusMutation.mutate({ id: user.id, status: value as AccountStatus })
                          }
                        >
                          <SelectTrigger className="h-8 w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ACCOUNT_STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDate(user.updatedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Edit ${user.email}`}
                            onClick={() => openEdit(user)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Delete ${user.email}`}
                            onClick={() => {
                              setDeleteError(null);
                              setDeleteTarget(user);
                            }}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {usersQuery.data?.length ?? 0} users from the live database.
        Passwords are stored as bcrypt hashes and are never returned by the API.
      </p>

      {/* Create / edit dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditing(null);
            setFormError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit user" : "Add user"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the account details. Leave the password blank to keep the current one."
                : "Create a new account. The password is hashed with bcrypt before storage."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-1">
            <div className="grid gap-2">
              <Label htmlFor="studentId">Student ID</Label>
              <Input
                id="studentId"
                value={form.studentId}
                maxLength={50}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                placeholder="25BCE0450"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                maxLength={255}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">
                {editing ? "New password (optional)" : "Password"}
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                maxLength={128}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editing ? "Leave blank to keep current password" : "At least 8 characters"}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Role</Label>
                <Select
                  value={form.roleId}
                  onValueChange={(value) => setForm({ ...form, roleId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.roleId} value={String(r.roleId)}>
                        {r.roleName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Account status</Label>
                <Select
                  value={form.accountStatus}
                  onValueChange={(value) => setForm({ ...form, accountStatus: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACCOUNT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formError && (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving…" : editing ? "Save changes" : "Create user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.email} will be permanently removed. If related clinical records exist,
              the database will refuse the deletion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {deleteError}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete user"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogFooter>
      </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
