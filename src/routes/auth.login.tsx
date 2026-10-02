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
      { property: "og:description", content: "Log in to your ClassConnect teacher or student account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useClassConnect();
  const [role, setRole] = useState<Role | null>(null);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [roomId, setRoomId] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return toast.error("Please select your role first");
    if (!identifier || !password) return toast.error("Please fill in all required fields");
    setLoading(true);
    try {
      await login({ role, identifier, password, roomId });
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
      <div className="cc-card p-6">
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

          <Field label="Username or Email *">
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

        <GoogleButton onClick={loginWithGoogle} />

        <div className="mt-5 space-y-2 text-center text-sm">
          <p>
            <Link to="/auth/forgot-password" className="font-semibold text-primary hover:underline">
              Forgot password?
            </Link>
          </p>
          <p className="text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link to="/" className="font-semibold text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </PageShell>
  );
}

export function GoogleButton({ onClick }: { onClick: () => Promise<void> }) {
  return (
    <>
      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>
      <button
        type="button"
        onClick={() => onClick().catch((e) => toast.error((e as Error).message))}
        className="w-full rounded-xl border border-border bg-card px-4 py-3.5 text-sm font-semibold transition-colors hover:bg-accent"
      >
        Continue with Google
      </button>
    </>
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
