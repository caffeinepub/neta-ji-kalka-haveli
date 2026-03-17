import type {
  AccountInfo,
  AdminRole,
  MenuItem,
  SessionInfo,
} from "@/backend.d";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActor } from "@/hooks/useActor";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle2,
  ChefHat,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function roleLabel(role: AdminRole): string {
  if ("mainAdmin" in role) return "Main Admin";
  if ("admin" in role) return "Admin";
  return "Staff";
}

function roleBadgeVariant(
  role: AdminRole,
): "default" | "secondary" | "outline" {
  if ("mainAdmin" in role) return "default";
  if ("admin" in role) return "secondary";
  return "outline";
}

export default function DashboardPage() {
  const { actor } = useActor();
  const navigate = useNavigate();
  // biome-ignore lint/suspicious/noExplicitAny: backend.ts types are stale; runtime canister has updated API
  const be = actor as any;

  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Menu
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuDialogOpen, setMenuDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [menuForm, setMenuForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    isAvailable: true,
  });
  const [menuSaving, setMenuSaving] = useState(false);
  const [deleteMenuDialog, setDeleteMenuDialog] = useState<MenuItem | null>(
    null,
  );

  // Users
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [createUserDialog, setCreateUserDialog] = useState(false);
  const [userForm, setUserForm] = useState({
    email: "",
    password: "",
    role: "staff",
  });
  const [userSaving, setUserSaving] = useState(false);
  const [resetPwDialog, setResetPwDialog] = useState<AccountInfo | null>(null);
  const [resetPwValue, setResetPwValue] = useState("");
  const [removeDialog, setRemoveDialog] = useState<AccountInfo | null>(null);
  const [transferDialog, setTransferDialog] = useState(false);
  const [transferTarget, setTransferTarget] = useState("");

  // Change password tab
  const [cpOld, setCpOld] = useState("");
  const [cpNew, setCpNew] = useState("");
  const [cpConfirm, setCpConfirm] = useState("");
  const [cpSaving, setCpSaving] = useState(false);
  const [cpError, setCpError] = useState("");
  const [cpSuccess, setCpSuccess] = useState(false);

  // ---- Auth guard ----
  useEffect(() => {
    const t = localStorage.getItem("sessionToken");
    if (!t || !be) return;
    be.validateToken(t)
      .then(async (info: SessionInfo | null) => {
        if (!info) {
          localStorage.removeItem("sessionToken");
          localStorage.removeItem("sessionInfo");
          navigate({ to: "/admin-login" });
          return;
        }
        if ("staff" in info.role) {
          navigate({ to: "/staff-dashboard" });
          return;
        }
        setToken(t);
        setSessionInfo(info);
        localStorage.setItem("sessionInfo", JSON.stringify(info));
        setIsLoading(false);
        await Promise.all([loadMenu(t), loadAccounts(t)]);
      })
      .catch(() => {
        localStorage.removeItem("sessionToken");
        localStorage.removeItem("sessionInfo");
        navigate({ to: "/admin-login" });
      });
  }, [be, navigate]);

  useEffect(() => {
    if (!localStorage.getItem("sessionToken")) navigate({ to: "/admin-login" });
  }, [navigate]);

  // ---- Data loaders ----
  async function loadMenu(t: string) {
    setMenuLoading(true);
    try {
      const items: MenuItem[] = await be.getAllMenuItems(t);
      setMenuItems(items);
    } catch {
      toast.error("Failed to load menu items.");
    } finally {
      setMenuLoading(false);
    }
  }

  async function loadAccounts(t: string) {
    setAccountsLoading(true);
    try {
      const list: AccountInfo[] = await be.listAccounts(t);
      setAccounts(list);
    } catch {
      toast.error("Failed to load accounts.");
    } finally {
      setAccountsLoading(false);
    }
  }

  // ---- Actions ----
  async function handleLogout() {
    try {
      await be.logout(token);
    } catch {
      /* silent */
    }
    localStorage.removeItem("sessionToken");
    localStorage.removeItem("sessionInfo");
    navigate({ to: "/admin-login" });
  }

  async function handleInitMenu() {
    try {
      await be.initializeMenu(token);
      await loadMenu(token);
      toast.success("Menu initialized with sample items.");
    } catch {
      toast.error(
        "Menu may already be initialized. Try adding items manually.",
      );
    }
  }

  function openAddMenu() {
    setEditingItem(null);
    setMenuForm({
      name: "",
      description: "",
      price: "",
      category: "",
      isAvailable: true,
    });
    setMenuDialogOpen(true);
  }

  function openEditMenu(item: MenuItem) {
    setEditingItem(item);
    setMenuForm({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      isAvailable: item.isAvailable,
    });
    setMenuDialogOpen(true);
  }

  async function handleSaveMenu() {
    if (!menuForm.name || !menuForm.price || !menuForm.category) {
      toast.error("Name, price, and category are required.");
      return;
    }
    setMenuSaving(true);
    try {
      if (editingItem) {
        await be.updateMenuItem(
          token,
          editingItem.id,
          menuForm.name,
          menuForm.description,
          menuForm.price,
          menuForm.category,
          menuForm.isAvailable,
        );
        toast.success("Menu item updated.");
      } else {
        await be.createMenuItem(
          token,
          menuForm.name,
          menuForm.description,
          menuForm.price,
          menuForm.category,
        );
        toast.success("Menu item created.");
      }
      setMenuDialogOpen(false);
      await loadMenu(token);
    } catch {
      toast.error("Failed to save menu item.");
    } finally {
      setMenuSaving(false);
    }
  }

  async function handleDeleteMenu() {
    if (!deleteMenuDialog) return;
    try {
      await be.deleteMenuItem(token, deleteMenuDialog.id);
      toast.success("Menu item deleted.");
      setDeleteMenuDialog(null);
      await loadMenu(token);
    } catch {
      toast.error("Failed to delete menu item.");
    }
  }

  async function handleCreateUser() {
    if (!userForm.email || !userForm.password) {
      toast.error("Email and password are required.");
      return;
    }
    setUserSaving(true);
    try {
      const hash = await hashPassword(userForm.password);
      let role: AdminRole;
      if (userForm.role === "admin") role = { admin: null };
      else role = { staff: null };
      const ok: boolean = await be.createAccount(
        token,
        userForm.email,
        hash,
        role,
      );
      if (!ok) {
        toast.error("Failed to create account.");
        setUserSaving(false);
        return;
      }
      toast.success("Account created successfully.");
      setCreateUserDialog(false);
      setUserForm({ email: "", password: "", role: "staff" });
      await loadAccounts(token);
    } catch {
      toast.error("Failed to create account.");
    } finally {
      setUserSaving(false);
    }
  }

  async function handleResetPassword() {
    if (!resetPwDialog || !resetPwValue) return;
    try {
      const hash = await hashPassword(resetPwValue);
      const ok: boolean = await be.adminResetPassword(
        token,
        resetPwDialog.email,
        hash,
      );
      if (!ok) {
        toast.error("Failed to reset password.");
        return;
      }
      toast.success("Password reset successfully.");
      setResetPwDialog(null);
      setResetPwValue("");
    } catch {
      toast.error("Failed to reset password.");
    }
  }

  async function handleRemoveAccount() {
    if (!removeDialog) return;
    try {
      const ok: boolean = await be.removeAccount(token, removeDialog.email);
      if (!ok) {
        toast.error("Failed to remove account.");
        return;
      }
      toast.success("Account removed.");
      setRemoveDialog(null);
      await loadAccounts(token);
    } catch {
      toast.error("Failed to remove account.");
    }
  }

  async function handleTransferMainAdmin() {
    if (!transferTarget) {
      toast.error("Please select a user to transfer to.");
      return;
    }
    try {
      const ok: boolean = await be.transferMainAdmin(token, transferTarget);
      if (!ok) {
        toast.error("Transfer failed.");
        return;
      }
      toast.success("Main admin role transferred. Logging out…");
      setTransferDialog(false);
      setTimeout(handleLogout, 2000);
    } catch {
      toast.error("Transfer failed.");
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setCpError("");
    setCpSuccess(false);
    if (cpNew !== cpConfirm) {
      setCpError("New passwords do not match.");
      return;
    }
    if (cpNew.length < 6) {
      setCpError("Password must be at least 6 characters.");
      return;
    }
    setCpSaving(true);
    try {
      const oldHash = await hashPassword(cpOld);
      const newHash = await hashPassword(cpNew);
      const ok: boolean = await be.changePassword(token, oldHash, newHash);
      if (!ok) {
        setCpError("Password change failed. Check your current password.");
        setCpSaving(false);
        return;
      }
      setCpSuccess(true);
      setCpOld("");
      setCpNew("");
      setCpConfirm("");
      toast.success("Password changed successfully.");
    } catch {
      setCpError("Password change failed.");
    } finally {
      setCpSaving(false);
    }
  }

  const isMainAdmin = sessionInfo ? "mainAdmin" in sessionInfo.role : false;
  const categories = [...new Set(menuItems.map((i) => i.category))];
  const nonMainAdminAccounts = accounts.filter((a) => !("mainAdmin" in a.role));

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-background"
        data-ocid="dashboard.loading_state"
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-primary text-primary-foreground shadow-warm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChefHat className="h-6 w-6" />
            <div>
              <h1 className="font-display text-lg font-bold leading-tight">
                Neta Ji Kalka Haveli
              </h1>
              <p className="text-xs opacity-75">Admin Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{sessionInfo?.email}</p>
              <Badge
                variant="outline"
                className="text-xs border-primary-foreground/40 text-primary-foreground"
              >
                {sessionInfo ? roleLabel(sessionInfo.role) : ""}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10"
              onClick={handleLogout}
              data-ocid="dashboard.logout_button"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="menu">
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="menu" data-ocid="dashboard.menu_tab">
              Menu
            </TabsTrigger>
            {isMainAdmin && (
              <TabsTrigger value="users" data-ocid="dashboard.users_tab">
                Users
              </TabsTrigger>
            )}
            {isMainAdmin && (
              <TabsTrigger value="settings" data-ocid="dashboard.settings_tab">
                Settings
              </TabsTrigger>
            )}
            <TabsTrigger value="password" data-ocid="dashboard.password_tab">
              Password
            </TabsTrigger>
          </TabsList>

          {/* ── Menu Tab ── */}
          <TabsContent value="menu">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl font-bold">
                Menu Management
              </h2>
              <div className="flex gap-2">
                {menuItems.length === 0 && (
                  <Button variant="outline" size="sm" onClick={handleInitMenu}>
                    Initialize Menu
                  </Button>
                )}
                <Button
                  onClick={openAddMenu}
                  data-ocid="dashboard.menu_add_button"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>
            </div>

            {menuLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : menuItems.length === 0 ? (
              <Card data-ocid="dashboard.menu.empty_state">
                <CardContent className="py-12 text-center text-muted-foreground">
                  No menu items yet. Click “Add Item” or “Initialize Menu” to
                  get started.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {categories.map((cat) => (
                  <div key={cat}>
                    <h3 className="font-display text-lg font-semibold mb-3 border-b pb-2">
                      {cat}
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {menuItems
                        .filter((i) => i.category === cat)
                        .map((item, idx) => (
                          <Card
                            key={item.id.toString()}
                            data-ocid={`dashboard.menu_item.${idx + 1}`}
                          >
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold truncate">
                                    {item.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                    {item.description}
                                  </p>
                                  <p className="text-sm font-medium text-primary mt-1">
                                    {item.price}
                                  </p>
                                </div>
                                <Badge
                                  variant={
                                    item.isAvailable ? "default" : "secondary"
                                  }
                                  className="shrink-0 text-xs"
                                >
                                  {item.isAvailable ? "Available" : "Off"}
                                </Badge>
                              </div>
                              <div className="flex gap-2 mt-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => openEditMenu(item)}
                                >
                                  <Pencil className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setDeleteMenuDialog(item)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Users Tab (mainAdmin only) ── */}
          {isMainAdmin && (
            <TabsContent value="users">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-2xl font-bold">
                  User Management
                </h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTransferDialog(true)}
                  >
                    Transfer Main Admin
                  </Button>
                  <Button
                    onClick={() => setCreateUserDialog(true)}
                    data-ocid="dashboard.user_create_button"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Create Account
                  </Button>
                </div>
              </div>

              {accountsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : accounts.length === 0 ? (
                <Card data-ocid="dashboard.users.empty_state">
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No accounts found.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {accounts.map((acc, idx) => (
                    <Card
                      key={acc.id.toString()}
                      data-ocid={`dashboard.user_item.${idx + 1}`}
                    >
                      <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium">{acc.email}</p>
                          <Badge
                            variant={roleBadgeVariant(acc.role)}
                            className="text-xs mt-1"
                          >
                            {roleLabel(acc.role)}
                          </Badge>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setResetPwDialog(acc);
                              setResetPwValue("");
                            }}
                          >
                            Reset Password
                          </Button>
                          {!("mainAdmin" in acc.role) && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setRemoveDialog(acc)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {/* ── Settings Tab (mainAdmin only) ── */}
          {isMainAdmin && (
            <TabsContent value="settings">
              <h2 className="font-display text-2xl font-bold mb-4">
                Restaurant Settings
              </h2>
              <Card className="max-w-lg">
                <CardHeader>
                  <CardTitle>About this Restaurant</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Name:</span> Neta Ji Kalka
                      Haveli Family Restaurant
                    </div>
                    <div>
                      <span className="font-medium">Admin Email:</span>{" "}
                      {sessionInfo?.email}
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm mt-4">
                    Extended restaurant settings (contact info, address, UPI)
                    will be available in a future update.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* ── Change Password Tab ── */}
          <TabsContent value="password">
            <h2 className="font-display text-2xl font-bold mb-4">
              Change Password
            </h2>
            <Card className="max-w-md">
              <CardContent className="pt-6">
                <form onSubmit={handleChangePassword} className="space-y-4">
                  {cpError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{cpError}</AlertDescription>
                    </Alert>
                  )}
                  {cpSuccess && (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>
                        Password changed successfully.
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-1">
                    <Label htmlFor="cp-old">Current Password</Label>
                    <Input
                      id="cp-old"
                      type="password"
                      value={cpOld}
                      onChange={(e) => setCpOld(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="cp-new">New Password</Label>
                    <Input
                      id="cp-new"
                      type="password"
                      value={cpNew}
                      onChange={(e) => setCpNew(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="cp-confirm">Confirm New Password</Label>
                    <Input
                      id="cp-confirm"
                      type="password"
                      value={cpConfirm}
                      onChange={(e) => setCpConfirm(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={cpSaving}>
                    {cpSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating…
                      </>
                    ) : (
                      "Change Password"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* ── Add / Edit Menu Dialog ── */}
      <Dialog open={menuDialogOpen} onOpenChange={setMenuDialogOpen}>
        <DialogContent data-ocid="dashboard.menu.dialog">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Menu Item" : "Add Menu Item"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input
                value={menuForm.name}
                onChange={(e) =>
                  setMenuForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g. Dal Makhani"
              />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input
                value={menuForm.description}
                onChange={(e) =>
                  setMenuForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Brief description"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Price</Label>
                <Input
                  value={menuForm.price}
                  onChange={(e) =>
                    setMenuForm((p) => ({ ...p, price: e.target.value }))
                  }
                  placeholder="₹220"
                />
              </div>
              <div className="space-y-1">
                <Label>Category</Label>
                <Input
                  value={menuForm.category}
                  onChange={(e) =>
                    setMenuForm((p) => ({ ...p, category: e.target.value }))
                  }
                  placeholder="Main Course"
                />
              </div>
            </div>
            {editingItem && (
              <div className="flex items-center gap-2">
                <Switch
                  checked={menuForm.isAvailable}
                  onCheckedChange={(v) =>
                    setMenuForm((p) => ({ ...p, isAvailable: v }))
                  }
                />
                <Label>
                  {menuForm.isAvailable ? "Available" : "Unavailable"}
                </Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMenuDialogOpen(false)}
              data-ocid="dashboard.menu.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveMenu}
              disabled={menuSaving}
              data-ocid="dashboard.menu.save_button"
            >
              {menuSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Menu Confirm ── */}
      <Dialog
        open={!!deleteMenuDialog}
        onOpenChange={(o) => !o && setDeleteMenuDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Menu Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete “{deleteMenuDialog?.name}”? This
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteMenuDialog(null)}
              data-ocid="dashboard.menu.delete.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteMenu}
              data-ocid="dashboard.menu.delete.confirm_button"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create User Dialog ── */}
      <Dialog open={createUserDialog} onOpenChange={setCreateUserDialog}>
        <DialogContent data-ocid="dashboard.users.dialog">
          <DialogHeader>
            <DialogTitle>Create Account</DialogTitle>
            <DialogDescription>
              Create a new admin or staff account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                type="email"
                value={userForm.email}
                onChange={(e) =>
                  setUserForm((p) => ({ ...p, email: e.target.value }))
                }
                placeholder="user@restaurant.com"
              />
            </div>
            <div className="space-y-1">
              <Label>Temporary Password</Label>
              <Input
                type="password"
                value={userForm.password}
                onChange={(e) =>
                  setUserForm((p) => ({ ...p, password: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <Select
                value={userForm.role}
                onValueChange={(v) => setUserForm((p) => ({ ...p, role: v }))}
              >
                <SelectTrigger data-ocid="dashboard.users.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateUserDialog(false)}
              data-ocid="dashboard.users.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={userSaving}
              data-ocid="dashboard.users.submit_button"
            >
              {userSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reset Password Dialog ── */}
      <Dialog
        open={!!resetPwDialog}
        onOpenChange={(o) => !o && setResetPwDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new temporary password for {resetPwDialog?.email}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-1">
            <Label>New Password</Label>
            <Input
              type="password"
              value={resetPwValue}
              onChange={(e) => setResetPwValue(e.target.value)}
              placeholder="Minimum 6 characters"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPwDialog(null)}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword}>Reset Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Remove Account Confirm ── */}
      <Dialog
        open={!!removeDialog}
        onOpenChange={(o) => !o && setRemoveDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {removeDialog?.email}? This cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemoveDialog(null)}
              data-ocid="dashboard.users.remove.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveAccount}
              data-ocid="dashboard.users.remove.confirm_button"
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Transfer Main Admin Dialog ── */}
      <Dialog open={transferDialog} onOpenChange={setTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Main Admin</DialogTitle>
            <DialogDescription>
              Transfer your main admin role to another user. You will lose main
              admin privileges immediately after this action.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-1">
            <Label>Select User</Label>
            <Select value={transferTarget} onValueChange={setTransferTarget}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choose a user…" />
              </SelectTrigger>
              <SelectContent>
                {nonMainAdminAccounts.map((a) => (
                  <SelectItem key={a.id.toString()} value={a.email}>
                    {a.email} ({roleLabel(a.role)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleTransferMainAdmin}>
              Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <footer className="text-center text-xs text-muted-foreground py-6 mt-8 border-t">
        © {new Date().getFullYear()}. Built with ♥ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
            typeof window !== "undefined" ? window.location.hostname : "",
          )}`}
          target="_blank"
          rel="noreferrer"
          className="hover:underline"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
