import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Coffee,
  Drumstick,
  Leaf,
  Sandwich,
  UtensilsCrossed,
} from "lucide-react";
import { motion } from "motion/react";
import type { MenuItem } from "../backend.d";
import { useMenuItems } from "../hooks/useQueries";

const CATEGORIES = ["Veg", "Non-Veg", "Drinks", "Breads"];

const categoryMeta: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bg: string;
  }
> = {
  Veg: {
    icon: Leaf,
    color: "text-green-700",
    bg: "bg-green-50 border-green-200",
  },
  "Non-Veg": {
    icon: Drumstick,
    color: "text-primary",
    bg: "bg-red-50 border-red-200",
  },
  Drinks: {
    icon: Coffee,
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
  },
  Breads: {
    icon: Sandwich,
    color: "text-orange-700",
    bg: "bg-orange-50 border-orange-200",
  },
};

function MenuItemCard({ item, index }: { item: MenuItem; index: number }) {
  const meta = categoryMeta[item.category] || {
    icon: UtensilsCrossed,
    color: "text-primary",
    bg: "bg-card",
  };
  const Icon = meta.icon;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      data-ocid={`menu.item.${index + 1}`}
      className="bg-card border border-border rounded-lg p-5 shadow-xs hover:shadow-warm transition-shadow"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Icon className={`h-4 w-4 flex-shrink-0 ${meta.color}`} />
            <h3 className="font-display font-semibold text-foreground text-base leading-snug truncate">
              {item.name}
            </h3>
          </div>
          {item.description && (
            <p className="font-body text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {item.description}
            </p>
          )}
        </div>
        <span className="font-display font-bold text-primary text-lg flex-shrink-0">
          ₹{item.price}
        </span>
      </div>
    </motion.div>
  );
}

export default function MenuPage() {
  const { data: items, isLoading } = useMenuItems();

  const grouped: Record<string, MenuItem[]> = {};
  for (const item of items || []) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }

  const orderedCategories = CATEGORIES.filter((c) => grouped[c]?.length);
  const otherCategories = Object.keys(grouped).filter(
    (c) => !CATEGORIES.includes(c),
  );

  return (
    <div data-ocid="menu.page" className="max-w-5xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-primary">
          Our Menu
        </h2>
        <div className="w-12 h-1 bg-secondary mx-auto mt-3 rounded-full" />
        <p className="font-body text-muted-foreground mt-3 text-sm">
          Fresh ingredients. Traditional recipes. Pure flavors.
        </p>
      </div>

      {isLoading && (
        <div
          data-ocid="menu.loading_state"
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {["a", "b", "c", "d", "e", "f", "g", "h"].map((k) => (
            <Skeleton key={k} className="h-24 rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && !items?.length && (
        <div data-ocid="menu.empty_state" className="text-center py-20">
          <UtensilsCrossed className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="font-display text-xl text-muted-foreground">
            Menu coming soon…
          </p>
          <p className="font-body text-sm text-muted-foreground mt-2">
            Check back shortly for our full menu.
          </p>
        </div>
      )}

      {[...orderedCategories, ...otherCategories].map((category) => {
        const meta = categoryMeta[category];
        const Icon = meta?.icon || UtensilsCrossed;
        return (
          <section key={category} className="mb-10">
            <div
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-5 ${meta?.bg || "bg-muted border-border"}`}
            >
              <Icon className={`h-4 w-4 ${meta?.color || "text-foreground"}`} />
              <h3
                className={`font-display font-semibold text-base ${meta?.color || "text-foreground"}`}
              >
                {category}
              </h3>
              <Badge variant="secondary" className="ml-1 text-xs">
                {grouped[category].length}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {grouped[category].map((item, i) => (
                <MenuItemCard key={String(item.id)} item={item} index={i} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
