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
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ChefHat,
  Eye,
  EyeOff,
  Info,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getAdminToken,
  setAdminToken,
  useAdminSetup,
  useLogin,
  useSetupMainAdmin,
  useValidateToken,
} from "../hooks/useQueries";

export default function AdminPage() {
  const navigate = useNavigate();
  const { data: isSetup, isLoading: setupLoading } = useAdminSetup();
  const { data: session } = useValidateToken();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  // Setup form
  const [setupEmail, setSetupEmail] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [setupConfirm, setSetupConfirm] = useState("");
  const [showSetupPassword, setShowSetupPassword] = useState(false);

  const loginMutation = useLogin();
  const setupMutation = useSetupMainAdmin();

  // Redirect if already logged in
  useEffect(() => {
    const token = getAdminToken();
    if (token && session) {
      navigate({ to: "/panel" });
    }
  }, [session, navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    try {
      const token = await loginMutation.mutateAsync({ email, password });
      if (token) {
        setAdminToken(token);
        toast.success("Login successful");
        navigate({ to: "/panel" });
      } else {
        toast.error("Invalid email or password");
      }
    } catch {
      toast.error("Login failed. Please try again.");
    }
  }

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    if (!setupEmail || !setupPassword) {
      toast.error("Please fill all fields");
      return;
    }
    if (setupPassword !== setupConfirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (setupPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    try {
      const ok = await setupMutation.mutateAsync({
        email: setupEmail,
        password: setupPassword,
      });
      if (ok) {
        toast.success("Main admin account created! Please log in.");
        setSetupEmail("");
        setSetupPassword("");
        setSetupConfirm("");
      } else {
        toast.error("Setup failed. Admin may already exist.");
      }
    } catch {
      toast.error("Setup failed. Please try again.");
    }
  }

  if (setupLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-background"
        data-ocid="admin.loading_state"
      >
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center p-4"
      data-ocid="admin.page"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <ChefHat className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Neta Ji Admin
          </h1>
          <p className="text-muted-foreground mt-1">
            Restaurant Management System
          </p>
        </div>

        {/* First Time Setup */}
        {isSetup === false && (
          <Card className="mb-6 border-amber-500/30 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="w-5 h-5 text-amber-500" />
                First Time Setup
              </CardTitle>
              <CardDescription>
                Create the main admin account to get started.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSetup} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="setup-email">Admin Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="setup-email"
                      type="email"
                      placeholder="admin@example.com"
                      value={setupEmail}
                      onChange={(e) => setSetupEmail(e.target.value)}
                      className="pl-9"
                      data-ocid="admin.setup.email.input"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="setup-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="setup-password"
                      type={showSetupPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      value={setupPassword}
                      onChange={(e) => setSetupPassword(e.target.value)}
                      className="pl-9 pr-9"
                      data-ocid="admin.setup.password.input"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowSetupPassword((v) => !v)}
                    >
                      {showSetupPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="setup-confirm">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="setup-confirm"
                      type="password"
                      placeholder="Repeat password"
                      value={setupConfirm}
                      onChange={(e) => setSetupConfirm(e.target.value)}
                      className="pl-9"
                      data-ocid="admin.setup.confirm_password.input"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={setupMutation.isPending}
                  data-ocid="admin.setup.submit_button"
                >
                  {setupMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                      Creating...
                    </>
                  ) : (
                    "Create Admin Account"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access the dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="login-email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    autoComplete="email"
                    data-ocid="admin.email.input"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9"
                    autoComplete="current-password"
                    data-ocid="admin.password.input"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {loginMutation.isError && (
                <div
                  className="flex items-center gap-2 text-sm text-destructive"
                  data-ocid="admin.error_state"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Invalid email or password. Please try again.</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
                data-ocid="admin.submit_button"
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing
                    in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              <button
                type="button"
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowForgot((v) => !v)}
                data-ocid="admin.forgot_password.button"
              >
                Forgot Password?
              </button>

              {showForgot && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="rounded-lg bg-muted p-3 text-sm text-muted-foreground"
                >
                  <p className="font-medium text-foreground mb-1">
                    Password Reset
                  </p>
                  <p>
                    Please contact the main admin to reset your password. The
                    main admin can use the "Reset Password" option in the Admin
                    Management section of the dashboard.
                  </p>
                </motion.div>
              )}
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            caffeine.ai
          </a>
        </p>
      </motion.div>
    </div>
  );
}
