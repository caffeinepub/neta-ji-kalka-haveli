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
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldCheck, UserPlus, UtensilsCrossed } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { backendInterface as BackendAPI } from "../backend.d";
import { createActorWithConfig } from "../config";
import { hashPassword, saveSession } from "../lib/auth";

type PageMode = "checking" | "setup" | "login";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<PageMode>("checking");

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Setup state
  const [setupEmail, setSetupEmail] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [setupConfirm, setSetupConfirm] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState("");

  useEffect(() => {
    async function checkSetup() {
      try {
        const actor = (await createActorWithConfig()) as unknown as BackendAPI;
        const required = await actor.isSetupRequired();
        setMode(required ? "setup" : "login");
      } catch (err) {
        console.error(err);
        // Default to login if check fails
        setMode("login");
      }
    }
    checkSetup();
  }, []);

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    setSetupError("");
    if (!setupEmail.trim() || !setupPassword || !setupConfirm) {
      setSetupError("All fields are required.");
      return;
    }
    if (setupPassword !== setupConfirm) {
      setSetupError("Passwords do not match.");
      return;
    }
    if (setupPassword.length < 6) {
      setSetupError("Password must be at least 6 characters.");
      return;
    }
    setSetupLoading(true);
    try {
      const actor = (await createActorWithConfig()) as unknown as BackendAPI;
      const hash = await hashPassword(setupPassword);
      await actor.setupMainAdmin(setupEmail.trim().toLowerCase(), hash);
      toast.success("Main admin account created! Please log in.");
      // Switch to login mode with email pre-filled
      setLoginEmail(setupEmail.trim().toLowerCase());
      setSetupEmail("");
      setSetupPassword("");
      setSetupConfirm("");
      setMode("login");
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("already exists")) {
        setSetupError("Setup already completed. Please log in instead.");
        setMode("login");
      } else {
        setSetupError("Setup failed. Please try again.");
      }
    } finally {
      setSetupLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    try {
      const actor = (await createActorWithConfig()) as unknown as BackendAPI;
      const hash = await hashPassword(loginPassword);
      const token = await actor.login(loginEmail.trim().toLowerCase(), hash);
      if (!token) {
        setLoginError("Invalid email or password. Please try again.");
        return;
      }
      const sessionInfo = await actor.validateToken(token);
      if (!sessionInfo) {
        setLoginError("Login failed. Please try again.");
        return;
      }
      saveSession(token, sessionInfo, "admin");
      toast.success("Welcome back!");
      navigate({ to: "/dashboard" });
    } catch (err) {
      console.error(err);
      setLoginError("Login failed. Please check your credentials.");
    } finally {
      setLoginLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[oklch(0.14_0.03_20)] via-[oklch(0.20_0.05_25)] to-[oklch(0.14_0.03_20)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary/20 border-2 border-secondary/40 mb-4">
            <UtensilsCrossed className="h-8 w-8 text-secondary" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white mb-1">
            Neta Ji Kalka Haveli
          </h1>
          <p className="text-white/50 font-body text-sm tracking-widest uppercase">
            Family Restaurant
          </p>
        </div>

        <AnimatePresence mode="wait">
          {mode === "checking" && (
            <motion.div
              key="checking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center py-12"
            >
              <Loader2 className="h-8 w-8 animate-spin text-secondary" />
            </motion.div>
          )}

          {mode === "setup" && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-white/10 bg-white/5 backdrop-blur-md shadow-2xl">
                <CardHeader className="text-center pb-2">
                  <div className="inline-flex items-center justify-center gap-2 mx-auto mb-2">
                    <UserPlus className="h-5 w-5 text-secondary" />
                    <CardTitle className="text-white font-display text-xl">
                      First-Time Setup
                    </CardTitle>
                  </div>
                  <CardDescription className="text-white/50">
                    Create the main admin account to get started
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSetup} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="setup-email"
                        className="text-white/70 text-sm"
                      >
                        Admin Email Address
                      </Label>
                      <Input
                        id="setup-email"
                        type="email"
                        placeholder="shashisingh6745@gmail.com"
                        value={setupEmail}
                        onChange={(e) => setSetupEmail(e.target.value)}
                        required
                        disabled={setupLoading}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-secondary"
                        data-ocid="setup.email.input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="setup-password"
                        className="text-white/70 text-sm"
                      >
                        Password
                      </Label>
                      <Input
                        id="setup-password"
                        type="password"
                        placeholder="Create a strong password"
                        value={setupPassword}
                        onChange={(e) => setSetupPassword(e.target.value)}
                        required
                        disabled={setupLoading}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-secondary"
                        data-ocid="setup.password.input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="setup-confirm"
                        className="text-white/70 text-sm"
                      >
                        Confirm Password
                      </Label>
                      <Input
                        id="setup-confirm"
                        type="password"
                        placeholder="Confirm your password"
                        value={setupConfirm}
                        onChange={(e) => setSetupConfirm(e.target.value)}
                        required
                        disabled={setupLoading}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-secondary"
                        data-ocid="setup.confirm.input"
                      />
                    </div>
                    {setupError && (
                      <div
                        data-ocid="setup.error_state"
                        className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2"
                      >
                        {setupError}
                      </div>
                    )}
                    <Button
                      type="submit"
                      disabled={setupLoading}
                      className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-body font-semibold"
                      data-ocid="setup.submit_button"
                    >
                      {setupLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        "Create Admin Account"
                      )}
                    </Button>
                  </form>
                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="text-white/40 text-sm hover:text-secondary transition-colors"
                      data-ocid="setup.to_login.button"
                    >
                      Already have an account? Sign in
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {mode === "login" && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-white/10 bg-white/5 backdrop-blur-md shadow-2xl">
                <CardHeader className="text-center pb-2">
                  <div className="inline-flex items-center justify-center gap-2 mx-auto mb-2">
                    <ShieldCheck className="h-5 w-5 text-secondary" />
                    <CardTitle className="text-white font-display text-xl">
                      Admin Login
                    </CardTitle>
                  </div>
                  <CardDescription className="text-white/50">
                    Secure admin access portal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-white/70 text-sm">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        disabled={loginLoading}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-secondary"
                        data-ocid="admin.login.input"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label
                        htmlFor="password"
                        className="text-white/70 text-sm"
                      >
                        Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        disabled={loginLoading}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-secondary"
                        data-ocid="admin.password.input"
                      />
                    </div>
                    {loginError && (
                      <div
                        data-ocid="admin.login.error_state"
                        className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2"
                      >
                        {loginError}
                      </div>
                    )}
                    <Button
                      type="submit"
                      disabled={loginLoading}
                      className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-body font-semibold"
                      data-ocid="admin.login.submit_button"
                    >
                      {loginLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In as Admin"
                      )}
                    </Button>
                  </form>
                  <div className="mt-4 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setMode("setup")}
                      className="text-white/40 text-sm hover:text-secondary transition-colors"
                      data-ocid="login.to_setup.button"
                    >
                      First time? Set up here
                    </button>
                    <Link
                      to="/staff-login"
                      className="text-white/40 text-sm hover:text-secondary transition-colors"
                      data-ocid="admin.staff_login.link"
                    >
                      Staff login →
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
