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
import { Loader2, ShieldCheck, UtensilsCrossed } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { backendInterface as BackendAPI } from "../backend.d";
import { createActorWithConfig } from "../config";
import { hashPassword, saveSession } from "../lib/auth";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const actor = (await createActorWithConfig()) as unknown as BackendAPI;
      const hash = await hashPassword(password);
      const token = await actor.login(email.trim().toLowerCase(), hash);
      if (!token) {
        setError("Invalid email or password. Please try again.");
        return;
      }
      const sessionInfo = await actor.validateToken(token);
      if (!sessionInfo) {
        setError("Login failed. Please try again.");
        return;
      }
      saveSession(token, sessionInfo, "admin");
      toast.success("Welcome back!");
      navigate({ to: "/dashboard" });
    } catch (err) {
      console.error(err);
      setError("Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-white/70 text-sm">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-secondary"
                  data-ocid="admin.login.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-white/70 text-sm">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-secondary"
                  data-ocid="admin.password.input"
                />
              </div>
              {error && (
                <div
                  data-ocid="admin.login.error_state"
                  className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2"
                >
                  {error}
                </div>
              )}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-body font-semibold"
                data-ocid="admin.login.submit_button"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In as Admin"
                )}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <Link
                to="/staff-login"
                className="text-white/40 text-sm hover:text-secondary transition-colors"
                data-ocid="admin.staff_login.link"
              >
                Staff? Login here →
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
