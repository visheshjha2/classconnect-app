import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Share2, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { useClassConnect } from "@/lib/classconnect";

export function DashboardHeader({
  greeting,
  subtitle,
  onShare,
}: {
  greeting: string;
  subtitle: string;
  onShare?: () => void;
}) {
  const navigate = useNavigate();
  const { logout } = useClassConnect();

  return (
    <div className="bg-primary px-4 pb-10 pt-8 text-primary-foreground">
      <div className="mx-auto flex max-w-3xl items-start justify-between gap-4">
        <div>
          <p className="text-2xl font-bold tracking-tight">{greeting}</p>
          <p className="mt-1 text-sm opacity-80">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {onShare ? (
            <button
              type="button"
              aria-label="Share class invite"
              onClick={onShare}
              className="flex size-10 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
            >
              <Share2 className="size-5" />
            </button>
          ) : null}
          <button
            type="button"
            aria-label="Log out"
            onClick={() => {
              logout();
              toast.success("Logged out");
              navigate({ to: "/" });
            }}
            className="flex size-10 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
          >
            <LogOut className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="cc-card px-4 py-4 text-center">
      <p className="text-2xl font-bold text-primary">{value}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

export function MenuTile({
  to,
  icon,
  title,
  description,
  count,
}: {
  to: string;
  icon: ReactNode;
  title: string;
  description: string;
  count?: number;
}) {
  return (
    <Link to={to} className="cc-card flex items-center gap-4 p-4 transition-shadow hover:shadow-lg">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-primary">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-foreground">{title}</span>
        <span className="block truncate text-sm text-muted-foreground">{description}</span>
      </span>
      {count && count > 0 ? (
        <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground">
          {count}
        </span>
      ) : null}
    </Link>
  );
}

export function DeleteAccountSection({ isTeacher }: { isTeacher: boolean }) {
  const navigate = useNavigate();
  const { deleteAccount } = useClassConnect();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");

  const confirm = () => {
    try {
      deleteAccount(password);
      toast.success("Your account has been deleted");
      navigate({ to: "/" });
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
      >
        <Trash2 className="size-4" /> Delete Account
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
          <div className="cc-card w-full max-w-md p-6">
            <h2 className="text-lg font-bold">Delete Account</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Warning: This will permanently delete your account
              {isTeacher ? ", class," : ""} and all associated data. This action cannot be undone.
            </p>
            <p className="mt-4 text-sm font-semibold">Enter your password to confirm</p>
            <input
              className="cc-input mt-2"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
            />
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setPassword("");
                }}
                className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-semibold transition-colors hover:bg-accent"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirm}
                className="flex-1 rounded-xl bg-destructive px-4 py-3 text-sm font-semibold text-destructive-foreground transition-colors hover:opacity-90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function useRequireRole(role: "teacher" | "student") {
  const { ready, user } = useClassConnect();
  const navigate = useNavigate();
  if (ready && (!user || user.role !== role)) {
    navigate({ to: "/" });
  }
  return useClassConnect();
}
