import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle,
  ChefHat,
  Edit,
  Eye,
  EyeOff,
  Image,
  LayoutDashboard,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  RefreshCw,
  Settings,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { MenuItem } from "../backend.d";
import {
  type SessionInfo,
  getAdminToken,
  isMainAdmin,
  roleLabel,
  useAccounts,
  useAddGalleryImage,
  useAdminResetPassword,
  useAllMenuItemsAdmin,
  useChangePassword,
  useContactMessages,
  useCreateAccount,
  useCreateMenuItem,
  useDeleteGalleryImage,
  useDeleteMenuItem,
  useGalleryImages,
  useInitializeMenu,
  useLogout,
  useRemoveAccount,
  useRestaurantInfo,
  useStats,
  useTransferMainAdmin,
  useUpdateMenuItem,
  useUpdateRestaurantInfo,
  useValidateToken,
} from "../hooks/useQueries";

function RoleBadge({ role }: { role: SessionInfo["role"] }) {
  if ("mainAdmin" in role)
    return <Badge className="bg-amber-500 text-white">Main Admin</Badge>;
  if ("admin" in role) return <Badge variant="secondary">Admin</Badge>;
  return <Badge variant="outline">Staff</Badge>;
}

export default function PanelPage() {
  const navigate = useNavigate();
  const token = getAdminToken();
  const { data: session, isLoading: sessionLoading } = useValidateToken();

  // Redirect if not authenticated
  useEffect(() => {
    if (!sessionLoading && !token) {
      navigate({ to: "/admin" });
    }
    if (!sessionLoading && token && session === null) {
      navigate({ to: "/admin" });
    }
  }, [session, sessionLoading, token, navigate]);

  const { data: stats } = useStats();
  const { data: menuItems = [], isLoading: menuLoading } =
    useAllMenuItemsAdmin();
  const { data: galleryImages = [] } = useGalleryImages();
  const { data: messages = [] } = useContactMessages();
  const { data: restaurantInfo } = useRestaurantInfo();
  const { data: accounts = [] } = useAccounts(session);

  const logoutMutation = useLogout();
  const createAccountMutation = useCreateAccount();
  const removeAccountMutation = useRemoveAccount();
  const transferAdminMutation = useTransferMainAdmin();
  const changePasswordMutation = useChangePassword();
  const resetPasswordMutation = useAdminResetPassword();
  const updateInfoMutation = useUpdateRestaurantInfo();
  const createMenuMutation = useCreateMenuItem();
  const updateMenuMutation = useUpdateMenuItem();
  const deleteMenuMutation = useDeleteMenuItem();
  const addGalleryMutation = useAddGalleryImage();
  const deleteGalleryMutation = useDeleteGalleryImage();
  const initMenuMutation = useInitializeMenu();

  // Change Password dialog
  const [pwDialogOpen, setPwDialogOpen] = useState(false);
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // Add Account dialog
  const [addAccOpen, setAddAccOpen] = useState(false);
  const [newAccEmail, setNewAccEmail] = useState("");
  const [newAccPw, setNewAccPw] = useState("");
  const [newAccRole, setNewAccRole] = useState<"admin" | "staff">("staff");

  // Reset Password dialog
  const [resetPwOpen, setResetPwOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState("");
  const [resetNewPw, setResetNewPw] = useState("");

  // Transfer Admin
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState("");

  // Menu item form
  const [menuDialogOpen, setMenuDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemCategory, setItemCategory] = useState("");
  const [itemAvailable, setItemAvailable] = useState(true);

  // Gallery
  const [galleryUrl, setGalleryUrl] = useState("");
  const [galleryCaption, setGalleryCaption] = useState("");

  // Restaurant info form
  const [infoPhone, setInfoPhone] = useState("");
  const [infoEmail, setInfoEmail] = useState("");
  const [infoAddress, setInfoAddress] = useState("");

  useEffect(() => {
    if (restaurantInfo) {
      setInfoPhone(restaurantInfo.phone);
      setInfoEmail(restaurantInfo.email);
      setInfoAddress(restaurantInfo.address);
    }
  }, [restaurantInfo]);

  async function handleLogout() {
    await logoutMutation.mutateAsync();
    navigate({ to: "/admin" });
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!newPw || !oldPw) {
      toast.error("Fill all fields");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPw.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    try {
      const ok = await changePasswordMutation.mutateAsync({
        oldPassword: oldPw,
        newPassword: newPw,
      });
      if (ok) {
        toast.success("Password changed successfully");
        setPwDialogOpen(false);
        setOldPw("");
        setNewPw("");
        setConfirmPw("");
      } else {
        toast.error("Old password is incorrect");
      }
    } catch {
      toast.error("Failed to change password");
    }
  }

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!newAccEmail || !newAccPw) {
      toast.error("Fill all fields");
      return;
    }
    try {
      const ok = await createAccountMutation.mutateAsync({
        email: newAccEmail,
        password: newAccPw,
        role: newAccRole,
      });
      if (ok) {
        toast.success(`Account created for ${newAccEmail}`);
        setAddAccOpen(false);
        setNewAccEmail("");
        setNewAccPw("");
      } else {
        toast.error("Failed to create account. Email may already exist.");
      }
    } catch {
      toast.error("Failed to create account");
    }
  }

  async function handleRemoveAccount(email: string) {
    if (!confirm(`Remove account for ${email}?`)) return;
    try {
      const ok = await removeAccountMutation.mutateAsync({
        targetEmail: email,
      });
      if (ok) toast.success("Account removed");
      else toast.error("Failed to remove account");
    } catch {
      toast.error("Failed to remove account");
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetNewPw) {
      toast.error("Enter new password");
      return;
    }
    try {
      const ok = await resetPasswordMutation.mutateAsync({
        targetEmail: resetTarget,
        newPassword: resetNewPw,
      });
      if (ok) {
        toast.success(`Password reset for ${resetTarget}`);
        setResetPwOpen(false);
        setResetNewPw("");
      } else {
        toast.error("Failed to reset password");
      }
    } catch {
      toast.error("Failed to reset password");
    }
  }

  async function handleTransfer(e: React.FormEvent) {
    e.preventDefault();
    if (!transferTarget) {
      toast.error("Select target admin");
      return;
    }
    if (
      !confirm(
        `Transfer main admin to ${transferTarget}? You will lose main admin privileges.`,
      )
    )
      return;
    try {
      const ok = await transferAdminMutation.mutateAsync({
        targetEmail: transferTarget,
      });
      if (ok) {
        toast.success("Main admin transferred");
        setTransferOpen(false);
      } else {
        toast.error("Transfer failed");
      }
    } catch {
      toast.error("Transfer failed");
    }
  }

  async function handleSaveInfo(e: React.FormEvent) {
    e.preventDefault();
    try {
      const ok = await updateInfoMutation.mutateAsync({
        phone: infoPhone,
        email: infoEmail,
        address: infoAddress,
      });
      if (ok) toast.success("Restaurant info updated");
      else toast.error("Failed to update info");
    } catch {
      toast.error("Failed to update info");
    }
  }

  function openAddMenu() {
    setEditingItem(null);
    setItemName("");
    setItemDesc("");
    setItemPrice("");
    setItemCategory("");
    setItemAvailable(true);
    setMenuDialogOpen(true);
  }
  function openEditMenu(item: MenuItem) {
    setEditingItem(item);
    setItemName(item.name);
    setItemDesc(item.description);
    setItemPrice(item.price);
    setItemCategory(item.category);
    setItemAvailable(item.isAvailable);
    setMenuDialogOpen(true);
  }

  async function handleSaveMenuItem(e: React.FormEvent) {
    e.preventDefault();
    if (!itemName || !itemPrice || !itemCategory) {
      toast.error("Fill required fields");
      return;
    }
    try {
      if (editingItem) {
        await updateMenuMutation.mutateAsync({
          id: editingItem.id,
          name: itemName,
          description: itemDesc,
          price: itemPrice,
          category: itemCategory,
          isAvailable: itemAvailable,
        });
        toast.success("Item updated");
      } else {
        await createMenuMutation.mutateAsync({
          name: itemName,
          description: itemDesc,
          price: itemPrice,
          category: itemCategory,
        });
        toast.success("Item added");
      }
      setMenuDialogOpen(false);
    } catch {
      toast.error("Failed to save menu item");
    }
  }

  async function handleDeleteMenuItem(id: bigint) {
    if (!confirm("Delete this menu item?")) return;
    try {
      await deleteMenuMutation.mutateAsync({ id });
      toast.success("Item deleted");
    } catch {
      toast.error("Failed to delete item");
    }
  }

  async function handleAddGallery(e: React.FormEvent) {
    e.preventDefault();
    if (!galleryUrl) {
      toast.error("Enter image URL");
      return;
    }
    try {
      await addGalleryMutation.mutateAsync({
        url: galleryUrl,
        caption: galleryCaption,
      });
      toast.success("Image added");
      setGalleryUrl("");
      setGalleryCaption("");
    } catch {
      toast.error("Failed to add image");
    }
  }

  async function handleDeleteGallery(url: string) {
    if (!confirm("Remove this image?")) return;
    try {
      await deleteGalleryMutation.mutateAsync({ url });
      toast.success("Image removed");
    } catch {
      toast.error("Failed to remove image");
    }
  }

  if (sessionLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        data-ocid="panel.loading_state"
      >
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <ChefHat className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <p className="font-semibold text-sm leading-none">
                Neta Ji Admin
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {session.email}
              </p>
            </div>
            <RoleBadge role={session.role} />
          </div>
          <div className="flex items-center gap-2">
            {/* Change Password */}
            <Dialog open={pwDialogOpen} onOpenChange={setPwDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  data-ocid="panel.change_password.open_modal_button"
                >
                  <Lock className="w-4 h-4 mr-1" /> Change Password
                </Button>
              </DialogTrigger>
              <DialogContent data-ocid="panel.change_password.dialog">
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                  <DialogDescription>
                    Enter your current password and choose a new one.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-1">
                    <Label>Current Password</Label>
                    <div className="relative">
                      <Input
                        type={showOldPw ? "text" : "password"}
                        value={oldPw}
                        onChange={(e) => setOldPw(e.target.value)}
                        data-ocid="panel.change_password.input"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowOldPw((v) => !v)}
                      >
                        {showOldPw ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>New Password</Label>
                    <div className="relative">
                      <Input
                        type={showNewPw ? "text" : "password"}
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        data-ocid="panel.change_password.new.input"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowNewPw((v) => !v)}
                      >
                        {showNewPw ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Confirm New Password</Label>
                    <Input
                      type="password"
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      data-ocid="panel.change_password.confirm.input"
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setPwDialogOpen(false)}
                      data-ocid="panel.change_password.cancel_button"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={changePasswordMutation.isPending}
                      data-ocid="panel.change_password.submit_button"
                    >
                      {changePasswordMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Update Password"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              data-ocid="panel.logout.button"
            >
              {logoutMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4 mr-1" />
              )}
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="dashboard">
          <TabsList className="mb-6 flex flex-wrap h-auto gap-1">
            <TabsTrigger value="dashboard" data-ocid="panel.dashboard.tab">
              <LayoutDashboard className="w-4 h-4 mr-1" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="menu" data-ocid="panel.menu.tab">
              <UtensilsCrossed className="w-4 h-4 mr-1" />
              Menu
            </TabsTrigger>
            <TabsTrigger value="gallery" data-ocid="panel.gallery.tab">
              <Image className="w-4 h-4 mr-1" />
              Gallery
            </TabsTrigger>
            <TabsTrigger value="messages" data-ocid="panel.messages.tab">
              <MessageSquare className="w-4 h-4 mr-1" />
              Messages
            </TabsTrigger>
            {isMainAdmin(session.role) && (
              <TabsTrigger value="admins" data-ocid="panel.admins.tab">
                <Users className="w-4 h-4 mr-1" />
                Admin Management
              </TabsTrigger>
            )}
            {isMainAdmin(session.role) && (
              <TabsTrigger value="settings" data-ocid="panel.settings.tab">
                <Settings className="w-4 h-4 mr-1" />
                Restaurant Settings
              </TabsTrigger>
            )}
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Menu Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {stats ? Number(stats[0]) : menuItems.length}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Gallery Images
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {stats ? Number(stats[1]) : galleryImages.length}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Contact Messages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {stats ? Number(stats[2]) : messages.length}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Menu Management */}
          <TabsContent value="menu">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Menu Items</h2>
                <div className="flex gap-2">
                  {menuItems.length === 0 && (
                    <Button
                      variant="outline"
                      onClick={() => initMenuMutation.mutate()}
                      disabled={initMenuMutation.isPending}
                      data-ocid="panel.menu.initialize.button"
                    >
                      {initMenuMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-1" />
                      )}
                      Initialize Menu
                    </Button>
                  )}
                  <Button
                    onClick={openAddMenu}
                    data-ocid="panel.menu.add.button"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Item
                  </Button>
                </div>
              </div>

              {menuLoading ? (
                <div
                  className="flex justify-center py-12"
                  data-ocid="panel.menu.loading_state"
                >
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : menuItems.length === 0 ? (
                <Card
                  className="text-center py-12"
                  data-ocid="panel.menu.empty_state"
                >
                  <CardContent>
                    <UtensilsCrossed className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">
                      No menu items yet. Add one or initialize the default menu.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {menuItems.map((item, i) => (
                    <Card
                      key={item.id.toString()}
                      data-ocid={`panel.menu.item.${i + 1}`}
                    >
                      <CardContent className="flex items-center justify-between py-3">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.category} • ₹{item.price}
                          </p>
                          {!item.isAvailable && (
                            <Badge variant="outline" className="text-xs mt-1">
                              Unavailable
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditMenu(item)}
                            data-ocid={`panel.menu.edit_button.${i + 1}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteMenuItem(item.id)}
                            disabled={deleteMenuMutation.isPending}
                            data-ocid={`panel.menu.delete_button.${i + 1}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Menu Item Dialog */}
            <Dialog open={menuDialogOpen} onOpenChange={setMenuDialogOpen}>
              <DialogContent data-ocid="panel.menu.dialog">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? "Edit Menu Item" : "Add Menu Item"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSaveMenuItem} className="space-y-3">
                  <div className="space-y-1">
                    <Label>Name *</Label>
                    <Input
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      data-ocid="panel.menu.name.input"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Description</Label>
                    <Textarea
                      value={itemDesc}
                      onChange={(e) => setItemDesc(e.target.value)}
                      rows={2}
                      data-ocid="panel.menu.description.textarea"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Price (₹) *</Label>
                      <Input
                        value={itemPrice}
                        onChange={(e) => setItemPrice(e.target.value)}
                        data-ocid="panel.menu.price.input"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Category *</Label>
                      <Input
                        value={itemCategory}
                        onChange={(e) => setItemCategory(e.target.value)}
                        data-ocid="panel.menu.category.input"
                      />
                    </div>
                  </div>
                  {editingItem && (
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={itemAvailable}
                        onCheckedChange={setItemAvailable}
                        data-ocid="panel.menu.available.switch"
                      />
                      <Label>Available</Label>
                    </div>
                  )}
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setMenuDialogOpen(false)}
                      data-ocid="panel.menu.cancel_button"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        createMenuMutation.isPending ||
                        updateMenuMutation.isPending
                      }
                      data-ocid="panel.menu.save_button"
                    >
                      {createMenuMutation.isPending ||
                      updateMenuMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Save"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Gallery */}
          <TabsContent value="gallery">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Gallery</h2>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Add Image</CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={handleAddGallery}
                    className="flex flex-col sm:flex-row gap-3"
                  >
                    <Input
                      placeholder="Image URL"
                      value={galleryUrl}
                      onChange={(e) => setGalleryUrl(e.target.value)}
                      className="flex-1"
                      data-ocid="panel.gallery.url.input"
                    />
                    <Input
                      placeholder="Caption"
                      value={galleryCaption}
                      onChange={(e) => setGalleryCaption(e.target.value)}
                      className="flex-1"
                      data-ocid="panel.gallery.caption.input"
                    />
                    <Button
                      type="submit"
                      disabled={addGalleryMutation.isPending}
                      data-ocid="panel.gallery.add.button"
                    >
                      {addGalleryMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {galleryImages.length === 0 ? (
                <Card
                  className="text-center py-12"
                  data-ocid="panel.gallery.empty_state"
                >
                  <CardContent>
                    <Image className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">
                      No gallery images yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {galleryImages.map((img, i) => (
                    <div
                      key={img.url}
                      className="relative group rounded-lg overflow-hidden aspect-square"
                      data-ocid={`panel.gallery.item.${i + 1}`}
                    >
                      <img
                        src={img.url}
                        alt={img.caption}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteGallery(img.url)}
                          data-ocid={`panel.gallery.delete_button.${i + 1}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      {img.caption && (
                        <p className="absolute bottom-0 left-0 right-0 text-xs text-white bg-black/50 px-2 py-1 truncate">
                          {img.caption}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Messages */}
          <TabsContent value="messages">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Contact Messages</h2>
              {messages.length === 0 ? (
                <Card
                  className="text-center py-12"
                  data-ocid="panel.messages.empty_state"
                >
                  <CardContent>
                    <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No messages yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {messages.map((msg, i) => (
                    <Card
                      key={`${msg.name}-${msg.phone}-${i}`}
                      data-ocid={`panel.messages.item.${i + 1}`}
                    >
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{msg.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {msg.phone}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(
                              Number(msg.timestamp) / 1_000_000,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="mt-2 text-sm">{msg.message}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Admin Management (main admin only) */}
          {isMainAdmin(session.role) && (
            <TabsContent value="admins">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Admin Management</h2>
                  <div className="flex gap-2">
                    {/* Transfer Main Admin */}
                    <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          data-ocid="panel.admins.transfer.open_modal_button"
                        >
                          <UserCheck className="w-4 h-4 mr-1" /> Transfer Main
                          Admin
                        </Button>
                      </DialogTrigger>
                      <DialogContent data-ocid="panel.admins.transfer.dialog">
                        <DialogHeader>
                          <DialogTitle>Transfer Main Admin</DialogTitle>
                          <DialogDescription>
                            This will transfer main admin privileges to another
                            account. You will lose main admin access.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleTransfer} className="space-y-4">
                          <div className="space-y-1">
                            <Label>Transfer to (email)</Label>
                            <Select onValueChange={setTransferTarget}>
                              <SelectTrigger data-ocid="panel.admins.transfer.select">
                                <SelectValue placeholder="Select admin or staff" />
                              </SelectTrigger>
                              <SelectContent>
                                {accounts
                                  .filter((a) => !("mainAdmin" in a.role))
                                  .map((a) => (
                                    <SelectItem key={a.email} value={a.email}>
                                      {a.email} ({roleLabel(a.role)})
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setTransferOpen(false)}
                              data-ocid="panel.admins.transfer.cancel_button"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              variant="destructive"
                              disabled={transferAdminMutation.isPending}
                              data-ocid="panel.admins.transfer.confirm_button"
                            >
                              {transferAdminMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                "Transfer"
                              )}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>

                    {/* Add Account */}
                    <Dialog open={addAccOpen} onOpenChange={setAddAccOpen}>
                      <DialogTrigger asChild>
                        <Button data-ocid="panel.admins.add.open_modal_button">
                          <Plus className="w-4 h-4 mr-1" /> Add Account
                        </Button>
                      </DialogTrigger>
                      <DialogContent data-ocid="panel.admins.add.dialog">
                        <DialogHeader>
                          <DialogTitle>Add Account</DialogTitle>
                          <DialogDescription>
                            Create a new admin or staff account.
                          </DialogDescription>
                        </DialogHeader>
                        <form
                          onSubmit={handleCreateAccount}
                          className="space-y-4"
                        >
                          <div className="space-y-1">
                            <Label>Email</Label>
                            <Input
                              type="email"
                              value={newAccEmail}
                              onChange={(e) => setNewAccEmail(e.target.value)}
                              data-ocid="panel.admins.add.email.input"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Temporary Password</Label>
                            <Input
                              type="password"
                              value={newAccPw}
                              onChange={(e) => setNewAccPw(e.target.value)}
                              data-ocid="panel.admins.add.password.input"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label>Role</Label>
                            <Select
                              value={newAccRole}
                              onValueChange={(v) =>
                                setNewAccRole(v as "admin" | "staff")
                              }
                            >
                              <SelectTrigger data-ocid="panel.admins.add.role.select">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="staff">Staff</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setAddAccOpen(false)}
                              data-ocid="panel.admins.add.cancel_button"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={createAccountMutation.isPending}
                              data-ocid="panel.admins.add.submit_button"
                            >
                              {createAccountMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                "Create Account"
                              )}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Accounts List */}
                {accounts.length === 0 ? (
                  <Card
                    className="text-center py-12"
                    data-ocid="panel.admins.empty_state"
                  >
                    <CardContent>
                      <Users className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-muted-foreground">
                        No accounts found.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-3">
                    {accounts.map((acc, i) => (
                      <Card
                        key={acc.email}
                        data-ocid={`panel.admins.item.${i + 1}`}
                      >
                        <CardContent className="flex items-center justify-between py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                              {acc.email[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{acc.email}</p>
                              <p className="text-xs text-muted-foreground">
                                ID: {acc.id.toString()}
                              </p>
                            </div>
                            <RoleBadge role={acc.role} />
                          </div>
                          <div className="flex gap-2">
                            {!("mainAdmin" in acc.role) && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setResetTarget(acc.email);
                                    setResetPwOpen(true);
                                  }}
                                  data-ocid={`panel.admins.reset_password.button.${i + 1}`}
                                >
                                  <Lock className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveAccount(acc.email)}
                                  disabled={removeAccountMutation.isPending}
                                  data-ocid={`panel.admins.delete_button.${i + 1}`}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Reset Password Dialog */}
                <Dialog open={resetPwOpen} onOpenChange={setResetPwOpen}>
                  <DialogContent data-ocid="panel.admins.reset_password.dialog">
                    <DialogHeader>
                      <DialogTitle>Reset Password</DialogTitle>
                      <DialogDescription>
                        Set a new password for {resetTarget}.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleResetPassword} className="space-y-4">
                      <div className="space-y-1">
                        <Label>New Password</Label>
                        <Input
                          type="password"
                          value={resetNewPw}
                          onChange={(e) => setResetNewPw(e.target.value)}
                          data-ocid="panel.admins.reset_password.input"
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setResetPwOpen(false)}
                          data-ocid="panel.admins.reset_password.cancel_button"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={resetPasswordMutation.isPending}
                          data-ocid="panel.admins.reset_password.confirm_button"
                        >
                          {resetPasswordMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Reset Password"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </TabsContent>
          )}

          {/* Restaurant Settings (main admin only) */}
          {isMainAdmin(session.role) && (
            <TabsContent value="settings">
              <div className="max-w-lg space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Restaurant Settings</h2>
                  <p className="text-muted-foreground text-sm">
                    Update your restaurant's contact information.
                  </p>
                </div>
                <Card>
                  <CardContent className="pt-6">
                    <form onSubmit={handleSaveInfo} className="space-y-4">
                      <div className="space-y-1">
                        <Label className="flex items-center gap-1">
                          <Phone className="w-4 h-4" /> Phone Number
                        </Label>
                        <Input
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={infoPhone}
                          onChange={(e) => setInfoPhone(e.target.value)}
                          data-ocid="panel.settings.phone.input"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="flex items-center gap-1">
                          <Mail className="w-4 h-4" /> Email Address
                        </Label>
                        <Input
                          type="email"
                          placeholder="restaurant@example.com"
                          value={infoEmail}
                          onChange={(e) => setInfoEmail(e.target.value)}
                          data-ocid="panel.settings.email.input"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" /> Address
                        </Label>
                        <Textarea
                          placeholder="Restaurant address"
                          value={infoAddress}
                          onChange={(e) => setInfoAddress(e.target.value)}
                          rows={3}
                          data-ocid="panel.settings.address.textarea"
                        />
                      </div>
                      {updateInfoMutation.isSuccess && (
                        <div
                          className="flex items-center gap-2 text-sm text-green-600"
                          data-ocid="panel.settings.success_state"
                        >
                          <CheckCircle className="w-4 h-4" /> Saved successfully
                        </div>
                      )}
                      {updateInfoMutation.isError && (
                        <div
                          className="flex items-center gap-2 text-sm text-destructive"
                          data-ocid="panel.settings.error_state"
                        >
                          <AlertCircle className="w-4 h-4" /> Failed to save
                        </div>
                      )}
                      <Button
                        type="submit"
                        disabled={updateInfoMutation.isPending}
                        data-ocid="panel.settings.save_button"
                      >
                        {updateInfoMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-1" />
                        ) : (
                          <ShieldCheck className="w-4 h-4 mr-1" />
                        )}
                        Save Settings
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
