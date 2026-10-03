import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Field } from "@/routes/auth.login";
import { PageShell } from "@/components/PageShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new password — ClassConnect" },
      { name: "description", content: "Set a new password for your ClassConnect account." },
      { property: "og:title", content: "Choose a new password — ClassConnect" },
      { property: "og:description", content: "Set a new password for your ClassConnect account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (password !== confirm) { toast.error("Passwords do not match"); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated");
    navigate({ to: "/" });
  };

  return (
    <PageShell title="New password" backTo="/auth/login">
      <div className="cc-card p-6">
        <h2 className="text-2xl font-bold tracking-tight">Choose a new password</h2>
        <form className="mt-6 space-y-5" onSubmit={submit}>
          <Field label="New Password *">
            <input className="cc-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Field label="Confirm Password *">
            <input className="cc-input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </Field>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary px-4 py-4 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary-dark disabled:opacity-60"
          >
            {loading ? "Saving..." : "Save Password"}
          </button>
        </form>
      </div>
    </PageShell>
  );
}
