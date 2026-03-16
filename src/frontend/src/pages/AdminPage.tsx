import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { useEffect } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useIsAdmin } from "../hooks/useQueries";

export default function AdminPage() {
  const { login, clear, identity, isLoggingIn, loginStatus } =
    useInternetIdentity();
  const { data: isAdmin, isLoading: checkingAdmin } = useIsAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAdmin) {
      navigate({ to: "/panel" });
    }
  }, [isAdmin, navigate]);

  const isLoggedIn = !!identity;
  const accessDenied = isLoggedIn && !checkingAdmin && isAdmin === false;

  return (
    <div
      data-ocid="admin.page"
      className="min-h-[60vh] flex items-center justify-center px-4 py-12"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-card border border-border rounded-xl p-8 shadow-warm w-full max-w-sm text-center"
      >
        <ShieldCheck className="h-12 w-12 text-primary mx-auto mb-4" />
        <h2 className="font-display text-2xl font-bold text-primary mb-2">
          Admin Login
        </h2>
        <p className="font-body text-sm text-muted-foreground mb-6">
          Restricted to authorized personnel only.
        </p>

        {accessDenied && (
          <div
            data-ocid="admin.error_state"
            className="flex items-center gap-2 text-destructive bg-red-50 border border-red-200 rounded-md px-4 py-3 mb-4 font-body text-sm text-left"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            Access denied. You do not have admin privileges.
          </div>
        )}

        {checkingAdmin && isLoggedIn && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground font-body text-sm mb-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verifying access…
          </div>
        )}

        {!isLoggedIn ? (
          <Button
            data-ocid="admin.login_button"
            onClick={login}
            disabled={isLoggingIn}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-body font-semibold"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging in…
              </>
            ) : (
              "Login with Internet Identity"
            )}
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="font-body text-xs text-muted-foreground">
              Logged in as: {identity.getPrincipal().toString().slice(0, 16)}…
            </p>
            <Button
              variant="outline"
              onClick={clear}
              className="w-full font-body text-sm"
            >
              Log Out
            </Button>
          </div>
        )}

        {loginStatus === "loginError" && (
          <p className="font-body text-xs text-destructive mt-3">
            Login failed. Please try again.
          </p>
        )}
      </motion.div>
    </div>
  );
}
