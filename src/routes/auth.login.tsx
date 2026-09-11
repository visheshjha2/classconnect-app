import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { PageShell } from "@/components/PageShell";
import { useClassConnect, type Role } from "@/lib/classconnect";

export const Route = createFileRoute("/auth/login")({
  head: () => ({
    meta: [
      { title: "Login — ClassConnect" },
      { name: "description", content: "Log in to your ClassConnect teacher or student account." },
      { property: "og:title", content: "Login — ClassConnect" },
      {
        property: "og:description",
        content: "Log in to your ClassConnect teacher or student account.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useClassConnect();
  const [role, setRole] = useState<Role | null>(null);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [roomId, setRoomId] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) {
      toast.error("Please select your role first");
      return;
    }
    if (!identifier || !password) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);
    try {
      login({ role, identifier, password, roomId });
      toast.success("Welcome back!");
      navigate({ to: role === "teacher" ? "/teacher/dashboard" : "/student/dashboard" });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell title="Login" backTo="/">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
        <p className="mt-1 text-sm text-muted-foreground">Login to continue to your class</p>

        <form className="mt-6 space-y-5" onSubmit={submit}>
          <div>
            <span className="mb-2 block text-sm font-semibold">I am a *</span>
            <div className="grid grid-cols-2 gap-3">
              {(["teacher", "student"] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold capitalize transition-colors ${
                    role === r
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-border text-muted-foreground hover:border-primary-light"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <Field label="Username, Email or Phone *">
            <input
              className="cc-input"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="username / your@email.com"
              autoComplete="username"
            />
          </Field>

          <Field label="Password *">
            <input
              className="cc-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </Field>

          {role === "student" ? (
            <Field label="Room ID (only if you haven't joined a class yet)">
              <input
                className="cc-input"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter 6-digit room code"
                maxLength={6}
              />
            </Field>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary px-4 py-4 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary-dark disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-5 space-y-2 text-center text-sm">
          <p>
            <Link to="/auth/forgot-password" className="font-semibold text-primary hover:underline">
              Forgot password?
            </Link>
          </p>
          <p className="text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link to="/auth/sign-up" className="font-semibold text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>

        <div className="mt-6 rounded-xl bg-surface p-4 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">Demo accounts</p>
          <p className="mt-1">Teacher — username: ananya · password: demo123</p>
          <p>Student — username: rahul · password: demo123</p>
        </div>
      </div>
    </PageShell>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}
