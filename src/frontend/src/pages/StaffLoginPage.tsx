import type { SessionInfo } from "@/backend.d";
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
import {
  AlertCircle,
  Eye,
  EyeOff,
  Info,
  Loader2,
  UtensilsCrossed,
} from "lucide-react";
import { useState } from "react";

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function StaffLoginPage() {
  const { actor, isFetching } = useActor();
  const navigate = useNavigate();
  // biome-ignore lint/suspicious/noExplicitAny: backend.ts types are stale; runtime canister has updated API
  const be = actor as any;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const hash = await hashPassword(password);
      const token: string | null = await be.login(email, hash);
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
      if ("staff" in sessionInfo.role) {
        navigate({ to: "/staff-dashboard" });
      } else {
        navigate({ to: "/dashboard" });
      }
    } catch (err: any) {
      setError(err?.message || "Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary/20 mb-4">
            <UtensilsCrossed className="h-8 w-8 text-secondary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Neta Ji Kalka Haveli
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Family Restaurant — Staff Portal
          </p>
        </div>

        {showForgot ? (
          <Card className="shadow-warm">
            <CardHeader>
              <CardTitle className="font-display text-xl">
                Forgot Password?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert data-ocid="staff-login.success_state">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Please contact the main admin to reset your password.
                </AlertDescription>
              </Alert>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowForgot(false)}
              >
                Back to Login
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-warm">
            <CardHeader>
              <CardTitle className="font-display text-xl">
                Staff Login
              </CardTitle>
              <CardDescription>
                Sign in with your staff credentials.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <Alert
                    variant="destructive"
                    data-ocid="staff-login.error_state"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-1">
                  <Label htmlFor="staff-email">Email</Label>
                  <Input
                    id="staff-email"
                    type="email"
                    placeholder="staff@restaurant.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-ocid="staff-login.email_input"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="staff-pw">Password</Label>
                  <div className="relative">
                    <Input
                      id="staff-pw"
                      type={showPw ? "text" : "password"}
                      placeholder="Your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      data-ocid="staff-login.password_input"
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
                  disabled={isSubmitting || isFetching}
                  data-ocid="staff-login.submit_button"
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
                    onClick={() => setShowForgot(true)}
                    data-ocid="staff-login.forgot_password_link"
                  >
                    Forgot password?
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-sm text-muted-foreground mt-6">
          Admin?{" "}
          <a
            href="/admin-login"
            className="text-primary hover:underline font-medium"
          >
            Go to Admin Login
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
