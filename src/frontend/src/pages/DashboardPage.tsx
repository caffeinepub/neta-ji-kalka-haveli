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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  Check,
  ChefHat,
  KeyRound,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Pencil,
  Plus,
  Trash2,
  Users,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { AccountInfo, MenuItem } from "../backend.d";
import type { backendInterface as BackendAPI } from "../backend.d";
import { createActorWithConfig } from "../config";
import {
  type StoredSession,
  clearSession,
  getSession,
  hashPassword,
  isMainAdmin,
  updateMustChangePassword,
} from "../lib/auth";

type Section = "menu" | "admins" | "password";

const CATEGORIES = ["Veg", "Non-Veg", "Drinks", "Breads", "Desserts"];

const CATEGORY_COLORS: Record<string, string> = {
  Veg: "bg-green-500/20 text-green-300 border-green-500/30",
  "Non-Veg": "bg-red-500/20 text-red-300 border-red-500/30",
  Drinks: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Breads: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Desserts: "bg-pink-500/20 text-pink-300 border-pink-500/30",
};

function CategoryBadge({ cat }: { cat: string }) {
  const cls =
    CATEGORY_COLORS[cat] ?? "bg-gray-500/20 text-gray-300 border-gray-500/30";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}
    >
      {cat}
    </span>
  );
}

function getRoleLabel(session: StoredSession): string {
  if ("mainAdmin" in session.role) return "Main Admin";
  if ("admin" in session.role) return "Admin";
  return "Staff";
}

function getAccountRoleLabel(account: AccountInfo): string {
  if ("mainAdmin" in account.role) return "Main Admin";
  if ("admin" in account.role) return "Admin";
  return "Staff";
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<StoredSession | null>(() =>
    getSession(),
  );
  const [activeSection, setActiveSection] = useState<Section>("menu");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Force change password modal
  const [showChangePwModal, setShowChangePwModal] = useState(false);

  // Menu state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(false);
  const [menuDialogOpen, setMenuDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<MenuItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCategory, setFormCategory] = useState("Veg");
  const [formAvailable, setFormAvailable] = useState(true);
  const [formLoading, setFormLoading] = useState(false);

  // Admin management state
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [addAccountOpen, setAddAccountOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "staff">("staff");
  const [addAccountLoading, setAddAccountLoading] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<AccountInfo | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  // Change password state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);

  // Forced change password modal state
  const [forcedCurrentPw, setForcedCurrentPw] = useState("");
  const [forcedNewPw, setForcedNewPw] = useState("");
  const [forcedConfirmPw, setForcedConfirmPw] = useState("");
  const [forcedPwLoading, setForcedPwLoading] = useState(false);
  const [forcedPwError, setForcedPwError] = useState("");

  // Validate session on mount
  useEffect(() => {
    async function validateSession() {
      const stored = getSession();
      if (!stored) {
        navigate({ to: "/admin-login" });
        return;
      }
      try {
        const actor = (await createActorWithConfig()) as unknown as BackendAPI;
        const info = await actor.validateToken(stored.token);
        if (!info) {
          clearSession();
          navigate({ to: "/admin-login" });
          return;
        }
        // Update session with fresh data
        const updated: StoredSession = {
          ...stored,
          email: info.email,
          role: info.role,
          mustChangePassword: info.mustChangePassword,
        };
        localStorage.setItem("sessionInfo", JSON.stringify(updated));
        setSession(updated);
        if (info.mustChangePassword) {
          setShowChangePwModal(true);
        }
      } catch (err) {
        console.error(err);
        clearSession();
        navigate({ to: "/admin-login" });
      }
    }
    validateSession();
  }, [navigate]);

  const loadMenu = useCallback(async () => {
    const stored = getSession();
    if (!stored) return;
    setMenuLoading(true);
    try {
      const actor = (await createActorWithConfig()) as unknown as BackendAPI;
      const items = await actor.getAllMenuItems(stored.token);
      setMenuItems(items);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load menu items");
    } finally {
      setMenuLoading(false);
    }
  }, []);

  const loadAccounts = useCallback(async () => {
    const stored = getSession();
    if (!stored) return;
    setAccountsLoading(true);
    try {
      const actor = (await createActorWithConfig()) as unknown as BackendAPI;
      const list = await actor.listAccounts(stored.token);
      setAccounts(list);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load accounts");
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) loadMenu();
  }, [loadMenu, session]);

  useEffect(() => {
    if (session && activeSection === "admins") loadAccounts();
  }, [activeSection, loadAccounts, session]);

  function openAddMenu() {
    setEditingItem(null);
    setFormName("");
    setFormDesc("");
    setFormPrice("");
    setFormCategory("Veg");
    setFormAvailable(true);
    setMenuDialogOpen(true);
  }

  function openEditMenu(item: MenuItem) {
    setEditingItem(item);
    setFormName(item.name);
    setFormDesc(item.description);
    setFormPrice(item.price);
    setFormCategory(item.category);
    setFormAvailable(item.isAvailable);
    setMenuDialogOpen(true);
  }

  async function handleMenuSave() {
    const stored = getSession();
    if (!stored) return;
    if (!formName.trim() || !formPrice.trim() || !formCategory) {
      toast.error("Name, price, and category are required");
      return;
    }
    setFormLoading(true);
    try {
      const actor = (await createActorWithConfig()) as unknown as BackendAPI;
      if (editingItem) {
        await actor.updateMenuItem(
          stored.token,
          editingItem.id,
          formName.trim(),
          formDesc.trim(),
          formPrice.trim(),
          formCategory,
          formAvailable,
        );
        toast.success("Menu item updated");
      } else {
        await actor.createMenuItem(
          stored.token,
          formName.trim(),
          formDesc.trim(),
          formPrice.trim(),
          formCategory,
        );
        toast.success("Menu item added");
      }
      setMenuDialogOpen(false);
      await loadMenu();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save menu item");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete() {
    const stored = getSession();
    if (!stored || !deleteItem) return;
    setDeleteLoading(true);
    try {
      const actor = (await createActorWithConfig()) as unknown as BackendAPI;
      await actor.deleteMenuItem(stored.token, deleteItem.id);
      toast.success("Item deleted");
      setDeleteItem(null);
      await loadMenu();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete item");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleInitMenu() {
    const stored = getSession();
    if (!stored) return;
    setInitLoading(true);
    try {
      const actor = (await createActorWithConfig()) as unknown as BackendAPI;
      await actor.initializeMenu(stored.token);
      toast.success("Menu initialized with default items");
      await loadMenu();
    } catch (err) {
      console.error(err);
      toast.error("Failed to initialize menu");
    } finally {
      setInitLoading(false);
    }
  }

  async function handleToggleAvailable(item: MenuItem) {
    const stored = getSession();
    if (!stored) return;
    try {
      const actor = (await createActorWithConfig()) as unknown as BackendAPI;
      await actor.updateMenuItem(
        stored.token,
        item.id,
        item.name,
        item.description,
        item.price,
        item.category,
        !item.isAvailable,
      );
      await loadMenu();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update availability");
    }
  }

  async function handleAddAccount() {
    const stored = getSession();
    if (!stored) return;
    if (!newEmail.trim() || !newPassword.trim()) {
      toast.error("Email and password are required");
      return;
    }
    setAddAccountLoading(true);
    try {
      const actor = (await createActorWithConfig()) as unknown as BackendAPI;
      const hash = await hashPassword(newPassword);
      const role = newRole === "admin" ? { admin: null } : { staff: null };
      const ok = await actor.createAccount(
        stored.token,
        newEmail.trim().toLowerCase(),
        hash,
        role,
      );
      if (!ok) {
        toast.error("Failed to create account. Check permissions.");
        return;
      }
      toast.success("Account created");
      setAddAccountOpen(false);
      setNewEmail("");
      setNewPassword("");
      setNewRole("staff");
      await loadAccounts();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create account");
    } finally {
      setAddAccountLoading(false);
    }
  }

  async function handleRemoveAccount() {
    const stored = getSession();
    if (!stored || !removeTarget) return;
    setRemoveLoading(true);
    try {
      const actor = (await createActorWithConfig()) as unknown as BackendAPI;
      const ok = await actor.removeAccount(stored.token, removeTarget.email);
      if (!ok) {
        toast.error("Failed to remove account. Check permissions.");
        return;
      }
      toast.success("Account removed");
      setRemoveTarget(null);
      await loadAccounts();
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove account");
    } finally {
      setRemoveLoading(false);
    }
  }

  async function handleChangePassword() {
    const stored = getSession();
    if (!stored) return;
    if (!currentPw || !newPw || !confirmPw) {
      toast.error("All fields are required");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPw.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setPwLoading(true);
    try {
      const actor = (await createActorWithConfig()) as unknown as BackendAPI;
      const oldHash = await hashPassword(currentPw);
      const newHash = await hashPassword(newPw);
      const ok = await actor.changePassword(stored.token, oldHash, newHash);
      if (!ok) {
        toast.error("Current password is incorrect");
        return;
      }
      setPwSuccess(true);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      toast.success("Password changed successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to change password");
    } finally {
      setPwLoading(false);
    }
  }

  async function handleForcedChangePassword() {
    const stored = getSession();
    if (!stored) return;
    setForcedPwError("");
    if (!forcedCurrentPw || !forcedNewPw || !forcedConfirmPw) {
      setForcedPwError("All fields are required");
      return;
    }
    if (forcedNewPw !== forcedConfirmPw) {
      setForcedPwError("New passwords do not match");
      return;
    }
    if (forcedNewPw.length < 6) {
      setForcedPwError("Password must be at least 6 characters");
      return;
    }
    setForcedPwLoading(true);
    try {
      const actor = (await createActorWithConfig()) as unknown as BackendAPI;
      const oldHash = await hashPassword(forcedCurrentPw);
      const newHash = await hashPassword(forcedNewPw);
      const ok = await actor.changePassword(stored.token, oldHash, newHash);
      if (!ok) {
        setForcedPwError("Current password is incorrect");
        return;
      }
      updateMustChangePassword(false);
      setSession((prev) =>
        prev ? { ...prev, mustChangePassword: false } : prev,
      );
      setShowChangePwModal(false);
      setForcedCurrentPw("");
      setForcedNewPw("");
      setForcedConfirmPw("");
      toast.success("Password updated! Welcome.");
    } catch (err) {
      console.error(err);
      setForcedPwError("Failed to change password");
    } finally {
      setForcedPwLoading(false);
    }
  }

  async function handleLogout() {
    const stored = getSession();
    if (stored) {
      try {
        const actor = (await createActorWithConfig()) as unknown as BackendAPI;
        await actor.logout(stored.token);
      } catch {
        // ignore
      }
    }
    clearSession();
    toast.success("Logged out");
    navigate({ to: "/admin-login" });
  }

  if (!session) return null;

  const mainAdmin = isMainAdmin(session);

  const navItems = [
    { id: "menu" as Section, icon: LayoutDashboard, label: "Menu Management" },
    ...(mainAdmin
      ? [{ id: "admins" as Section, icon: Users, label: "Admin Management" }]
      : []),
    { id: "password" as Section, icon: KeyRound, label: "Change Password" },
  ];

  return (
    <div className="min-h-screen bg-[oklch(0.11_0.02_20)] text-white flex">
      {/* Sidebar overlay for mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[oklch(0.15_0.03_20)] border-r border-white/10 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-secondary/20 flex items-center justify-center">
              <UtensilsCrossed className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="font-display font-bold text-sm text-white leading-tight">
                Neta Ji Kalka Haveli
              </p>
              <p className="text-xs text-white/40">Management Panel</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 bg-white/5">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
            Logged in as
          </p>
          <p className="text-sm font-medium text-white truncate">
            {session.email}
          </p>
          <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs bg-secondary/20 text-secondary border border-secondary/30">
            {getRoleLabel(session)}
          </span>
        </div>

        <nav className="flex-1 p-3 space-y-1" data-ocid="dashboard.nav.panel">
          {navItems.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => {
                setActiveSection(item.id);
                setSidebarOpen(false);
              }}
              data-ocid={`dashboard.${item.id}.tab`}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body font-medium transition-all ${
                activeSection === item.id
                  ? "bg-secondary/20 text-secondary border border-secondary/30"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <button
            type="button"
            onClick={handleLogout}
            data-ocid="dashboard.logout.button"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-[oklch(0.15_0.03_20)] border-b border-white/10 px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            className="lg:hidden p-1.5 rounded text-white/60 hover:text-white hover:bg-white/10"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-lg font-bold text-white">
              Neta Ji Kalka Haveli
            </h1>
            <p className="text-xs text-white/40">
              {activeSection === "menu" && "Menu Management"}
              {activeSection === "admins" && "Admin Management"}
              {activeSection === "password" && "Change Password"}
            </p>
          </div>
          <ChefHat className="h-6 w-6 text-secondary/60" />
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <AnimatePresence mode="wait">
            {activeSection === "menu" && (
              <motion.div
                key="menu"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <MenuSection
                  items={menuItems}
                  loading={menuLoading}
                  initLoading={initLoading}
                  onAdd={openAddMenu}
                  onEdit={openEditMenu}
                  onDelete={(item) => setDeleteItem(item)}
                  onToggle={handleToggleAvailable}
                  onInit={handleInitMenu}
                />
              </motion.div>
            )}
            {activeSection === "admins" && mainAdmin && (
              <motion.div
                key="admins"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <AdminSection
                  accounts={accounts}
                  loading={accountsLoading}
                  onAdd={() => setAddAccountOpen(true)}
                  onRemove={(account) => setRemoveTarget(account)}
                />
              </motion.div>
            )}
            {activeSection === "password" && (
              <motion.div
                key="password"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <PasswordSection
                  currentPw={currentPw}
                  newPw={newPw}
                  confirmPw={confirmPw}
                  loading={pwLoading}
                  success={pwSuccess}
                  onChange={{
                    currentPw: setCurrentPw,
                    newPw: setNewPw,
                    confirmPw: setConfirmPw,
                  }}
                  onSubmit={handleChangePassword}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Forced Change Password Modal */}
      <Dialog open={showChangePwModal} onOpenChange={() => {}}>
        <DialogContent
          className="bg-[oklch(0.17_0.03_20)] border-white/10 text-white max-w-sm"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="font-display text-white">
              Change Your Password
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-white/60 -mt-2">
            Your account requires a password change before continuing.
          </p>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label className="text-white/70">
                Current (Temporary) Password
              </Label>
              <Input
                type="password"
                value={forcedCurrentPw}
                onChange={(e) => setForcedCurrentPw(e.target.value)}
                placeholder="Current password"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                data-ocid="forced_pw.current.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70">New Password</Label>
              <Input
                type="password"
                value={forcedNewPw}
                onChange={(e) => setForcedNewPw(e.target.value)}
                placeholder="New password (min 6 chars)"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                data-ocid="forced_pw.new.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70">Confirm New Password</Label>
              <Input
                type="password"
                value={forcedConfirmPw}
                onChange={(e) => setForcedConfirmPw(e.target.value)}
                placeholder="Confirm new password"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                data-ocid="forced_pw.confirm.input"
              />
            </div>
            {forcedPwError && (
              <div
                className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2"
                data-ocid="forced_pw.error_state"
              >
                {forcedPwError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={handleForcedChangePassword}
              disabled={forcedPwLoading}
              className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
              data-ocid="forced_pw.submit_button"
            >
              {forcedPwLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Set New Password"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Menu Dialog */}
      <Dialog open={menuDialogOpen} onOpenChange={setMenuDialogOpen}>
        <DialogContent className="bg-[oklch(0.17_0.03_20)] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-white">
              {editingItem ? "Edit Menu Item" : "Add Menu Item"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-white/70">Item Name *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Dal Makhani"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                data-ocid="menu.name.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70">Description</Label>
              <Textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Brief description of the dish..."
                rows={2}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30 resize-none"
                data-ocid="menu.description.textarea"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-white/70">Price *</Label>
                <Input
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="₹220"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                  data-ocid="menu.price.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-white/70">Category *</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger
                    className="bg-white/10 border-white/20 text-white"
                    data-ocid="menu.category.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[oklch(0.17_0.03_20)] border-white/10">
                    {CATEGORIES.map((c) => (
                      <SelectItem
                        key={c}
                        value={c}
                        className="text-white hover:bg-white/10"
                      >
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {editingItem && (
              <div className="flex items-center gap-3">
                <Switch
                  checked={formAvailable}
                  onCheckedChange={setFormAvailable}
                  data-ocid="menu.available.switch"
                />
                <Label className="text-white/70">Available</Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMenuDialogOpen(false)}
              className="border-white/20 text-white/70 hover:bg-white/10"
              data-ocid="menu.dialog.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleMenuSave}
              disabled={formLoading}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
              data-ocid="menu.dialog.save_button"
            >
              {formLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save Item
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog
        open={!!deleteItem}
        onOpenChange={(o) => !o && setDeleteItem(null)}
      >
        <AlertDialogContent className="bg-[oklch(0.17_0.03_20)] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Delete Menu Item?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Are you sure you want to delete{" "}
              <strong className="text-white">{deleteItem?.name}</strong>? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-white/20 text-white/70 hover:bg-white/10"
              data-ocid="menu.delete.cancel_button"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-ocid="menu.delete.confirm_button"
            >
              {deleteLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Account Dialog */}
      <Dialog open={addAccountOpen} onOpenChange={setAddAccountOpen}>
        <DialogContent className="bg-[oklch(0.17_0.03_20)] border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-white">
              Add Account
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-white/70">Email Address</Label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="staff@example.com"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                data-ocid="admin.new_email.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70">Temporary Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Temporary password"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                data-ocid="admin.new_password.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/70">Role</Label>
              <Select
                value={newRole}
                onValueChange={(v) => setNewRole(v as "admin" | "staff")}
              >
                <SelectTrigger
                  className="bg-white/10 border-white/20 text-white"
                  data-ocid="admin.new_role.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[oklch(0.17_0.03_20)] border-white/10">
                  <SelectItem
                    value="admin"
                    className="text-white hover:bg-white/10"
                  >
                    Admin
                  </SelectItem>
                  <SelectItem
                    value="staff"
                    className="text-white hover:bg-white/10"
                  >
                    Staff
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddAccountOpen(false)}
              className="border-white/20 text-white/70 hover:bg-white/10"
              data-ocid="admin.add_staff.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddAccount}
              disabled={addAccountLoading}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
              data-ocid="admin.add_staff.submit_button"
            >
              {addAccountLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Account Confirm */}
      <AlertDialog
        open={!!removeTarget}
        onOpenChange={(o) => !o && setRemoveTarget(null)}
      >
        <AlertDialogContent className="bg-[oklch(0.17_0.03_20)] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Remove Account?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Remove{" "}
              <strong className="text-white">{removeTarget?.email}</strong> from
              the system?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-white/20 text-white/70 hover:bg-white/10"
              data-ocid="admin.remove.cancel_button"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveAccount}
              disabled={removeLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-ocid="admin.remove.confirm_button"
            >
              {removeLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Remove"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---- Sub-components ----

function MenuSection({
  items,
  loading,
  initLoading,
  onAdd,
  onEdit,
  onDelete,
  onToggle,
  onInit,
}: {
  items: MenuItem[];
  loading: boolean;
  initLoading: boolean;
  onAdd: () => void;
  onEdit: (item: MenuItem) => void;
  onDelete: (item: MenuItem) => void;
  onToggle: (item: MenuItem) => void;
  onInit: () => void;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">
            Menu Management
          </h2>
          <p className="text-sm text-white/40 mt-0.5">
            {items.length} items in menu
          </p>
        </div>
        <div className="flex gap-2">
          {items.length === 0 && (
            <Button
              onClick={onInit}
              disabled={initLoading}
              variant="outline"
              className="border-white/20 text-white/70 hover:bg-white/10 text-sm"
              data-ocid="menu.initialize.button"
            >
              {initLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initializing...
                </>
              ) : (
                "Initialize Menu"
              )}
            </Button>
          )}
          <Button
            onClick={onAdd}
            className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-sm"
            data-ocid="menu.add.button"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Item
          </Button>
        </div>
      </div>

      {loading ? (
        <div
          className="flex items-center justify-center py-16"
          data-ocid="menu.loading_state"
        >
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        </div>
      ) : items.length === 0 ? (
        <div
          className="text-center py-16 text-white/40"
          data-ocid="menu.empty_state"
        >
          <ChefHat className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-display text-lg">No menu items yet</p>
          <p className="text-sm mt-1">
            Add items or use Initialize Menu to get started
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <motion.div
              key={String(item.id)}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              data-ocid={`menu.item.${idx + 1}`}
              className="bg-[oklch(0.17_0.03_20)] border border-white/10 rounded-lg p-3 flex flex-wrap items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-white text-sm">
                    {item.name}
                  </span>
                  <CategoryBadge cat={item.category} />
                  {!item.isAvailable && (
                    <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                      Unavailable
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-secondary font-semibold text-sm">
                    {item.price}
                  </span>
                  {item.description && (
                    <span className="text-white/40 text-xs truncate max-w-xs">
                      {item.description}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={item.isAvailable}
                  onCheckedChange={() => onToggle(item)}
                  data-ocid={`menu.available.switch.${idx + 1}`}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(item)}
                  className="text-white/60 hover:text-white hover:bg-white/10 h-8 w-8 p-0"
                  data-ocid={`menu.edit_button.${idx + 1}`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(item)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 w-8 p-0"
                  data-ocid={`menu.delete_button.${idx + 1}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminSection({
  accounts,
  loading,
  onAdd,
  onRemove,
}: {
  accounts: AccountInfo[];
  loading: boolean;
  onAdd: () => void;
  onRemove: (account: AccountInfo) => void;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">
            Admin Management
          </h2>
          <p className="text-sm text-white/40 mt-0.5">
            Manage admin and staff accounts
          </p>
        </div>
        <Button
          onClick={onAdd}
          className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-sm"
          data-ocid="admin.add.button"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Account
        </Button>
      </div>

      {loading ? (
        <div
          className="flex items-center justify-center py-16"
          data-ocid="admin.loading_state"
        >
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        </div>
      ) : accounts.length === 0 ? (
        <div
          className="text-center py-16 text-white/40"
          data-ocid="admin.empty_state"
        >
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-display text-lg">No accounts yet</p>
          <p className="text-sm mt-1">
            Add admin or staff accounts using the button above
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {accounts.map((account, idx) => (
            <div
              key={String(account.id)}
              data-ocid={`admin.item.${idx + 1}`}
              className="bg-[oklch(0.17_0.03_20)] border border-white/10 rounded-lg p-3 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-secondary text-xs font-bold">
                    {account.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {account.email}
                  </p>
                  <span className="text-xs text-white/40">
                    {getAccountRoleLabel(account)}
                  </span>
                </div>
              </div>
              {!("mainAdmin" in account.role) && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemove(account)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 flex-shrink-0"
                  data-ocid={`admin.delete_button.${idx + 1}`}
                >
                  <X className="h-4 w-4 mr-1" /> Remove
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PasswordSection({
  currentPw,
  newPw,
  confirmPw,
  loading,
  success,
  onChange,
  onSubmit,
}: {
  currentPw: string;
  newPw: string;
  confirmPw: string;
  loading: boolean;
  success: boolean;
  onChange: {
    currentPw: (v: string) => void;
    newPw: (v: string) => void;
    confirmPw: (v: string) => void;
  };
  onSubmit: () => void;
}) {
  return (
    <div className="max-w-md">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold text-white">
          Change Password
        </h2>
        <p className="text-sm text-white/40 mt-0.5">
          Update your account password
        </p>
      </div>
      <div className="bg-[oklch(0.17_0.03_20)] border border-white/10 rounded-xl p-5 space-y-4">
        {success && (
          <div
            className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 text-green-400 text-sm"
            data-ocid="password.success_state"
          >
            <Check className="h-4 w-4" /> Password changed successfully!
          </div>
        )}
        <div className="space-y-1.5">
          <Label className="text-white/70">Current Password</Label>
          <Input
            type="password"
            value={currentPw}
            onChange={(e) => onChange.currentPw(e.target.value)}
            placeholder="Current password"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
            data-ocid="password.current.input"
          />
        </div>
        <Separator className="bg-white/10" />
        <div className="space-y-1.5">
          <Label className="text-white/70">New Password</Label>
          <Input
            type="password"
            value={newPw}
            onChange={(e) => onChange.newPw(e.target.value)}
            placeholder="New password (min 6 chars)"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
            data-ocid="password.new.input"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-white/70">Confirm New Password</Label>
          <Input
            type="password"
            value={confirmPw}
            onChange={(e) => onChange.confirmPw(e.target.value)}
            placeholder="Confirm new password"
            className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
            data-ocid="password.confirm.input"
          />
        </div>
        <Button
          onClick={onSubmit}
          disabled={loading}
          className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
          data-ocid="password.submit_button"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Password"
          )}
        </Button>
      </div>
    </div>
  );
}
