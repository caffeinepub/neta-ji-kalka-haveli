import type { MenuItem, SessionInfo } from "@/backend.d";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useActor } from "@/hooks/useActor";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, LogOut, UtensilsCrossed } from "lucide-react";
import { useEffect, useState } from "react";

function roleLabel(role: SessionInfo["role"]): string {
  if ("mainAdmin" in role) return "Main Admin";
  if ("admin" in role) return "Admin";
  return "Staff";
}

export default function StaffDashboardPage() {
  const { actor } = useActor();
  const navigate = useNavigate();
  // biome-ignore lint/suspicious/noExplicitAny: backend.ts types are stale; runtime canister has updated API
  const be = actor as any;

  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("sessionToken");
    if (!token || !be) return;
    be.validateToken(token)
      .then(async (info: SessionInfo | null) => {
        if (!info) {
          localStorage.removeItem("sessionToken");
          localStorage.removeItem("sessionInfo");
          navigate({ to: "/staff-login" });
          return;
        }
        // Redirect admins to their own dashboard
        if ("mainAdmin" in info.role || "admin" in info.role) {
          navigate({ to: "/dashboard" });
          return;
        }
        setSessionInfo(info);
        const items: MenuItem[] = await be.getAllAvailableMenuItems();
        setMenuItems(items);
        setIsLoading(false);
      })
      .catch(() => {
        localStorage.removeItem("sessionToken");
        localStorage.removeItem("sessionInfo");
        navigate({ to: "/staff-login" });
      });
  }, [be, navigate]);

  useEffect(() => {
    if (!localStorage.getItem("sessionToken")) navigate({ to: "/staff-login" });
  }, [navigate]);

  function handleLogout() {
    try {
      be.logout(localStorage.getItem("sessionToken"));
    } catch {
      /* silent */
    }
    localStorage.removeItem("sessionToken");
    localStorage.removeItem("sessionInfo");
    navigate({ to: "/staff-login" });
  }

  const categories = [...new Set(menuItems.map((i) => i.category))];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-primary text-primary-foreground shadow-warm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UtensilsCrossed className="h-6 w-6" />
            <div>
              <h1 className="font-display text-lg font-bold leading-tight">
                Neta Ji Kalka Haveli
              </h1>
              <p className="text-xs opacity-75">Staff Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{sessionInfo?.email}</p>
              <Badge
                variant="outline"
                className="text-xs border-primary-foreground/40 text-primary-foreground"
              >
                {sessionInfo ? roleLabel(sessionInfo.role) : "Staff"}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10"
              onClick={handleLogout}
              data-ocid="staff-dashboard.logout_button"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="font-display text-2xl font-bold mb-6">Today’s Menu</h2>

        {menuItems.length === 0 ? (
          <Card data-ocid="staff-dashboard.menu.empty_state">
            <CardContent className="py-12 text-center text-muted-foreground">
              No menu items available at the moment.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {categories.map((cat) => (
              <section key={cat}>
                <h3 className="font-display text-xl font-semibold border-b pb-2 mb-4">
                  {cat}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {menuItems
                    .filter((i) => i.category === cat)
                    .map((item, idx) => (
                      <Card
                        key={item.id.toString()}
                        data-ocid={`staff-dashboard.menu_item.${idx + 1}`}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">
                            {item.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {item.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {item.description}
                            </p>
                          )}
                          <p className="font-semibold text-primary">
                            {item.price}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

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
