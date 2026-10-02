import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Field } from "@/routes/auth.login";
import { PageShell } from "@/components/PageShell";
import { useClassConnect } from "@/lib/classconnect";

export const Route = createFileRoute("/auth/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot password — ClassConnect" },
      { name: "description", content: "Get a link to reset your ClassConnect password." },
      { property: "og:title", content: "Forgot password — ClassConnect" },
      { property: "og:description", content: "Get a link to reset your ClassConnect password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { requestPasswordReset } = useClassConnect();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return toast.error("Please enter the email on your account");
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
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
        {sent ? (
          <p className="mt-3 text-sm text-muted-foreground">
            If an account exists for {email}, a reset link is on its way. Open it to choose a new password.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter the email you signed up with and we'll send you a reset link. Accounts created
              without an email can't be reset this way — ask your teacher or create a new account.
            </p>
            <form className="mt-6 space-y-5" onSubmit={submit}>
              <Field label="Email *">
                <input
                  className="cc-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                />
              </Field>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-primary px-4 py-4 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary-dark disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          </>
        )}
      </div>
    </PageShell>
  );
}
