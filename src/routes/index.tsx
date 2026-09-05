import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { GraduationCap, Users } from "lucide-react";
import { useEffect, useState } from "react";

import { useClassConnect, type Role } from "@/lib/classconnect";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ClassConnect — One place for your class" },
      {
        name: "description",
        content:
          "Teachers share timetables, homework, notes and fee details. Students join with a room code and never miss an update.",
      },
      { property: "og:title", content: "ClassConnect — One place for your class" },
      {
        property: "og:description",
        content:
          "Teachers share timetables, homework, notes and fee details. Students join with a room code and never miss an update.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const { ready, user } = useClassConnect();
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    if (!ready || !user) return;
    navigate({ to: user.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard" });
  }, [ready, user, navigate]);

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto max-w-2xl px-6 pb-16 pt-14">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          ClassConnect
        </p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Welcome to ClassConnect
        </h1>
        <p className="mt-3 text-base text-muted-foreground">Choose your role to continue</p>

        <div className="mt-10 grid gap-5">
          <RoleCard
            active={role === "teacher"}
            onSelect={() => setRole("teacher")}
            icon={<GraduationCap className="size-10" />}
            title="Continue as Teacher"
            description="Create and manage your classes, share materials, and track student progress"
          />
          <RoleCard
            active={role === "student"}
            onSelect={() => setRole("student")}
            icon={<Users className="size-10" />}
            title="Continue as Student"
            description="Join your class, access materials, and stay updated with assignments"
          />
        </div>

        <button
          type="button"
          disabled={!role}
          onClick={() => role && navigate({ to: "/auth/sign-up", search: { role } })}
          className="mt-8 w-full rounded-xl bg-primary px-4 py-4 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary-dark disabled:bg-border disabled:text-muted-foreground"
        >
          Continue
        </button>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/auth/login" className="font-semibold text-primary hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

function RoleCard({
  active,
  onSelect,
  icon,
  title,
  description,
}: {
  active: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col items-center rounded-2xl border-2 bg-card p-7 text-center transition-all ${
        active ? "border-primary bg-accent shadow-[var(--shadow-card)]" : "border-border hover:border-primary-light"
      }`}
    >
      <span
        className={`mb-4 flex size-20 items-center justify-center rounded-full transition-colors ${
          active ? "bg-primary text-primary-foreground" : "bg-accent text-primary"
        }`}
      >
        {icon}
      </span>
      <span className="text-xl font-semibold text-foreground">{title}</span>
      <span className="mt-2 text-sm text-muted-foreground">{description}</span>
    </button>
  );
}
