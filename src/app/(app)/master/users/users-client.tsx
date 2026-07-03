"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createUser, updateUser, deleteUser } from "@/app/actions/users";
import { ROLE_LABELS, type Role } from "@/lib/rbac";
import { UserCog, UserPlus, Pencil, Loader2, Ban } from "lucide-react";

interface Row {
  id: number;
  username: string;
  name: string;
  role: Role;
  isActive: boolean;
}

const ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "MANAGER", "OPERATOR"];

export function UsersClient({ rows, currentUserId }: { rows: Row[]; currentUserId: number }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<Row | null>(null);
  const [creating, setCreating] = React.useState(false);

  async function toggleActive(u: Row) {
    if (u.id === currentUserId) return toast.error("You can't disable your own account.");
    const res = await deleteUser(u.id);
    if (res.ok) {
      toast.success("User disabled");
      router.refresh();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <>
      <PageHeader title="User Management" description="Manage staff accounts and role-based access.">
        <Button onClick={() => setCreating(true)}>
          <UserPlus className="h-4 w-4" /> Add User
        </Button>
      </PageHeader>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">
                  {u.name || "—"}
                  {u.id === currentUserId && <Badge variant="secondary" className="ml-2">You</Badge>}
                </TableCell>
                <TableCell className="text-muted-foreground">@{u.username}</TableCell>
                <TableCell>
                  <Badge variant={u.role === "SUPER_ADMIN" || u.role === "ADMIN" ? "default" : "secondary"}>
                    {ROLE_LABELS[u.role]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {u.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Disabled</Badge>}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(u)}>
                      <Pencil className="h-4 w-4" /> Edit
                    </Button>
                    {u.isActive && u.id !== currentUserId && (
                      <Button variant="ghost" size="sm" className="text-red-400" onClick={() => toggleActive(u)}>
                        <Ban className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <UserDialog
        open={creating || !!editing}
        onOpenChange={(o) => {
          if (!o) {
            setCreating(false);
            setEditing(null);
          }
        }}
        user={editing}
        onSaved={() => {
          setCreating(false);
          setEditing(null);
          router.refresh();
        }}
      />
    </>
  );
}

function UserDialog({
  open,
  onOpenChange,
  user,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  user: Row | null;
  onSaved: () => void;
}) {
  const editing = !!user;
  const [username, setUsername] = React.useState("");
  const [name, setName] = React.useState("");
  const [role, setRole] = React.useState<Role>("OPERATOR");
  const [password, setPassword] = React.useState("");
  const [active, setActive] = React.useState(true);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setUsername(user?.username ?? "");
      setName(user?.name ?? "");
      setRole(user?.role ?? "OPERATOR");
      setPassword("");
      setActive(user?.isActive ?? true);
    }
  }, [open, user]);

  async function submit() {
    setLoading(true);
    const payload = { username, name, role, password, isActive: active };
    const res = editing ? await updateUser(user!.id, payload) : await createUser(payload);
    setLoading(false);
    if (res.ok) {
      toast.success(editing ? "User updated" : "User created");
      onSaved();
    } else {
      toast.error(res.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit user" : "New user"}</DialogTitle>
          <DialogDescription>Staff account and role.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Username</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} disabled={editing} />
            </div>
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{editing ? "New password (leave blank to keep)" : "Password"}</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />
          </div>
          <div className="flex items-center justify-between">
            <Label>Active</Label>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
