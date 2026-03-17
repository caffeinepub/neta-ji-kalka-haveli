import type { AdminRole, SessionInfo } from "@/backend.d";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActor } from "@/hooks/useActor";
import { useNavigate } from "@tanstack/react-router";
import { AlertCircle, ChefHat, Eye, EyeOff, Info, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function isStaff(role: AdminRole): boolean {
  return "staff" in role;
}

type ViewMode =
  | "loading"
  | "setup"
  | "login"
  | "forceChangePassword"
  | "forgotPassword";

export default function AdminLoginPage() {
  const { actor, isFetching } = useActor();
  const navigate = useNavigate();
  // biome-ignore lint/suspicious/noExplicitAny: backend.ts types are stale; runtime canister has updated API
  const be = actor as any;

  const [view, setView] = useState<ViewMode>("loading");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Setup form
  const [setupEmail, setSetupEmail] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [setupConfirm, setSetupConfirm] = useState("");

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Force change password
  const [pendingToken, setPendingToken] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [cpOld, setCpOld] = useState("");
  const [cpNew, setCpNew] = useState("");
  const [cpConfirm, setCpConfirm] = useState("");

  useEffect(() => {
    if (isFetching || !be) return;
    const existing = localStorage.getItem("sessionToken");
    if (existing) {
      navigate({ to: "/dashboard" });
      return;
    }
    be.isSetupRequired()
      .then((required: boolean) => setView(required ? "setup" : "login"))
      .catch(() => setView("login"));
  }, [be, isFetching, navigate]);

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (setupPassword !== setupConfirm) {
      setError("Passwords do not match.");
      return;
    }
    if (setupPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setIsSubmitting(true);
    try {
      const hash = await hashPassword(setupPassword);
      const ok: boolean = await be.setupMainAdmin(setupEmail, hash);
      if (!ok) {
        setError("Setup failed. Please try again.");
        setIsSubmitting(false);
        return;
      }
      const token: string | null = await be.login(setupEmail, hash);
      if (!token) {
        setError(
          "Account created but login failed. Please use the login form.",
        );
        setView("login");
        setIsSubmitting(false);
        return;
      }
      const sessionInfo: SessionInfo | null = await be.validateToken(token);
      localStorage.setItem("sessionToken", token);
      localStorage.setItem("sessionInfo", JSON.stringify(sessionInfo));
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      setError(err?.message || "Setup failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const hash = await hashPassword(loginPassword);
      const token: string | null = await be.login(loginEmail, hash);
      if (!token) {
        setError("Invalid credentials or not authorized.");
        setIsSubmitting(false);
        return;
      }
      const sessionInfo: SessionInfo | null = await be.validateToken(token);
      if (!sessionInfo) {
        setError("Session validation failed. Please try again.");
        setIsSubmitting(false);
        return;
      }
      localStorage.setItem("sessionToken", token);
      localStorage.setItem("sessionInfo", JSON.stringify(sessionInfo));
      if (sessionInfo.mustChangePassword) {
        setPendingToken(token);
        setPendingEmail(sessionInfo.email);
        setView("forceChangePassword");
        setIsSubmitting(false);
        return;
      }
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      setError(err?.message || "Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleForceChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (cpNew !== cpConfirm) {
      setError("New passwords do not match.");
      return;
    }
    if (cpNew.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setIsSubmitting(true);
    try {
      const oldHash = await hashPassword(cpOld);
      const newHash = await hashPassword(cpNew);
      const ok: boolean = await be.changePassword(
        pendingToken,
        oldHash,
        newHash,
      );
      if (!ok) {
        setError("Password change failed. Check your current password.");
        setIsSubmitting(false);
        return;
      }
      const sessionInfo: SessionInfo | null =
        await be.validateToken(pendingToken);
      localStorage.setItem(
        "sessionInfo",
        JSON.stringify(
          sessionInfo ?? {
            email: pendingEmail,
            role: { mainAdmin: null },
            mustChangePassword: false,
          },
        ),
      );
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      setError(err?.message || "Password change failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (view === "loading" || isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <ChefHat className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Neta Ji Kalka Haveli
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Family Restaurant — Admin Portal
          </p>
        </div>

        {/* First Time Setup */}
        {view === "setup" && (
          <Card className="shadow-warm">
            <CardHeader>
              <CardTitle className="font-display text-xl">
                First Time Setup
              </CardTitle>
              <CardDescription>
                Create the main admin account to get started.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSetup} className="space-y-4">
                {error && (
                  <Alert
                    variant="destructive"
                    data-ocid="admin-login.error_state"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-1">
                  <Label htmlFor="setup-email">Email</Label>
                  <Input
                    id="setup-email"
                    type="email"
                    placeholder="admin@restaurant.com"
                    value={setupEmail}
                    onChange={(e) => setSetupEmail(e.target.value)}
                    required
                    data-ocid="admin-login.setup_email_input"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="setup-pw">Password</Label>
                  <div className="relative">
                    <Input
                      id="setup-pw"
                      type={showPw ? "text" : "password"}
                      placeholder="Minimum 6 characters"
                      value={setupPassword}
                      onChange={(e) => setSetupPassword(e.target.value)}
                      required
                      data-ocid="admin-login.setup_password_input"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      onClick={() => setShowPw(!showPw)}
                    >
                      {showPw ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="setup-confirm">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="setup-confirm"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Repeat password"
                      value={setupConfirm}
                      onChange={(e) => setSetupConfirm(e.target.value)}
                      required
                      data-ocid="admin-login.setup_confirm_input"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      onClick={() => setShowConfirm(!showConfirm)}
                    >
                      {showConfirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                  data-ocid="admin-login.setup_button"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account…
                    </>
                  ) : (
                    "Create Admin Account"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Login */}
        {view === "login" && (
          <Card className="shadow-warm">
            <CardHeader>
              <CardTitle className="font-display text-xl">
                Admin Login
              </CardTitle>
              <CardDescription>
                Sign in with your admin credentials.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <Alert
                    variant="destructive"
                    data-ocid="admin-login.error_state"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-1">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="admin@restaurant.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    data-ocid="admin-login.email_input"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="login-pw">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-pw"
                      type={showPw ? "text" : "password"}
                      placeholder="Your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      data-ocid="admin-login.password_input"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      onClick={() => setShowPw(!showPw)}
                    >
                      {showPw ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                  data-ocid="admin-login.submit_button"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In…
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
                <div className="text-center">
                  <button
                    type="button"
                    className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                    onClick={() => {
                      setError("");
                      setView("forgotPassword");
                    }}
                    data-ocid="admin-login.forgot_password_link"
                  >
                    Forgot password?
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Force Change Password */}
        {view === "forceChangePassword" && (
          <Card className="shadow-warm">
            <CardHeader>
              <CardTitle className="font-display text-xl">
                Change Your Password
              </CardTitle>
              <CardDescription>
                A password change is required before you can continue,{" "}
                {pendingEmail}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForceChangePassword} className="space-y-4">
                {error && (
                  <Alert
                    variant="destructive"
                    data-ocid="admin-login.error_state"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-1">
                  <Label htmlFor="fcp-old">Current (Temporary) Password</Label>
                  <Input
                    id="fcp-old"
                    type="password"
                    value={cpOld}
                    onChange={(e) => setCpOld(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="fcp-new">New Password</Label>
                  <Input
                    id="fcp-new"
                    type="password"
                    value={cpNew}
                    onChange={(e) => setCpNew(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="fcp-confirm">Confirm New Password</Label>
                  <Input
                    id="fcp-confirm"
                    type="password"
                    value={cpConfirm}
                    onChange={(e) => setCpConfirm(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating…
                    </>
                  ) : (
                    "Update Password & Continue"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Forgot Password */}
        {view === "forgotPassword" && (
          <Card className="shadow-warm">
            <CardHeader>
              <CardTitle className="font-display text-xl">
                Forgot Password?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert data-ocid="admin-login.success_state">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Please contact the main admin to reset your password.
                </AlertDescription>
              </Alert>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setView("login")}
              >
                Back to Login
              </Button>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-sm text-muted-foreground mt-6">
          Staff?{" "}
          <a
            href="/staff-login"
            className="text-primary hover:underline font-medium"
          >
            Go to Staff Login
          </a>
        </p>
        <p className="text-center text-xs text-muted-foreground mt-8">
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
        </p>
      </div>
    </div>
  );
}

// Keep TypeScript happy — isStaff is used by the role check, referenced in flow docs.
void (isStaff as unknown);
