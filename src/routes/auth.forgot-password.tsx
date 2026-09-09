import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Field } from "@/routes/auth.login";
import { PageShell } from "@/components/PageShell";
import { useClassConnect } from "@/lib/classconnect";

export const Route = createFileRoute("/auth/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — ClassConnect" },
      { name: "description", content: "Reset the password for your ClassConnect account." },
      { property: "og:title", content: "Reset password — ClassConnect" },
      {
        property: "og:description",
        content: "Reset the password for your ClassConnect account.",
      },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { resetPassword } = useClassConnect();
  const [identifier, setIdentifier] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      resetPassword(identifier, newPassword);
      toast.success("Password reset successful! You can now login with your new password.");
      navigate({ to: "/auth/login" });
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell title="Forgot password" backTo="/auth/login">
      <div className="cc-card p-6">
        <h2 className="text-2xl font-bold tracking-tight">Reset your password</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your account details and choose a new password
        </p>
        <form className="mt-6 space-y-5" onSubmit={submit}>
          <Field label="Username, Email or Phone *">
            <input
              className="cc-input"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="username / your@email.com"
            />
          </Field>
          <Field label="New Password *">
            <input
              className="cc-input"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 6 characters)"
            />
          </Field>
          <Field label="Confirm Password *">
            <input
              className="cc-input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
            />
          </Field>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary px-4 py-4 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary-dark disabled:opacity-60"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </PageShell>
  );
}
