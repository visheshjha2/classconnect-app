import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Field } from "@/routes/auth.login";
import { PageShell } from "@/components/PageShell";
import { useClassConnect, type Role } from "@/lib/classconnect";

export const Route = createFileRoute("/auth/complete-profile")({
  head: () => ({
    meta: [
      { title: "Finish setting up — ClassConnect" },
      { name: "description", content: "Pick your role and finish setting up your ClassConnect account." },
      { property: "og:title", content: "Finish setting up — ClassConnect" },
      { property: "og:description", content: "Pick your role and finish setting up your ClassConnect account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CompleteProfile,
});

function CompleteProfile() {
  const navigate = useNavigate();
  const { ready, user, needsProfile, completeProfile, logout } = useClassConnect();
  const [role, setRole] = useState<Role>("student");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [className, setClassName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (user) navigate({ to: user.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard" });
    else if (!needsProfile) navigate({ to: "/" });
  }, [ready, user, needsProfile, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !username) { toast.error("Please fill in all required fields"); return; }
    if (role === "teacher" && !className) { toast.error("Please enter a class name"); return; }
    if (role === "student" && !roomId) { toast.error("Please enter a room ID to join"); return; }
    setLoading(true);
    try {
      await completeProfile({ role, fullName, username, phone, className, roomId });
      toast.success("Account ready!");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell title="Finish setup" backTo="/">
      <div className="cc-card p-6">
        <h2 className="text-2xl font-bold tracking-tight">Almost there</h2>
        <form className="mt-6 space-y-5" onSubmit={submit}>
          <div className="grid grid-cols-2 gap-3">
            {(["teacher", "student"] as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold capitalize ${
                  role === r ? "border-primary bg-accent text-accent-foreground" : "border-border text-muted-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <Field label="Full Name *">
            <input className="cc-input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </Field>
          <Field label="Username *">
            <input className="cc-input" value={username} onChange={(e) => setUsername(e.target.value.replace(/^@/, ""))} />
          </Field>
          <Field label="Phone Number">
            <input className="cc-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          {role === "teacher" ? (
            <Field label="Class Name *">
              <input className="cc-input" value={className} onChange={(e) => setClassName(e.target.value)} />
            </Field>
          ) : (
            <Field label="Room ID *">
              <input className="cc-input" value={roomId} maxLength={6} onChange={(e) => setRoomId(e.target.value)} />
            </Field>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary px-4 py-4 text-base font-semibold text-primary-foreground hover:bg-primary-dark disabled:opacity-60"
          >
            {loading ? "Saving..." : "Continue"}
          </button>
          <button type="button" onClick={() => void logout()} className="w-full text-sm text-muted-foreground hover:underline">
            Use a different account
          </button>
        </form>
      </div>
    </PageShell>
  );
}
