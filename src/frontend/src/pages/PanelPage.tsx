import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Image,
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { MenuItem } from "../backend.d";
import {
  useContactMessages,
  useCreateMenuItem,
  useDeleteMenuItem,
  useIsAdmin,
  useMenuItems,
  useStats,
  useUpdateMenuItem,
} from "../hooks/useQueries";

const CATEGORIES = ["Veg", "Non-Veg", "Drinks", "Breads"];
const SKELETON_KEYS = ["sk-a", "sk-b", "sk-c", "sk-d"];

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-5 shadow-xs flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-body text-xs text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <p className="font-display text-2xl font-bold text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}

export default function PanelPage() {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: checkingAdmin } = useIsAdmin();

  useEffect(() => {
    if (!checkingAdmin && isAdmin === false) {
      navigate({ to: "/admin" });
    }
  }, [isAdmin, checkingAdmin, navigate]);

  const { data: items, isLoading: loadingItems } = useMenuItems();
  const { data: stats } = useStats();
  const { data: messages } = useContactMessages();
  const createMutation = useCreateMenuItem();
  const updateMutation = useUpdateMenuItem();
  const deleteMutation = useDeleteMenuItem();

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");

  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCategory, setEditCategory] = useState("");

  const openEdit = (item: MenuItem) => {
    setEditItem(item);
    setEditName(item.name);
    setEditDesc(item.description);
    setEditPrice(item.price);
    setEditCategory(item.category);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price.trim() || !category) return;
    createMutation.mutate(
      { name, description: desc, price, category },
      {
        onSuccess: () => {
          setName("");
          setDesc("");
          setPrice("");
          setCategory("");
        },
      },
    );
  };

  const handleSaveEdit = () => {
    if (!editItem) return;
    updateMutation.mutate(
      {
        id: editItem.id,
        name: editName,
        description: editDesc,
        price: editPrice,
        category: editCategory,
        isAvailable: editItem.isAvailable,
      },
      { onSuccess: () => setEditItem(null) },
    );
  };

  if (checkingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div
      data-ocid="panel.page"
      className="max-w-5xl mx-auto px-4 py-10 space-y-8"
    >
      <div>
        <h2 className="font-display text-3xl font-bold text-primary">
          Admin Panel
        </h2>
        <p className="font-body text-sm text-muted-foreground mt-1">
          Manage your menu, view stats and messages.
        </p>
      </div>

      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <StatCard
            icon={UtensilsCrossed}
            label="Menu Items"
            value={Number(stats[0])}
            color="bg-red-50 text-primary"
          />
          <StatCard
            icon={MessageSquare}
            label="Messages"
            value={Number(stats[1])}
            color="bg-amber-50 text-amber-700"
          />
          <StatCard
            icon={Image}
            label="Gallery Images"
            value={Number(stats[2])}
            color="bg-blue-50 text-blue-700"
          />
        </motion.div>
      )}

      <div className="bg-card border border-border rounded-lg p-6 shadow-xs">
        <h3 className="font-display text-xl font-semibold text-primary mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5" /> Add Menu Item
        </h3>
        <form
          onSubmit={handleAdd}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div>
            <Label className="font-body text-sm">Name</Label>
            <Input
              data-ocid="panel.name.input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dal Makhani"
              className="mt-1 font-body"
              required
            />
          </div>
          <div>
            <Label className="font-body text-sm">Price (₹)</Label>
            <Input
              data-ocid="panel.price.input"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 180"
              className="mt-1 font-body"
              required
            />
          </div>
          <div className="md:col-span-2">
            <Label className="font-body text-sm">Description</Label>
            <Textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Short description (optional)"
              className="mt-1 font-body"
              rows={2}
            />
          </div>
          <div>
            <Label className="font-body text-sm">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger
                data-ocid="panel.category.select"
                className="mt-1 font-body"
              >
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="font-body">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              type="submit"
              data-ocid="panel.add_button"
              disabled={createMutation.isPending}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-body"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding…
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      <div className="bg-card border border-border rounded-lg shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-display text-xl font-semibold text-primary flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> All Menu Items
          </h3>
        </div>

        {loadingItems && (
          <div className="p-6 space-y-3">
            {SKELETON_KEYS.map((k) => (
              <Skeleton key={k} className="h-12 rounded" />
            ))}
          </div>
        )}

        {!loadingItems && !items?.length && (
          <div className="py-12 text-center font-body text-muted-foreground">
            No items yet.
          </div>
        )}

        {!loadingItems && items && items.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-body font-semibold">#</TableHead>
                  <TableHead className="font-body font-semibold">
                    Name
                  </TableHead>
                  <TableHead className="font-body font-semibold">
                    Category
                  </TableHead>
                  <TableHead className="font-body font-semibold">
                    Price
                  </TableHead>
                  <TableHead className="font-body font-semibold">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, i) => (
                  <TableRow
                    key={String(item.id)}
                    data-ocid={`panel.item.${i + 1}`}
                  >
                    <TableCell className="font-body text-muted-foreground text-sm">
                      {i + 1}
                    </TableCell>
                    <TableCell className="font-body font-medium">
                      {item.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-body text-xs">
                        {item.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-body font-semibold text-primary">
                      ₹{item.price}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          data-ocid={`panel.edit_button.${i + 1}`}
                          onClick={() => openEdit(item)}
                          className="h-7 px-2 font-body text-xs"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          data-ocid={`panel.delete_button.${i + 1}`}
                          onClick={() => deleteMutation.mutate(item.id)}
                          disabled={deleteMutation.isPending}
                          className="h-7 px-2 font-body text-xs"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {messages && messages.length > 0 && (
        <div className="bg-card border border-border rounded-lg shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h3 className="font-display text-xl font-semibold text-primary flex items-center gap-2">
              <MessageSquare className="h-5 w-5" /> Contact Messages
            </h3>
          </div>
          <div className="divide-y divide-border">
            {messages.map((msg) => (
              <div
                key={`${msg.name}-${String(msg.timestamp)}`}
                className="px-6 py-4"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-body font-semibold text-foreground">
                    {msg.name}
                  </span>
                  <span className="font-body text-xs text-muted-foreground">
                    {msg.phone}
                  </span>
                </div>
                <p className="font-body text-sm text-muted-foreground">
                  {msg.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog
        open={!!editItem}
        onOpenChange={(open) => !open && setEditItem(null)}
      >
        <DialogContent className="font-body">
          <DialogHeader>
            <DialogTitle className="font-display text-primary">
              Edit Menu Item
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm">Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Price (₹)</Label>
              <Input
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">Description</Label>
              <Textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>
            <div>
              <Label className="text-sm">Category</Label>
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-ocid="panel.cancel_button"
              onClick={() => setEditItem(null)}
              className="font-body"
            >
              Cancel
            </Button>
            <Button
              data-ocid="panel.save_button"
              onClick={handleSaveEdit}
              disabled={updateMutation.isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-body"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
